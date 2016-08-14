'use strict';
/**
 * Represents a node in the shader AST.
 * @interface Node
 */

/**
 * Get the parameters' type.
 * @function
 * @name Node#getInTypes
 * @returns {string[]}
 */

/**
 * Get the resulting type.
 * @function
 * @name Node#getOutType
 * @returns {string}
 */

/**
 * Get the shader representation code.
 * @function
 * @name Node#toString
 * @returns {string}
 */

function getAddRandom(coefficients) {
	return (Math.random() < 0.5 ? 1 : -1) * Math.log(1 - Math.random()) * coefficients.mutateWeightAddCoefficient;
}

function getMultiplyRandom(coefficients) {
	var x = 1 + Math.random() * coefficients.mutateWeightMultiplyCoefficient;
	return (Math.random() < 0.5 ? x : 1/x);
}

/**
 * @class Represents a shader AST.
 */
function Genome() {
	/**
	 * Nodes.
	 * @member {number}
	 */
	this.nodes = [];

	/**
	 * Connections.
	 * @member {number}
	 */
	this.connections = [];
}

/**
 * Adds a connection.
 * @param {Connection} connection
 */
Genome.prototype.addConnection = function(connection) {
	this.connections.push(connection);
};

/**
 * Adds a node.
 * @param {Node} node
 * @returns {number} Node's index.
 */
Genome.prototype.addNode = function(node) {
	var nodeIndex = this.nodes.length;
	this.nodes.push(node);
	return nodeIndex;
};

/**
 * Searchs for a connection path which binds two nodes.
 * @param {number} outNodeIndex
 * @param {number} inNodeIndex
 * @param {boolean} Whether a path exists.
 */
Genome.prototype.areConnected = function(outNodeIndex, inNodeIndex) {
	var awaitingNodeIndexes = [outNodeIndex];
	var addedNodeIndexes = [outNodeIndex];

	var nodeIndex;

	function addNextNodes(connection) {
		if (connection.outNodeIndex === nodeIndex) {
			if (connection.inNodeIndex === inNodeIndex)
				return true;

			if (!addedNodeIndexes.some(function(nodeIndex) {
				return connection.inNodeIndex === nodeIndex;
			})) {
				awaitingNodeIndexes.push(connection.inNodeIndex);
				addedNodeIndexes.push(connection.inNodeIndex);
			}
		}
	}

	while (awaitingNodeIndexes.length > 0) {
		nodeIndex = awaitingNodeIndexes.pop();
		if (this.connections.some(addNextNodes))
			return true;
	}

	return false;
};

/**
 * Searchs for a single connection which binds two nodes.
 * @param {number} outNodeIndex
 * @param {number} inNodeIndex
 * @param {number} inParameterIndex
 * @param {boolean} Whether a connection exists.
 */
Genome.prototype.doesConnectionExist = function(outNodeIndex, inNodeIndex, inParameterIndex) {
	return this.connections.some(function(connection) {
		return connection.outNodeIndex === outNodeIndex &&
			connection.inNodeIndex === inNodeIndex &&
			connection.inParameterIndex === inParameterIndex;
	});
};

/**
 * Returns the topologically sorted nodes.
 * @returns {number[]?} Node indexes, null if cyclic.
 */
Genome.prototype.getSortedNodeIndexes = function() {
	var connections = this.connections;

	var awaitingConnections = connections.slice();

	var connectionCount = this.nodes.map(function() {
		return 0;
	});

	connections.forEach(function(connection) {
		++connectionCount[connection.inNodeIndex];
	});

	var sortedNodeIndexes = [];

	function removeAwaitingConnectionsFilter(connection) {
		if (connection.outNodeIndex === nodeIndex) {
			--connectionCount[connection.inNodeIndex];
			return false;
		}
		return true;
	}

	for (;;) {
		var found = false;
		var nodeIndex;
		for (nodeIndex = 0; nodeIndex < connectionCount.length; ++nodeIndex) {
			if (connectionCount[nodeIndex] === 0) {
				found = true;
				break;
			}
		}
		if (!found)
			break;

		--connectionCount[nodeIndex];
		sortedNodeIndexes.push(nodeIndex);

		awaitingConnections = awaitingConnections.filter(removeAwaitingConnectionsFilter);
	}

	if (awaitingConnections.length > 0) {
		return null;
	}

	return sortedNodeIndexes;
};

/**
 * Checks that connection types are correct and that AST is not cyclic.
 * @returns {boolean} Whether it is valid.
 */
Genome.prototype.isValid = function() {
	var nodes = this.nodes;
	if (!this.connections.every(function(connection) {
		if (typeof connection.outNodeIndex !== 'number' ||
			connection.outNodeIndex < 0 ||
			connection.outNodeIndex >= nodes.length) {
			return false;
		}

		if (typeof connection.inNodeIndex !== 'number' ||
			connection.inNodeIndex < 0 ||
			connection.inNodeIndex >= nodes.length) {
			return false;
		}

		var inTypes = nodes[connection.inNodeIndex].getInTypes();
		if (typeof connection.inParameterIndex !== 'number' ||
			connection.inParameterIndex < 0 ||
			connection.inParameterIndex >= inTypes.length) {
			return false;
		}

		var outType = nodes[connection.outNodeIndex].getOutType();
		var inType = inTypes[connection.inParameterIndex];

		if (outType !== inType) {
			return false;
		}

		return true;
	}))
		return false;

	return this.getSortedNodeIndexes() !== null;
};

/**
 * @param {Coefficients} coefficients
 */
Genome.prototype.mutateWeight = function(coefficients) {
	this.connections.forEach(function(connection) {
		if (Math.random() < coefficients.weightMutationProbability) {
			connection.weight += getAddRandom(coefficients);
			connection.weight *= getMultiplyRandom(coefficients);
		}
	});
};

/**
 * Generates the fragment shader body.
 * If the genome is invalid, the returned array is empty.
 * @returns {string[]} shader lines
 */
Genome.prototype.toShader = function() {
	var nodes = this.nodes;
	var connections = this.connections;

	var sortedNodeIndexes = this.getSortedNodeIndexes();
	if (sortedNodeIndexes === null)
		return [];

	return sortedNodeIndexes.map(function(nodeIndex) {
		var node = nodes[nodeIndex];

		var nodeConnections = node.getInTypes().map(function() {
			return [];
		});

		connections.forEach(function(connection) {
			if (connection.inNodeIndex === nodeIndex)
				nodeConnections[connection.inParameterIndex].push('_' + connection.outNodeIndex + '*' + connection.weight.toFixed(10));
		});

		var parameters = nodeConnections.map(function(connections) {
			return connections.join('+');
		});

		return node.getOutType() + ' _' + nodeIndex + '=' + node.toString(parameters) + ';';
	});
};

module.exports = Genome;
