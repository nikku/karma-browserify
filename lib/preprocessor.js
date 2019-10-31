'use strict';

var preprocessor = require('karma/lib/preprocessor');
var os = require('os-shim');
var path = require('path');

function getPreprocessorFactory() {
  var factory = preprocessor.createPriorityPreprocessor;

  if (factory.$inject[0] !== 'config.preprocessors') {
    console.log('incompatible karma preprocessor: the first parametr should be config.preprocessors but', factory.$inject[0]);
    throw new Error('incompatible karma preprocessor');
  }

  return factory;
}


/**
 * Monkey patch preprocessors to preprocess *.browserify.js
 */

var originalFactory = getPreprocessorFactory();

var createPreprocessor = function(config, ...args) {
  // add our preprocessor for .browserify.js files
  config[path.resolve(os.tmpdir(), '*.browserify.js')] = ['browserify-bundle'];

  return originalFactory.apply(null, [config, ...args]);
};

createPreprocessor.$inject = originalFactory.$inject;


// publish patched preprocessor
module.exports.createPreprocessor = createPreprocessor;
