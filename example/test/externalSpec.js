'use strict';

var external = require('external');


describe('external', function() {

  it('should access non-commonJS library', function() {
    expect(external.version).toEqual('0.0.0-alpha');
  });

});
