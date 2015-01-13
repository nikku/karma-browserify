'use strict';

var base = require('./karma.conf');

module.exports = function(karma) {
  base(karma);

  karma.set({
    files: [
      'vendor/external.js',
      'test/aSpec.js',
      'test/xxaSpec.js',
      'test/externalSpec.js'
    ],

    preprocessors: {
      'test/*.js': [ 'browserify' ]
    },

    reporters: [],

    logLevel: 'ERROR'
  });
};