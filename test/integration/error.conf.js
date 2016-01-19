'use strict';

var base = require('./karma.conf');

module.exports = function(karma) {

  base(karma);

  karma.set({

    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },

    browserify: {
      debug: true
    },

    reporters: [ 'dots' ],

    logLevel: 'LOG_DEBUG',

    singleRun: true,
    autoWatch: false,
  });
};