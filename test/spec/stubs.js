'use strict';

var _ = require('lodash');


function Logger() {

  var logged = this.logged = [];

  function log(mode, args) {
    var prefix = '[' + mode + '] ';

    args = Array.prototype.slice.call(args);
    logged.push(prefix + args.join(' '));

    if (_.isString(args[0])) {
      args[0] = prefix + args[0];
    } else {
      args.unshift(prefix);
    }

    console.log.apply(console, args);
  }

  this.info = function() {
    log('info', arguments);
  };

  this.error = function() {
    log('error', arguments);
  };

  this.debug = function() {
    log('debug', arguments);
  };

  this.reset = function() {
    logged.length = 0;
  };
}


function LoggerFactory() {

  var loggers = this.loggers = {};

  this.create = function(name) {

    var logger = new Logger();

    loggers[name] = logger;

    return logger;
  };
}


var fs = require('fs');

function File(location) {

  var contents;

  function write(newContents) {
    fs.writeFileSync(location, newContents);
  }

  function load() {
    contents = fs.readFileSync(location);
  }

  this.load = load;
  this.update = write;

  this.remove = function() {
    fs.unlinkSync(location);
  };

  this.restore = function() {
    write(contents);
  };
}


module.exports.File = File;
module.exports.LoggerFactory = LoggerFactory;