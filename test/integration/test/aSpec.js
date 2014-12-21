'use strict';

var a = require('../lib/a');

describe('a', function() {
  it('should equal fixture contents', function() {
    expect(a).toEqual('A');
  });
});