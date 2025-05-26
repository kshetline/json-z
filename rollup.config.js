const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const terser = require('@rollup/plugin-terser');
// noinspection JSUnresolvedReference
const dts = require('rollup-plugin-dts').dts;
const shebang = require('rollup-plugin-preserve-shebang');
const json = require('@rollup/plugin-json');
const pkg = require('./package.json');

module.exports = [
  // UMD Minified
  {
    input: 'lib/index.js',
    output: {
      file: pkg['umd:main'],
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
  // CJS module minified
  {
    input: 'lib/index.js',
    output: {
      file: pkg.main,
      sourcemap: true,
      format: 'cjs'
    },
    plugins: [
      resolve(),
      commonjs(),
      terser()
    ]
  },
  // ESM module minified
  {
    input: 'lib/index.js',
    output: {
      file: pkg.module,
      sourcemap: true,
      format: 'esm'
    },
    plugins: [
      resolve(),
      commonjs(),
      terser()
    ]
  },
  // Types
  {
    input: 'lib/index.d.ts',
    output: {
      file: pkg.types,
      format: 'esm'
    },
    plugins: [
      dts()
    ]
  },
  // CLI
  {
    input: 'lib/cli.js',
    output: {
      file: pkg.bin['json-z'],
      format: 'cjs'
    },
    plugins: [
      json(),
      shebang(),
      resolve(),
      commonjs()
    ],
    external: ['fs', 'path']
  }
];
