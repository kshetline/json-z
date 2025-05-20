const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
// noinspection JSUnresolvedReference
const terser = require('rollup-plugin-terser').terser;
const pkg = require('./package.json');

module.exports = [
  // ES6 UMD non-minified
  {
    input: 'lib/index.js',
    output: {
      file: pkg.browser.replace(/\.min\.js$/, '.js'),
      format: 'umd',
      name: 'JSONZ'
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  // ES6 UMD Minified
  {
    input: 'lib/index.js',
    output: {
      file: pkg.browser,
      sourcemap: true,
      format: 'umd',
      name: 'JSONZ'
    },
    plugins: [
      resolve(),
      commonjs(),
      terser()
    ]
  },
  // ES6 module non-minified
  {
    input: 'lib/index.js',
    output: {
      file: pkg.browser.replace(/\.min\.js$/, '.mjs'),
      format: 'esm'
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  // ES6 module Minified
  {
    input: 'lib/index.js',
    output: {
      file: pkg.browser.replace(/\.js$/, '.mjs'),
      sourcemap: true,
      format: 'esm'
    },
    plugins: [
      resolve(),
      commonjs(),
      terser()
    ]
  }
];
