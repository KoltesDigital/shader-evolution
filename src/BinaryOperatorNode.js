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
