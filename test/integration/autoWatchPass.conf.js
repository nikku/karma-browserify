'use strict';

var base = require('./singleRunPass.conf');

module.exports = function(karma) {
  base(karma);
  karma.set({
    singleRun: false,
    autoWatch: true
  });
};
