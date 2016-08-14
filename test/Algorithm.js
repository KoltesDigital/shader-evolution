'use strict';

var assert = require('chai').assert;

var Algorithm = require('../src/Algorithm');
var Connection = require('../src/Connection');
var Genome = require('../src/Genome');
var FunctionCallNode = require('../src/FunctionCallNode');
var InNode = require('../src/InNode');
var OutNode = require('../src/OutNode');
var Ranking = require('../src/Ranking');
var Roulette = require('../src/Roulette');
var Template = require('../src/Template');

var coefficients = {
	bestConnectionProbability: 1,
	distanceDisjoint: 200,
	distanceExcess: 20,
	distanceWeightDifference: 1,
	interspeciesMateProbability: 1,
	maximumRankings: 100,
	mutateWeightAddCoefficient: 1,
	mutateWeightMultiplyCoefficient: 1,
	newConnectionProbability: 0.1,
	newNodeProbability: 0.11,
	selectionCoefficient: 0.9,
	speciesDistanceExponent: 1,
	speciesDistanceThreshold: 1,
	weightMutationProbability: 1,
};

var templates = [
	new Template(1, 'vec3', 'float', function(genome) {
		var nodeIndex = genome.addNode(new FunctionCallNode('length', 'float', ['vec3']));
		return [nodeIndex, 0, nodeIndex];
	}),
	new Template(2, 'float', 'vec3', function(genome) {
		var nodeIndex = genome.addNode(new FunctionCallNode('vec3', 'vec3', ['float']));
		return [nodeIndex, 0, nodeIndex];
	}),
];

describe('Algorithm', function() {
	it('getDistance', function() {
		var algorithm = new Algorithm(coefficients, templates, 0);

		var genomeA = new Genome();
		genomeA.addConnection(new Connection(0, 3, 5, 2, 2));
		genomeA.addConnection(new Connection(1, 3, 5, 2, Infinity));

		var genomeB = new Genome();
		genomeB.addConnection(new Connection(0, 3, 5, 2, 1));
		genomeB.addConnection(new Connection(2, 3, 5, 2, Infinity));

		assert.approximately(algorithm.getDistance(genomeA, genomeB), 111, 0.01);
	});

	it('computeFitnesses', function() {
	});

	it('crossover', function() {
		var algorithm = new Algorithm(coefficients, templates, 0);

		var genomeA = new Genome();
		genomeA.addNode(new OutNode('vec3'));
		genomeA.addNode(new InNode('1.0', 'float'));
		genomeA.addNode(new FunctionCallNode('vec3', 'vec3', ['float']));
		genomeA.addConnection(new Connection(0, 1, 2, 0, 1));
		genomeA.addConnection(new Connection(1, 2, 0, 0, 3));
		genomeA.fitness = 4;

		var genomeB = new Genome();
		genomeB.addNode(new OutNode('vec3'));
		genomeB.addNode(new InNode('1.0', 'float'));
		genomeB.addNode(new FunctionCallNode('vec3', 'vec3', ['float']));
		genomeB.addNode(new FunctionCallNode());
		genomeB.addConnection(new Connection(0, 1, 2, 0, 2));
		genomeB.addConnection(new Connection(2, 2, 0, 0, 4));
		genomeB.fitness = 2;

		var offspring = algorithm.crossover(genomeA, genomeB);
		assert.isTrue(offspring.isValid());

		assert.strictEqual(offspring.nodes.length, 3);

		assert.strictEqual(offspring.connections.length, 2);

		assert.strictEqual(offspring.connections[0].innovation, 0);
		assert.strictEqual(offspring.connections[0].outNodeIndex, 1);
		assert.strictEqual(offspring.connections[0].inNodeIndex, 2);
		assert.strictEqual(offspring.connections[0].inParameterIndex, 0);
		assert.oneOf(offspring.connections[0].weight, [1, 2], 1);
		assert.strictEqual(offspring.connections[0].disabled, false);

		assert.strictEqual(offspring.connections[1].innovation, 1);
		assert.strictEqual(offspring.connections[1].outNodeIndex, 2);
		assert.strictEqual(offspring.connections[1].inNodeIndex, 0);
		assert.strictEqual(offspring.connections[1].inParameterIndex, 0);
		assert.strictEqual(offspring.connections[1].weight, 3);
		assert.strictEqual(offspring.connections[1].disabled, false);
	});

	it('addRandomConnection with no available place', function() {
		var algorithm = new Algorithm(coefficients, templates, 0);

		var genome = new Genome();
		genome.addNode(new OutNode('vec2'));
		genome.addNode(new InNode('in', 'vec2'));
		genome.addConnection(new Connection(0, 1, 0, 0, 0));

		var attempts = 100;
		for (attempts = 100; attempts > 0 && !algorithm.addRandomConnection(genome); --attempts)
		{}
		assert.strictEqual(attempts, 0);

		assert.strictEqual(genome.nodes.length, 2);
		assert.strictEqual(genome.connections.length, 1);
	});

	it('addRandomConnection with no templates available', function() {
		var algorithm = new Algorithm(coefficients, templates, 0);

		var genome = new Genome();
		genome.addNode(new OutNode('vec3'));
		genome.addNode(new InNode('in', 'vec2'));

		var attempts = 100;
		for (attempts = 100; attempts > 0 && !algorithm.addRandomConnection(genome); --attempts)
		{}
		assert.strictEqual(attempts, 0);

		assert.strictEqual(genome.nodes.length, 2);
		assert.strictEqual(genome.connections.length, 0);
	});

	it('addRandomConnection with same types', function() {
		var algorithm = new Algorithm(coefficients, templates, 0);

		var genome = new Genome();
		genome.addNode(new OutNode('vec2'));
		genome.addNode(new InNode('in', 'vec2'));

		var attempts = 100;
		for (attempts = 100; attempts > 0 && !algorithm.addRandomConnection(genome); --attempts)
		{}
		assert.isAbove(attempts, 0);

		assert.strictEqual(genome.nodes.length, 2);
		assert.strictEqual(genome.connections.length, 1);
		assert.strictEqual(genome.connections[0].innovation, 1);
		assert.strictEqual(genome.connections[0].outNodeIndex, 1);
		assert.strictEqual(genome.connections[0].inNodeIndex, 0);
		assert.strictEqual(genome.connections[0].inParameterIndex, 0);
		assert.strictEqual(genome.connections[0].disabled, false);
	});

	it('addRandomConnection with different types', function() {
		var algorithm = new Algorithm(coefficients, templates, 0);

		var genome = new Genome();
		genome.addNode(new OutNode('vec3'));
		genome.addNode(new InNode('in', 'float'));

		var attempts = 100;
		for (attempts = 100; attempts > 0 && !algorithm.addRandomConnection(genome); --attempts)
		{}
		assert.isAbove(attempts, 0);

		assert.strictEqual(genome.nodes.length, 3);
		assert.strictEqual(genome.connections.length, 2);

		assert.strictEqual(genome.connections[0].innovation, 1);
		assert.strictEqual(genome.connections[0].outNodeIndex, 1);
		assert.strictEqual(genome.connections[0].inNodeIndex, 2);
		assert.strictEqual(genome.connections[0].inParameterIndex, 0);
		assert.strictEqual(genome.connections[0].weight, 1);
		assert.strictEqual(genome.connections[0].disabled, false);

		assert.strictEqual(genome.connections[1].innovation, 1);
		assert.strictEqual(genome.connections[1].outNodeIndex, 2);
		assert.strictEqual(genome.connections[1].inNodeIndex, 0);
		assert.strictEqual(genome.connections[1].inParameterIndex, 0);
		assert.notStrictEqual(genome.connections[1].weight, 2);
		assert.strictEqual(genome.connections[1].disabled, false);
	});

	it('addRandomNode', function() {
		var algorithm = new Algorithm(coefficients, templates, 0);

		var genome = new Genome();
		genome.addNode(new OutNode('vec3'));
		genome.addNode(new InNode('in', 'vec3'));
		genome.addConnection(new Connection(0, 1, 0, 0, 2));

		assert.isTrue(algorithm.addRandomNode(genome));

		assert.strictEqual(genome.nodes.length, 4);

		assert.strictEqual(genome.nodes[2].constructor, FunctionCallNode);
		assert.oneOf(genome.nodes[2].string, ['length', 'vec3']);
		assert.oneOf(genome.nodes[2].outType, ['float', 'vec3']);
		assert.strictEqual(genome.nodes[2].inTypes.length, 1);
		assert.oneOf(genome.nodes[2].inTypes[0], ['float', 'vec3']);

		assert.strictEqual(genome.nodes[3].constructor, FunctionCallNode);
		assert.oneOf(genome.nodes[3].string, ['length', 'vec3']);
		assert.oneOf(genome.nodes[3].outType, ['float', 'vec3']);
		assert.strictEqual(genome.nodes[3].inTypes.length, 1);
		assert.oneOf(genome.nodes[3].inTypes[0], ['float', 'vec3']);

		assert.notStrictEqual(genome.nodes[2].string, genome.nodes[3].string);
		assert.notStrictEqual(genome.nodes[2].outType, genome.nodes[3].outType);
		assert.notStrictEqual(genome.nodes[2].inTypes[0], genome.nodes[3].inTypes[0]);

		assert.strictEqual(genome.connections.length, 4);
		genome.connections.sort(function(a, b) {
			if (a.outNodeIndex !== b.outNodeIndex)
				return a.outNodeIndex - b.outNodeIndex;
			return a.inNodeIndex - b.inNodeIndex;
		});

		assert.strictEqual(genome.connections[0].disabled, true);

		assert.strictEqual(genome.connections[1].innovation, 1);
		assert.strictEqual(genome.connections[1].outNodeIndex, 1);
		assert.strictEqual(genome.connections[1].inNodeIndex, genome.connections[3].inNodeIndex === 0 ? 2 : 3);
		assert.strictEqual(genome.connections[1].inParameterIndex, 0);
		assert.strictEqual(genome.connections[1].weight, 1);
		assert.strictEqual(genome.connections[1].disabled, false);

		assert.strictEqual(genome.connections[2].innovation, 1);
		assert.strictEqual(genome.connections[2].outNodeIndex, 2);
		assert.oneOf(genome.connections[2].inNodeIndex, [0, 3]);
		assert.strictEqual(genome.connections[2].inParameterIndex, 0);
		assert.strictEqual(genome.connections[2].weight, genome.connections[2].inNodeIndex === 0 ? 2 : 1);
		assert.strictEqual(genome.connections[2].disabled, false);

		assert.strictEqual(genome.connections[3].innovation, 1);
		assert.strictEqual(genome.connections[3].outNodeIndex, 3);
		assert.oneOf(genome.connections[3].inNodeIndex, [0, 2]);
		assert.strictEqual(genome.connections[3].inParameterIndex, 0);
		assert.strictEqual(genome.connections[3].weight, genome.connections[3].inNodeIndex === 0 ? 2 : 1);
		assert.strictEqual(genome.connections[3].disabled, false);
	});

	it('evolve', function() {
		var algorithm = new Algorithm(coefficients, templates, 10);

		var genome = new Genome();
		genome.addNode(new OutNode('vec3'));
		genome.addNode(new InNode('in', 'vec3'));
		genome.addConnection(new Connection(0, 1, 0, 0, 2));

		algorithm.addGenome(genome);

		algorithm.evolve();
		assert.strictEqual(algorithm.genomes.length, 0);
		assert.strictEqual(algorithm.awaitingRankings.length, 1);
		assert.strictEqual(algorithm.awaitingRankings[0], genome);

		algorithm.addRanking(new Ranking(genome, 1));
		assert.strictEqual(algorithm.awaitingRankings.length, 0);

		algorithm.evolve();
		assert.strictEqual(algorithm.genomes.length, 10);
		assert.strictEqual(algorithm.awaitingRankings.length, 0);
	});

	// highest fitness is sorted first
	function fitnessCompare(genomeA, genomeB) {
		return genomeB.fitness - genomeA.fitness;
	}

	it('rankings', function() {
		var algorithm = new Algorithm(coefficients, templates, 1);

		for (var i = 0; i < 4; ++i) {
			var genome = new Genome();
			genome.addNode(new OutNode('vec3'));
			genome.addNode(new InNode('in', 'vec3'));
			genome.addConnection(new Connection(0, 1, 0, 0, 0.5 + i));
			algorithm.addGenome(genome);
		}

		var ranking1 = new Genome();
		ranking1.addNode(new OutNode('vec3'));
		ranking1.addNode(new InNode('in', 'vec3'));
		ranking1.addConnection(new Connection(0, 1, 0, 0, 1));
		algorithm.addRanking(new Ranking(ranking1, 1));

		var ranking2 = new Genome();
		ranking2.addNode(new OutNode('vec3'));
		ranking2.addNode(new InNode('in', 'vec3'));
		ranking2.addConnection(new Connection(0, 1, 0, 0, 2));
		algorithm.addRanking(new Ranking(ranking2, 5));

		algorithm.computeFitnesses();

		assert.strictEqual(algorithm.genomes.length, 6);

		assert.isTrue(algorithm.genomes[0].wasEvaluated);
		assert.approximately(algorithm.genomes[0].fitness, 1/1.5, 0.01);

		assert.isTrue(algorithm.genomes[1].wasEvaluated);
		assert.approximately(algorithm.genomes[1].fitness, 3/2, 0.01);

		assert.isTrue(algorithm.genomes[2].wasEvaluated);
		assert.approximately(algorithm.genomes[2].fitness, 5/1.5, 0.01);

		assert.isFalse(algorithm.genomes[3].wasEvaluated);

		assert.isTrue(algorithm.genomes[4].wasEvaluated);
		assert.approximately(algorithm.genomes[4].fitness, 1/2, 0.01);

		assert.isTrue(algorithm.genomes[5].wasEvaluated);
		assert.approximately(algorithm.genomes[5].fitness, 5/2, 0.01);

		var evaluatedGenomes = algorithm.extractEvaluatedGenomes();

		assert.strictEqual(evaluatedGenomes.length, 5);

		assert.isTrue(evaluatedGenomes[0].wasEvaluated);
		assert.approximately(evaluatedGenomes[0].fitness, 5/1.5, 0.01);

		assert.isTrue(evaluatedGenomes[1].wasEvaluated);
		assert.approximately(evaluatedGenomes[1].fitness, 5/2, 0.01);

		assert.isTrue(evaluatedGenomes[2].wasEvaluated);
		assert.approximately(evaluatedGenomes[2].fitness, 3/2, 0.01);

		assert.isTrue(evaluatedGenomes[3].wasEvaluated);
		assert.approximately(evaluatedGenomes[3].fitness, 1/1.5, 0.01);

		assert.isTrue(evaluatedGenomes[4].wasEvaluated);
		assert.approximately(evaluatedGenomes[4].fitness, 1/2, 0.01);

		var roulette = new Roulette(algorithm.coefficients.selectionCoefficient);
		var species = algorithm.getSpecies(evaluatedGenomes, roulette);

		assert.strictEqual(species.length, 3);

		assert.strictEqual(species[0].genome, evaluatedGenomes[0]);
		assert.strictEqual(species[0].roulette.array.length, 2);
		assert.strictEqual(species[0].roulette.array[0], evaluatedGenomes[0]);
		assert.strictEqual(species[0].roulette.array[1], evaluatedGenomes[1]);

		assert.strictEqual(species[1].genome, evaluatedGenomes[2]);
		assert.strictEqual(species[1].roulette.array.length, 2);
		assert.strictEqual(species[1].roulette.array[0], evaluatedGenomes[2]);
		assert.strictEqual(species[1].roulette.array[1], evaluatedGenomes[4]);

		assert.strictEqual(species[2].genome, evaluatedGenomes[3]);
		assert.strictEqual(species[2].roulette.array.length, 1);
		assert.strictEqual(species[2].roulette.array[0], evaluatedGenomes[3]);

		assert.strictEqual(roulette.array.length, 5);
		assert.strictEqual(roulette.array[0], evaluatedGenomes[0]);
		assert.strictEqual(roulette.array[1], evaluatedGenomes[1]);
		assert.strictEqual(roulette.array[2], evaluatedGenomes[2]);
		assert.strictEqual(roulette.array[3], evaluatedGenomes[3]);
		assert.strictEqual(roulette.array[4], evaluatedGenomes[4]);
	});
});
