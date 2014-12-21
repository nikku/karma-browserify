'use strict';

var base = require('./karma.conf');

module.exports = function(karma) {
  base(karma);
  karma.set({
    reporters: [],
    logLevel: 'OFF',
    files: [ 'vendor/external.js', 'test/aSpec.js' ],
    preprocessors: {
      'lib/*.js': [ 'browserify' ],
      'test/*Spec.js': [ 'browserify' ]
    }
  });
};
