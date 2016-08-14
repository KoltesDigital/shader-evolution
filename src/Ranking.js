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
