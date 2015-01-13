'use strict';

var fs = require('fs');

function RestorableFile(location) {

  var contents;

  function update(newContents) {
    fs.writeFileSync(location, newContents);
  }

  function load() {
    contents = fs.readFileSync(location);
  }

  this.load = load;
  this.update = update;

  this.remove = function() {
    fs.unlinkSync(location);
  };

  this.restore = function() {
    update(contents);
  };
}

module.exports = RestorableFile;
