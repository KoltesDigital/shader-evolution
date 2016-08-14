'use strict';

var assert = require('chai').assert;

var Connection = require('../src/Connection');
var Genome = require('../src/Genome');
var FunctionCallNode = require('../src/FunctionCallNode');
var InNode = require('../src/InNode');
var OutNode = require('../src/OutNode');

describe('Genome', function() {
	it('areConnected', function() {
		var genome = new Genome();
		genome.addConnection(new Connection(0, 3, 5, 2, 0.1));
		genome.addConnection(new Connection(0, 5, 7, 1, 0.1));

		assert.isTrue(genome.areConnected(3, 5));
		assert.isTrue(genome.areConnected(5, 7));
		assert.isTrue(genome.areConnected(3, 7));
		assert.isFalse(genome.areConnected(7, 3));
		assert.isFalse(genome.areConnected(7, 5));
		assert.isFalse(genome.areConnected(5, 3));
		assert.isFalse(genome.areConnected(2, 3));
		assert.isFalse(genome.areConnected(3, 2));
		assert.isFalse(genome.areConnected(2, 5));
		assert.isFalse(genome.areConnected(5, 2));
	});

	it('doesConnectionExist', function() {
		var genome = new Genome();
		genome.addConnection(new Connection(0, 3, 5, 2, 0.1));

		assert.isTrue(genome.doesConnectionExist(3, 5, 2));
		assert.isFalse(genome.doesConnectionExist(3, 5, 1));
		assert.isFalse(genome.doesConnectionExist(5, 3, 2));
	});

	it('mutateWeight', function() {
		var genome = new Genome();
		genome.addConnection(new Connection(0, 3, 5, 2, 0.1));
		assert.strictEqual(genome.connections[0].weight, 0.1);

		genome.mutateWeight({
			weightMutationProbability: 0,
		});
		assert.strictEqual(genome.connections[0].weight, 0.1);

		genome.mutateWeight({
			mutateWeightAddCoefficient: 1,
			mutateWeightMultiplyCoefficient: 1,
			weightMutationProbability: 1,
		});
		assert.notStrictEqual(genome.connections[0].weight, 0.1);
	});

	it('toShader', function() {
		var genome = new Genome();
		genome.addNode(new OutNode('vec3'));
		genome.addNode(new InNode('1.0', 'float'));
		genome.addNode(new InNode('uResolution', 'vec2'));
		genome.addNode(new FunctionCallNode('f', 'vec3', ['vec2', 'float']));
		genome.addConnection(new Connection(0, 1, 3, 1, 3));
		genome.addConnection(new Connection(0, 2, 3, 0, 2));
		genome.addConnection(new Connection(0, 3, 0, 0, 4));

		assert.isTrue(genome.isValid());
		assert.deepEqual(genome.toShader(), [
			'float _1=1.0;',
			'vec2 _2=uResolution;',
			'vec3 _3=f(_2*2.0000000000,_1*3.0000000000);',
			'vec3 _0=_3*4.0000000000;',
		]);
	});
});
