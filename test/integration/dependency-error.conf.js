'use strict';

var configure = require('./configure');

var error = require('./error.conf');

module.exports = configure(error, function(karma) {

  karma.set({
    files: [
      'test/error/dependencyErrorSpec.js'
    ]
  });
});