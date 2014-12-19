'use strict';

var fail = require('../lib/fail');

describe('failing spec', function() {

  it('should result in nicely formated stack trace', function() {
    fail.throwError('intentional');
  });

});