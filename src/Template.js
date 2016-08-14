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
