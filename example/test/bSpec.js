'use strict';

var fs = require('fs');

var b = require('../lib/b');


describe('b', function() {

  var expected = fs.readFileSync(__dirname + '/expected.txt', 'utf8');


  it('should equal fixture contents', function() {
    expect(b).toEqual(expected);
  });

});