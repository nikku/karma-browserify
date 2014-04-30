'use strict';

var fs = require('fs'),
    path = require('path'),
    os = require('os'),
    crypto = require('crypto');

/**
 * Hash the given string
 */
function hash(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}

/**
 * Create a temp file unique to the project
 */
function getTempFileName(suffix) {
  return path.join(os.tmpdir(), hash(process.cwd()) + suffix);
}

/**
 * A instance of a bundle file
 */
function BundleFile() {

  var location = getTempFileName('.browserify');

  function write(content) {
    fs.writeFileSync(location, content);
  }

  function exists() {
    return fs.existsSync(location);
  }

  function remove() {
    if (exists()) {
      fs.unlinkSync(location);
    }
  }

  function touch() {
    if (!exists()) {
      write('');
    }
  }


  // API

  this.touch = touch;

  this.update = write;
  this.remove = remove;

  this.location = location;
}


// module exports

module.exports = BundleFile;
module.exports.getTempFileName = getTempFileName;