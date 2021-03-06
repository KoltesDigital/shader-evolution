'use strict';

var Connection = require('./Connection');
var Genome = require('./Genome');
var OutNode = require('./OutNode');
var Roulette = require('./Roulette');
var Specie = require('./Specie');

// highest fitness is sorted first
function fitnessCompare(genomeA, genomeB) {
	return genomeB.fitness - genomeA.fitness;
}

function randomMax(max) {
	return Math.floor(Math.random() * max);
}

function randomArrayElement(array) {
	return array[randomMax(array.length)];
}

function getRandomWeight() {
	return Math.random() * 2 - 1;
}

/**
 * @typedef Coefficients
 * @type {object}
 * @property {number} bestConnectionProbability Probability to take the connection of the fitest parent for shared connections during crossover.
 * @property {number} distanceDisjoint Coefficent for disjoint connection count in distance computation.
 * @property {number} distanceExcess Coefficent for excess connection count in distance computation.
 * @property {number} distanceWeightDifference Coefficent for weight difference of shared connections in distance computation.
 * @property {number} interspeciesMateProbability Probability of interspecies crossovers.
 * @property {number} maximumRankings Ranking count limit, then oldest rankings will be removed.
 * @property {number} mutateWeightAddCoefficient Coefficient of additive weight multiplication.
 * @property {number} mutateWeightMultiplyCoefficient Coefficient of multiplicative weight multiplication.
 * @property {number} newConnectionProbability Probability of a new connection during crossover.
 * @property {number} newNodeProbability Probability of a new node during crossover.
 * @property {number} selectionCoefficient Roulette wheel coefficient sorted by fitness.
 * @property {number} speciesDistanceExponent Exponent in sharing computation.
 * @property {number} speciesDistanceThreshold Threshold in sharing computation.
 * @property {number} weightMutationProbability Probability of weight mutation during crossover.
 */

/**
 * Executes the genetic process.
 * @class
 * @param {Coefficients} coefficients Computation constants.
 * @param {Template[]} templates Templates.
 * @param {number} populationCount
 */
function Algorithm(coefficients, templates, populationCount) {
	this.coefficients = coefficients;
	this.templates = templates;
	this.populationCount = populationCount;

	/**
	 * Population genomes.
	 * @member {Genome[]}
	 */
	this.genomes = [];

	/**
	 * User-defined rankings used to compute fitness.
	 * @member {Ranking[]}
	 */
	this.rankings = [];

	/**
	 * Genomes which don't belong to any niche.
	 * @member {Genome[]}
	 */
	this.awaitingRankings = [];

	this.nextInnovation = 0;
}

/**
 * Adds a connection between two nodes. If the type doesn't match, it also adds a random template inbetween which connects both types.
 * @param {Genome} genome
 * @param {number} innovation
 * @param {number} outNodeIndex
 * @param {number} inNodeIndex
 * @param {number} inParameterIndex
 * @param {number} weight
 * @returns {boolean} Whether the connection was successful.
 */
Algorithm.prototype.addConnection = function(genome, innovation, outNodeIndex, inNodeIndex, inParameterIndex, weight) {
	var outType = genome.nodes[outNodeIndex].getOutType();
	var inType = genome.nodes[inNodeIndex].getInTypes()[inParameterIndex];
	if (outType === inType) {
		genome.addConnection(new Connection(innovation, outNodeIndex, inNodeIndex, inParameterIndex, weight));
		return true;
	} else {
		var template = this.getRandomTemplate(outType, inType);
		if (template) {
			var results = template.generate(genome, innovation);
			genome.addConnection(new Connection(innovation, outNodeIndex, results[0], results[1], 1));
			genome.addConnection(new Connection(innovation, results[2], inNodeIndex, inParameterIndex, weight));
			return true;
		}
	}
	return false;
};

/**
 * Adds a genome.
 * @param {Genome} genome
 */
Algorithm.prototype.addGenome = function(genome) {
	this.genomes.push(genome);
};

/**
 * Adds a random connection in the genome.
 * @param {Genome} genome
 */
Algorithm.prototype.addRandomConnection = function(genome) {
	for (var attempts = 10; attempts > 0; --attempts) {
		var outNodeIndex = randomMax(genome.nodes.length);
		var inNodeIndex = randomMax(genome.nodes.length);

		if (outNodeIndex === inNodeIndex)
			continue;

		if (genome.nodes[outNodeIndex].constructor === OutNode)
			continue;

		// prevent graph cycles
		if (genome.areConnected(inNodeIndex, outNodeIndex))
			continue;

		var inParameterCount = genome.nodes[inNodeIndex].getInTypes().length;
		if (inParameterCount === 0)
			continue;

		var inParameterIndex = randomMax(inParameterCount);
		if (genome.doesConnectionExist(outNodeIndex, inNodeIndex, inParameterIndex))
			continue;

		return this.addConnection(genome, this.getNewInnovation(), outNodeIndex, inNodeIndex, inParameterIndex, getRandomWeight());
	}
	return false;
};

/**
 * Adds a random node in the genome.
 * @param {Genome} genome
 */
Algorithm.prototype.addRandomNode = function(genome) {
	if (genome.connections.length === 0)
		return false;

	var connection;
	var attempts = 5;
	do {
		connection = randomArrayElement(genome.connections);

		--attempts;
		if (attempts === 0)
			return false;
	} while (connection.disabled);

	connection.disabled = true;

	var template = randomArrayElement(this.templates);
	if (!template)
		return false;

	var innovation = this.getNewInnovation();
	var results = template.generate(genome, innovation);
	return this.addConnection(genome, innovation, connection.outNodeIndex, results[0], results[1], 1) &&
		this.addConnection(genome, innovation, results[2], connection.inNodeIndex, connection.inParameterIndex, connection.weight);
};

/**
 * Adds a ranking. Then removes awaiting rankings which have a sharing with it.
 * @param {Ranking} ranking
 */
Algorithm.prototype.addRanking = function(ranking) {
	this.rankings.push(ranking);

	var that = this;
	var awaitingRankings = this.awaitingRankings;
	this.awaitingRankings = [];

	awaitingRankings.forEach(function(genome) {
		if (that.getSharing(genome, ranking.genome) > 0)
			that.genomes.push(genome);
		else
			that.awaitingRankings.push(genome);
	});

	this.genomes.push(ranking.genome);
};

/**
 * Computes genome's fitness based on rankings.
 * @param {Genome} genome
 */
Algorithm.prototype.computeFitness = function(genome) {
	var that = this;

	var fitnessSum = 0;
	var count = 0;

	this.rankings.forEach(function(ranking) {
		var sharing = that.getSharing(genome, ranking.genome);
		if (sharing > 0) {
			fitnessSum += ranking.fitness;
			++count;
		}
	});

	genome.wasEvaluated = (count > 0);
	if (genome.wasEvaluated)
		genome.fitness = fitnessSum / count;
};

/**
 * Computes all genomes' fitness with explicit fitness sharing.
 */
Algorithm.prototype.computeFitnesses = function() {
	var that = this;

	this.genomes.forEach(function(genomeA) {
		that.computeFitness(genomeA);

		var sharing = that.genomes.reduce(function(sum, genomeB) {
			if (genomeA === genomeB)
				++sum;
			else
				sum += that.getSharing(genomeA, genomeB);
			return sum;
		}, 0);

		genomeA.fitness /= sharing;
	});
};

/**
 * Generates a genome based on two genomes.
 * Assumption: parentA.fitness >= parentB.fitness
 * @param {Genome} parentA
 * @param {Genome} parentB
 * @returns {Genome}
 */
Algorithm.prototype.crossover = function(parentA, parentB) {
	var offspring = new Genome();
	offspring.nodes = parentA.nodes.slice();

	for (var i = 0, n = Math.min(parentA.connections.length, parentB.connections.length); i < n; ++i) {
		var connectionA = parentA.connections[i];
		var connectionB = parentB.connections[i];
		if (connectionA.innovation === connectionB.innovation) {
			if (Math.random() < this.coefficients.bestConnectionProbability) {
				offspring.addConnection(connectionA.clone());
			} else {
				offspring.addConnection(connectionB.clone());
			}
		} else
			break;
	}

	for (; i < parentA.connections.length; ++i) {
		offspring.addConnection(parentA.connections[i].clone());
	}

	offspring.fitness = (parentA.fitness + parentB.fitness) * 0.5;

	return offspring;
};

/**
 * Generates a new population.
 */
Algorithm.prototype.evolve = function() {
	this.computeFitnesses();

	var evaluatedGenomes = this.extractEvaluatedGenomes();

	if (this.awaitingRankings.length > this.coefficients.maximumRankings)
		this.awaitingRankings.splice(0, this.awaitingRankings.length - this.coefficients.maximumRankings);
	this.awaitingRankings.sort(fitnessCompare);

	if (evaluatedGenomes.length === 0)
		return;

	var roulette = new Roulette(this.coefficients.selectionCoefficient);
	var species = this.getSpecies(evaluatedGenomes, roulette);

	while (this.genomes.length < this.populationCount) {
		var parentA = roulette.draw();
		var specieA = parentA.specie;
		var specieB = (Math.random() < this.coefficients.interspeciesMateProbability ? randomArrayElement(species) : specieA);

		var parents = [
			parentA,
			specieB.draw(),
		];
		parents.sort(fitnessCompare);

		var offspring = this.crossover(parents[0], parents[1]);

		if (Math.random() < this.coefficients.newConnectionProbability &&
			!this.addRandomConnection(offspring)) {
				continue;
			}

		if (Math.random() < this.coefficients.newNodeProbability &&
			!this.addRandomNode(offspring)) {
			continue;
		}

		if (!offspring.isValid()) {
			continue;
		}

		offspring.mutateWeight(this.coefficients);

		this.genomes.push(offspring);
	}
};

/**
 * Splits genomes depending on whether there were evaluated, i.e. they have a sharing with at least one rankings.
 * Non-evaluated genomes are inserted into awaitingRankings.
 * @returns {Genome[]} Evaluated genomes.
 */
Algorithm.prototype.extractEvaluatedGenomes = function() {
	var that = this;

	var evaluatedGenomes = [];

	this.genomes.forEach(function(genome) {
		if (!genome.wasEvaluated)
			that.awaitingRankings.push(genome);
		else
			evaluatedGenomes.push(genome);
	});
	this.genomes.length = 0;

	evaluatedGenomes.sort(fitnessCompare);

	return evaluatedGenomes;
};

/**
 * Gets the distance between two genomes.
 * @param {Genome} genomeA
 * @param {Genome} genomeB
 * @returns {number}
 */
Algorithm.prototype.getDistance = function(genomeA, genomeB) {
	var N = Math.max(genomeA.connections.length, genomeB.connections.length);

	// total weight difference
	var W = 0;
	for (var M = 0, n = Math.min(genomeA.connections.length, genomeB.connections.length); M < n; ++M) {
		var connectionA = genomeA.connections[M];
		var connectionB = genomeB.connections[M];
		if (connectionA.innovation === connectionB.innovation)
			W += Math.abs(connectionA.weight - connectionB.weight);
		else
			break;
	}

	// excess genes (those that do not match in the end)
	var E = 0;
	if (M < N) {
		var indexA = genomeA.connections.length - 1;
		var indexB = genomeB.connections.length - 1;
		if (genomeA.connections[indexA].innovation > genomeB.connections[indexB].innovation) {
			while (genomeA.connections[indexA].innovation > genomeB.connections[indexB].innovation) {
				++E;
				--indexA;
			}
		} else {
			while (genomeA.connections[indexA].innovation < genomeB.connections[indexB].innovation) {
				++E;
				--indexB;
			}
		}
	}

	// disjoint genes (those that do not match in the middle)
	var D = genomeA.connections.length + genomeB.connections.length - 2 * M - E;

	return this.coefficients.distanceDisjoint * D /* / N */ +
		this.coefficients.distanceExcess * E /* / N */ +
		this.coefficients.distanceWeightDifference * W /* / M*/;
};

/**
 * Gets a unique innovation number.
 * @returns {number}
 */
Algorithm.prototype.getNewInnovation = function() {
	++this.nextInnovation;
	return this.nextInnovation;
};

/**
 * Gets a random template between two types.
 * @param {string} outType Template's incoming type.
 * @param {string} inType Template's outgoing type.
 * @returns {Template?}
 */
Algorithm.prototype.getRandomTemplate = function(outType, inType) {
	var templates = new Roulette();
	this.templates.forEach(function(template) {
		if (template.outType === outType &&
			template.inType === inType)
			templates.add(template, template.factor);
	});
	return templates.draw();
};

/**
 * Gets the sharing between two genomes.
 * @param {Genome} genomeA
 * @param {Genome} genomeB
 * @returns {number}
 */
Algorithm.prototype.getSharing = function(genomeA, genomeB) {
	var distance = this.getDistance(genomeA, genomeB);
	return Math.max(1 - Math.pow(distance / this.coefficients.speciesDistanceThreshold, this.coefficients.speciesDistanceExponent), 0);
};

/**
 * Gets the sharing between two genomes.
 * @param {Genome[]} evaluatedGenomes
 * @param {Roulette} roulette
 * @returns {Specie[]}
 */
Algorithm.prototype.getSpecies = function(evaluatedGenomes, roulette) {
	var that = this;
	var species = [];

	evaluatedGenomes.forEach(function(genome) {
		roulette.add(genome);
		if (!species.some(function(specie) {
			if (that.getSharing(genome, specie.genome) > 0) {
				specie.add(genome);
				return true;
			}
		})) {
			species.push(new Specie(that.coefficients, genome));
		}
	});

	return species;
};

module.exports = Algorithm;
