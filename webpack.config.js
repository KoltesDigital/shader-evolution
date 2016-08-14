var webpack = require('webpack');

var entry = require('./package.json').main;

var header = [
	'/*',
	' * Shader Evolution',
	' * Copyright 2016 Jonathan Giroux',
	' * MIT licence',
	' */',
].join('\n');

module.exports = {
	entry: entry,
	externals: {
	},
	output: {
		path: 'dist',
		filename: 'shader-evolution.js',
		libraryTarget: 'umd',
		library: 'shaderEvolution',
	},
	plugins: [
		new webpack.BannerPlugin(header, { raw: true }),
	],
};
