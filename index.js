'use strict';

var Bro = require('./lib/bro');


var bro = new Bro();

module.exports = {
  'framework:browserify': [ 'factory', bro.framework ],
  'preprocessor:browserify': [ 'factory', bro.testFilePreprocessor ],
  'preprocessor:browserify-bundle': [ 'factory', bro.bundlePreprocessor ]
};


// override the default preprocess factory to add our
// preprocessor for *.browserify files

try {
  module.exports.preprocess = [ 'factory', require('./lib/preprocessor').createPreprocessor ];
} catch (e) {
  console.warn('failed to add custom browserify preprocessor');
  console.warn(e);
}