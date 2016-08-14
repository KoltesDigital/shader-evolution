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
