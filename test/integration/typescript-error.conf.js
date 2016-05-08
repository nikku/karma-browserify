'use strict';

var base = require('./karma.conf');

module.exports = function(karma) {
  base(karma);

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
};