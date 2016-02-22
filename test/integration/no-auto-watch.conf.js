'use strict';

var base = require('./karma.conf');

module.exports = function(karma) {
  base(karma);

  karma.set({
    files: [
      'vendor/external.js',
      'test/aSpec.js',
      'test/externalSpec.js'
    ],

    preprocessors: {
      'test/*.js': [ 'browserify' ]
    },

    singleRun: false,
    autoWatch: false,

    browserify: {
      debug: true
    },

    reporters: [],

    logLevel: 'ERROR'
  });
};