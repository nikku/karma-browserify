'use strict';

var configure = require('./configure');

var base = require('./karma.conf');

module.exports = configure(base, function(karma) {

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

    browserify: {
      debug: true
    },

    reporters: [],

    logLevel: 'ERROR'
  });
});