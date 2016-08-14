'use strict';

function Roulette(coefficient) {
	this.coefficient = coefficient || 1;
	this.increment = 1;
	this.total = 0;
	this.array = [];
	this.sums = [];
}

Roulette.prototype.add = function(item, factor) {
	this.total += this.increment * (factor || 1);
	this.increment *= this.coefficient;
	this.array.push(item);
	this.sums.push(this.total);
};

Roulette.prototype.draw = function() {
	var r = Math.random() * this.total;
	for (var i = 0, n = this.array.length - 1; i < n; ++i) {
		if (this.sums[i] > r)
			break;
	}

	return this.array[i];
};

module.exports = Roulette;
