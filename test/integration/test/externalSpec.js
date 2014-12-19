'use strict';

var external = require('../lib/external'),
    expectedExternalVersion = require('./helper').externalVersion;


describe('external', function() {

  it('should access non-commonJS library', function() {
    expect(external.version).toEqual(expectedExternalVersion);
  });

});
