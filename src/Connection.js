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
