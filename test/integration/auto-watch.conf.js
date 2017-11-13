'use strict';

var configure = require('./configure');

var singleRun = require('./single-run.conf');

module.exports = configure(singleRun, function(karma) {

  karma.set({
    singleRun: false,
    autoWatch: true
  });
});