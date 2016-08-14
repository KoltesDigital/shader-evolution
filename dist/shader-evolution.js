/*
 * Shader Evolution
 * Copyright 2016 Jonathan Giroux
 * MIT licence
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["shaderEvolution"] = factory();
	else
		root["shaderEvolution"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/*
	 * Shader Evolution
	 * Copyright 2016 Jonathan Giroux
	 * MIT licence
	 */

	'use strict';

	module.exports.Algorithm = __webpack_require__(1);
	module.exports.ArrayAccessNode = __webpack_require__(7);
	module.exports.BinaryOperatorNode = __webpack_require__(8);
	module.exports.Connection = __webpack_require__(2);
	module.exports.FunctionCallNode = __webpack_require__(9);
	module.exports.Genome = __webpack_require__(3);
	module.exports.InNode = __webpack_require__(10);
	module.exports.MemberNode = __webpack_require__(11);
	module.exports.OutNode = __webpack_require__(4);
	module.exports.Ranking = __webpack_require__(12);
	module.exports.Template = __webpack_require__(13);
	module.exports.UnaryOperatorNode = __webpack_require__(14);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Connection = __webpack_require__(2);
	var Genome = __webpack_require__(3);
	var OutNode = __webpack_require__(4);
	var Roulette = __webpack_require__(5);
	var Specie = __webpack_require__(6);

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


/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * @class Connection between two nodes.
	 * @param {number} innovation Innovation number.
	 * @param {number} outNodeIndex Incoming node index.
	 * @param {number} inNodeIndex Outgoing node index.
	 * @param {number} inParameterIndex Outgoing parameter index.
	 * @param {number} weight Connection weight.
	 */
	function Connection(innovation, outNodeIndex, inNodeIndex, inParameterIndex, weight) {
		/**
		 * Innovation number.
		 * @member {number}
		 */
		this.innovation = innovation;

		/**
		 * Out node index.
		 * @member {number}
		 */
		this.outNodeIndex = outNodeIndex;

		/**
		 * In node index.
		 * @member {number}
		 */
		this.inNodeIndex = inNodeIndex;

		/**
		 * In parameter index.
		 * @member {number}
		 */
		this.inParameterIndex = inParameterIndex;

		/**
		 * Connection weight.
		 * @member {number}
		 */
		this.weight = weight;

		/**
		 * Whether connection is disabled (i.e. has been replaced by new nodes and connections).
		 * @member {number}
		 */
		this.disabled = false;
	}

	/**
	 * Clones the connection.
	 * @returns {Connection}
	 */
	Connection.prototype.clone = function() {
		var clone = new Connection(this.innovation, this.outNodeIndex, this.inNodeIndex, this.inParameterIndex, this.weight);
		clone.disabled = this.disabled;
		return clone;
	};

	module.exports = Connection;


/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	/**
	 * Represents a node in the shader AST.
	 * @interface Node
	 */

	/**
	 * Get the parameters' type.
	 * @function
	 * @name Node#getInTypes
	 * @returns {string[]}
	 */

	/**
	 * Get the resulting type.
	 * @function
	 * @name Node#getOutType
	 * @returns {string}
	 */

	/**
	 * Get the shader representation code.
	 * @function
	 * @name Node#toString
	 * @returns {string}
	 */

	function getAddRandom(coefficients) {
		return (Math.random() < 0.5 ? 1 : -1) * Math.log(1 - Math.random()) * coefficients.mutateWeightAddCoefficient;
	}

	function getMultiplyRandom(coefficients) {
		var x = 1 + Math.random() * coefficients.mutateWeightMultiplyCoefficient;
		return (Math.random() < 0.5 ? x : 1/x);
	}

	/**
	 * @class Represents a shader AST.
	 */
	function Genome() {
		/**
		 * Nodes.
		 * @member {number}
		 */
		this.nodes = [];

		/**
		 * Connections.
		 * @member {number}
		 */
		this.connections = [];
	}

	/**
	 * Adds a connection.
	 * @param {Connection} connection
	 */
	Genome.prototype.addConnection = function(connection) {
		this.connections.push(connection);
	};

	/**
	 * Adds a node.
	 * @param {Node} node
	 * @returns {number} Node's index.
	 */
	Genome.prototype.addNode = function(node) {
		var nodeIndex = this.nodes.length;
		this.nodes.push(node);
		return nodeIndex;
	};

	/**
	 * Searchs for a connection path which binds two nodes.
	 * @param {number} outNodeIndex
	 * @param {number} inNodeIndex
	 * @param {boolean} Whether a path exists.
	 */
	Genome.prototype.areConnected = function(outNodeIndex, inNodeIndex) {
		var awaitingNodeIndexes = [outNodeIndex];
		var addedNodeIndexes = [outNodeIndex];

		var nodeIndex;

		function addNextNodes(connection) {
			if (connection.outNodeIndex === nodeIndex) {
				if (connection.inNodeIndex === inNodeIndex)
					return true;

				if (!addedNodeIndexes.some(function(nodeIndex) {
					return connection.inNodeIndex === nodeIndex;
				})) {
					awaitingNodeIndexes.push(connection.inNodeIndex);
					addedNodeIndexes.push(connection.inNodeIndex);
				}
			}
		}

		while (awaitingNodeIndexes.length > 0) {
			nodeIndex = awaitingNodeIndexes.pop();
			if (this.connections.some(addNextNodes))
				return true;
		}

		return false;
	};

	/**
	 * Searchs for a single connection which binds two nodes.
	 * @param {number} outNodeIndex
	 * @param {number} inNodeIndex
	 * @param {number} inParameterIndex
	 * @param {boolean} Whether a connection exists.
	 */
	Genome.prototype.doesConnectionExist = function(outNodeIndex, inNodeIndex, inParameterIndex) {
		return this.connections.some(function(connection) {
			return connection.outNodeIndex === outNodeIndex &&
				connection.inNodeIndex === inNodeIndex &&
				connection.inParameterIndex === inParameterIndex;
		});
	};

	/**
	 * Returns the topologically sorted nodes.
	 * @returns {number[]?} Node indexes, null if cyclic.
	 */
	Genome.prototype.getSortedNodeIndexes = function() {
		var connections = this.connections;

		var awaitingConnections = connections.slice();

		var connectionCount = this.nodes.map(function() {
			return 0;
		});

		connections.forEach(function(connection) {
			++connectionCount[connection.inNodeIndex];
		});

		var sortedNodeIndexes = [];

		function removeAwaitingConnectionsFilter(connection) {
			if (connection.outNodeIndex === nodeIndex) {
				--connectionCount[connection.inNodeIndex];
				return false;
			}
			return true;
		}

		for (;;) {
			var found = false;
			var nodeIndex;
			for (nodeIndex = 0; nodeIndex < connectionCount.length; ++nodeIndex) {
				if (connectionCount[nodeIndex] === 0) {
					found = true;
					break;
				}
			}
			if (!found)
				break;

			--connectionCount[nodeIndex];
			sortedNodeIndexes.push(nodeIndex);

			awaitingConnections = awaitingConnections.filter(removeAwaitingConnectionsFilter);
		}

		if (awaitingConnections.length > 0) {
			return null;
		}

		return sortedNodeIndexes;
	};

	/**
	 * Checks that connection types are correct and that AST is not cyclic.
	 * @returns {boolean} Whether it is valid.
	 */
	Genome.prototype.isValid = function() {
		var nodes = this.nodes;
		if (!this.connections.every(function(connection) {
			if (typeof connection.outNodeIndex !== 'number' ||
				connection.outNodeIndex < 0 ||
				connection.outNodeIndex >= nodes.length) {
				return false;
			}

			if (typeof connection.inNodeIndex !== 'number' ||
				connection.inNodeIndex < 0 ||
				connection.inNodeIndex >= nodes.length) {
				return false;
			}

			var inTypes = nodes[connection.inNodeIndex].getInTypes();
			if (typeof connection.inParameterIndex !== 'number' ||
				connection.inParameterIndex < 0 ||
				connection.inParameterIndex >= inTypes.length) {
				return false;
			}

			var outType = nodes[connection.outNodeIndex].getOutType();
			var inType = inTypes[connection.inParameterIndex];

			if (outType !== inType) {
				return false;
			}

			return true;
		}))
			return false;

		return this.getSortedNodeIndexes() !== null;
	};

	/**
	 * @param {Coefficients} coefficients
	 */
	Genome.prototype.mutateWeight = function(coefficients) {
		this.connections.forEach(function(connection) {
			if (Math.random() < coefficients.weightMutationProbability) {
				connection.weight += getAddRandom(coefficients);
				connection.weight *= getMultiplyRandom(coefficients);
			}
		});
	};

	/**
	 * Generates the fragment shader body.
	 * If the genome is invalid, the returned array is empty.
	 * @returns {string[]} shader lines
	 */
	Genome.prototype.toShader = function() {
		var nodes = this.nodes;
		var connections = this.connections;

		var sortedNodeIndexes = this.getSortedNodeIndexes();
		if (sortedNodeIndexes === null)
			return [];

		return sortedNodeIndexes.map(function(nodeIndex) {
			var node = nodes[nodeIndex];

			var nodeConnections = node.getInTypes().map(function() {
				return [];
			});

			connections.forEach(function(connection) {
				if (connection.inNodeIndex === nodeIndex)
					nodeConnections[connection.inParameterIndex].push('_' + connection.outNodeIndex + '*' + connection.weight.toFixed(10));
			});

			var parameters = nodeConnections.map(function(connections) {
				return connections.join('+');
			});

			return node.getOutType() + ' _' + nodeIndex + '=' + node.toString(parameters) + ';';
		});
	};

	module.exports = Genome;


/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * Represents the final variable.
	 * @class
	 * @implements {Node}
	 * @param {string} type Variable type.
	 */
	function OutNode(type) {
		this.outType = type;
		this.inTypes = [type];
	}

	OutNode.prototype.getInTypes = function() {
		return this.inTypes;
	};

	OutNode.prototype.getOutType = function() {
		return this.outType;
	};

	OutNode.prototype.toString = function(parameters) {
		return parameters[0];
	};

	module.exports = OutNode;


/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	function Roulette(coefficient) {
		this.coefficient = coefficient || 1;
		this.increment = 1;
		this.total = 0;
		this.array = [];
		this.sums = [];
	}

	Roulette.prototype.add = function(item, factor) {
		this.total += this.increment * (factor || 1);
		this.increment *= this.coefficient;
		this.array.push(item);
		this.sums.push(this.total);
	};

	Roulette.prototype.draw = function() {
		var r = Math.random() * this.total;
		for (var i = 0, n = this.array.length - 1; i < n; ++i) {
			if (this.sums[i] > r)
				break;
		}

		return this.array[i];
	};

	module.exports = Roulette;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Roulette = __webpack_require__(5);

	function Specie(coefficients, genome) {
		this.genome = genome;
		this.roulette = new Roulette(coefficients.selectionCoefficient);
		this.add(genome);
	}

	Specie.prototype.add = function(genome) {
		this.roulette.add(genome);
		genome.specie = this;
	};

	Specie.prototype.draw = function() {
		return this.roulette.draw();
	};

	module.exports = Specie;


/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * Represents a member call with dot notation.
	 * @class
	 * @implements {Node}
	 * @param {number} index Index.
	 * @param {string} outType Resulting type.
	 * @param {string} inType Variable type.
	 */
	function ArrayAccessNode(index, outType, inType) {
		this.index = index;
		this.outType = outType;
		this.inTypes = [inType];
	}

	ArrayAccessNode.prototype.getInTypes = function() {
		return this.inTypes;
	};

	ArrayAccessNode.prototype.getOutType = function() {
		return this.outType;
	};

	ArrayAccessNode.prototype.toString = function(parameters) {
		return '(' + parameters[0] + ')[' + this.index + ']';
	};

	module.exports = ArrayAccessNode;


/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * Represents a binary operator with infix notation.
	 * @class
	 * @implements {Node}
	 * @param {string} string Operator.
	 * @param {string} outType Resulting type.
	 * @param {string[]} inTypes Operand types (length shall be 2).
	 */
	function BinaryOperatorNode(string, outType, inTypes) {
		this.string = string;
		this.outType = outType;
		this.inTypes = inTypes;
	}

	BinaryOperatorNode.prototype.getInTypes = function() {
		return this.inTypes;
	};

	BinaryOperatorNode.prototype.getOutType = function() {
		return this.outType;
	};

	BinaryOperatorNode.prototype.toString = function(parameters) {
		return '(' + parameters[0] + ')' + this.string + '(' + parameters[1] + ')';
	};

	module.exports = BinaryOperatorNode;


/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * Represents a function call.
	 * @class
	 * @implements {Node}
	 * @param {string} string Function name.
	 * @param {string} outType Resulting type.
	 * @param {string[]} inTypes Parameter types.
	 */
	function FunctionCallNode(string, outType, inTypes) {
		this.string = string;
		this.outType = outType;
		this.inTypes = inTypes;
	}

	FunctionCallNode.prototype.getInTypes = function() {
		return this.inTypes;
	};

	FunctionCallNode.prototype.getOutType = function() {
		return this.outType;
	};

	FunctionCallNode.prototype.toString = function(parameters) {
		return this.string + '(' + parameters.join(',') + ')';
	};

	module.exports = FunctionCallNode;


/***/ },
/* 10 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * Represents a constant used by the shader.
	 * @class
	 * @implements {Node}
	 * @param {string} string Constant.
	 * @param {string} outType Resulting type.
	 */
	function InNode(string, outType) {
		this.string = string;
		this.outType = outType;
		this.inTypes = [];
	}

	InNode.prototype.getInTypes = function() {
		return this.inTypes;
	};

	InNode.prototype.getOutType = function() {
		return this.outType;
	};

	InNode.prototype.toString = function() {
		return this.string;
	};

	module.exports = InNode;


/***/ },
/* 11 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * Represents a member call with dot notation.
	 * @class
	 * @implements {Node}
	 * @param {string} string Member name.
	 * @param {string} outType Resulting type.
	 * @param {string} inType Variable type.
	 */
	function MemberNode(string, outType, inType) {
		this.string = string;
		this.outType = outType;
		this.inTypes = [inType];
	}

	MemberNode.prototype.getInTypes = function() {
		return this.inTypes;
	};

	MemberNode.prototype.getOutType = function() {
		return this.outType;
	};

	MemberNode.prototype.toString = function(parameters) {
		return '(' + parameters[0] + ').' + this.string;
	};

	module.exports = MemberNode;


/***/ },
/* 12 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * User ranking used for fitness computation.
	 * @class
	 * @param {Genome} genome Genome.
	 * @param {number} fitness Fitness.
	 */
	function Ranking(genome, fitness) {
		this.genome = genome;
		this.fitness = fitness;
	}

	module.exports = Ranking;


/***/ },
/* 13 */
/***/ function(module, exports) {

	'use strict';
	/**
	 * @callback Template~Generate
	 * @param {Genome} genome Genome.
	 * @param {number} innovation Innovation number.
	 */

	/**
	 * Generates a link from outType to inType, made of nodes and/or connections.
	 * @class
	 * @param {string} outType Incoming type.
	 * @param {string} inType Outgoing type.
	 * @param {Template~Generate} generate Generate function.
	 */
	function Template(factor, outType, inType, generate) {
		this.factor = factor;
		this.outType = outType;
		this.inType = inType;
		this.generate = generate;
	}

	module.exports = Template;


/***/ },
/* 14 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * Represents an unary operator with prefix notation.
	 * @class
	 * @implements {Node}
	 * @param {string} string Operator.
	 * @param {string} outType Resulting type.
	 * @param {string} inType Operand type.
	 */
	function UnaryOperatorNode(string, outType, inType) {
		this.string = string;
		this.outType = outType;
		this.inTypes = [inType];
	}

	UnaryOperatorNode.prototype.getInTypes = function() {
		return this.inTypes;
	};

	UnaryOperatorNode.prototype.getOutType = function() {
		return this.outType;
	};

	UnaryOperatorNode.prototype.toString = function(parameters) {
		return '(' + this.string + '(' + parameters[0] + '))';
	};

	module.exports = UnaryOperatorNode;


/***/ }
/******/ ])
});
;