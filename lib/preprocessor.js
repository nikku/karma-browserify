'use strict';

var preprocessor = require('karma/lib/preprocessor');
var os = require('os-shim');
var path = require('path');

var api = ['config.preprocessors', 'config.basePath', 'config.preprocessorOrder', 'injector'];


function arrayEquals(a, b) {
  return a.join('#') === b.join('#');
}


function getPreprocessorFactory() {

  var factory = preprocessor.createPreprocessor;

  if (!arrayEquals(factory.$inject, api)) {
    console.log('incompatible karma preprocessor: found', factory.$inject, 'expected', api);
    throw new Error('incompatible karma preprocessor');
  }

  return factory;
}


/**
 * Monkey patch preprocessors to preprocess *.browserify
 */

var originalFactory = getPreprocessorFactory();

var createPreprocessor = function(config, basePath, ppOrder, injector) {

  // add our preprocessor for .browserify files
  config[path.resolve(os.tmpdir(), '*.browserify')] = ['browserify-bundle'];

  return originalFactory(config, basePath, ppOrder, injector);
};

createPreprocessor.$inject = api;


// publish patched preprocessor
module.exports.createPreprocessor = createPreprocessor;
