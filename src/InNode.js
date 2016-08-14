'use strict';

/**
 * Represents a constant used by the shader.
 * @class
 * @implements {Node}
 * @param {string} string Constant.
 * @param {string} outType Resulting type.
 */
function InNode(string, outType) {
	this.string = string;
	this.outType = outType;
	this.inTypes = [];
}

InNode.prototype.getInTypes = function() {
	return this.inTypes;
};

InNode.prototype.getOutType = function() {
	return this.outType;
};

InNode.prototype.toString = function() {
	return this.string;
};

module.exports = InNode;
