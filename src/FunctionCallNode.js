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
