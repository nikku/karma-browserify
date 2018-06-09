'use strict';

var configure = require('./configure');

var base = require('./karma.conf');

module.exports = configure(base, function(karma) {

  karma.set({

    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },

    browserify: {
      debug: true
    },

    reporters: [ 'dots' ],

    logLevel: 'DEBUG',

    singleRun: true,
    autoWatch: false,
  });
});