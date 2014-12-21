'use strict';

var base = require('./single-run.conf');

module.exports = function(karma) {
  base(karma);

  karma.set({
    singleRun: false,
    autoWatch: true
  });
};