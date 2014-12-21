'use strict';

var base = require('./karma.conf');

module.exports = function(karma) {
  base(karma);

  karma.set({
    files: [
      'vendor/external.js',
      'test/externalSpec.js'
    ],

    preprocessors: {
      'test/externalSpec.js': [ 'browserify' ]
    },

    reporters: [],

    logLevel: 'ERROR',
  });
};