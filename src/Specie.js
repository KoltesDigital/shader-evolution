'use strict';

var Roulette = require('./Roulette');

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
