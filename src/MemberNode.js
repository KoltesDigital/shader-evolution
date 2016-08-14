'use strict';

/**
 * Represents a member call with dot notation.
 * @class
 * @implements {Node}
 * @param {string} string Member name.
 * @param {string} outType Resulting type.
 * @param {string} inType Variable type.
 */
function MemberNode(string, outType, inType) {
	this.string = string;
	this.outType = outType;
	this.inTypes = [inType];
}

MemberNode.prototype.getInTypes = function() {
	return this.inTypes;
};

MemberNode.prototype.getOutType = function() {
	return this.outType;
};

MemberNode.prototype.toString = function(parameters) {
	return '(' + parameters[0] + ').' + this.string;
};

module.exports = MemberNode;
