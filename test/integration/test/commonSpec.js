'use strict';

var common = require('../lib/common');


describe('common', function() {

  it('should expose a', function() {
    expect(common.a).toEqual('A');
  });

});