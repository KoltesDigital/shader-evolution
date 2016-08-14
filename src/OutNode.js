'use strict';

/**
 * Represents the final variable.
 * @class
 * @implements {Node}
 * @param {string} type Variable type.
 */
function OutNode(type) {
	this.outType = type;
	this.inTypes = [type];
}

OutNode.prototype.getInTypes = function() {
	return this.inTypes;
};

OutNode.prototype.getOutType = function() {
	return this.outType;
};

OutNode.prototype.toString = function(parameters) {
	return parameters[0];
};

module.exports = OutNode;
