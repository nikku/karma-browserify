'use strict';

var path = require('path');


/**
 * Defer the execution of the asynchronous function by the given delay,
 * notifying all callbacks once finished.
 */
function deferred(fn, delay) {
  var timeout;

  var listeners = [];

  return function(done) {
    listeners.push(done);

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(function() {

      var localListeners = listeners.slice();

      timeout = null;
      listeners = [];

      fn(function(err, result) {
        localListeners.forEach(function(l) {
          l(err, result);
        });
      });
    }, delay);
  };
}


/**
 * Return a browserify friently relative path for a given
 * karma file descriptor
 */
function relativePath(file, base) {
  return path.relative(base, file.path).replace(/\\/g, '/');
}


// module API

module.exports.deferred = deferred;
module.exports.relativePath = relativePath;