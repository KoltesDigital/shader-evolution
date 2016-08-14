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
