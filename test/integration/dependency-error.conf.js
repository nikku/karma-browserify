'use strict';

var base = require('./error.conf');

module.exports = function(karma) {

  base(karma);

  karma.set({
    files: [
      'test/error/dependencyErrorSpec.js'
    ]
  });
};