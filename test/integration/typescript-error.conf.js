'use strict';

var configure = require('./configure');

var base = require('./karma.conf');

module.exports = configure(base, function(karma) {

  karma.set({
    files: [
      'ts/*.spec.ts'
    ],

    preprocessors: {
      'ts/*.ts': [ 'browserify' ]
    },

    browserify: {
      debug: true,
      plugin: [ 'tsify' ]
    },

    reporters: [ ],

    logLevel: 'ERROR'
  });
});