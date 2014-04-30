'use strict';


function Logger() {

  var logged = this.logged = [];

  function log(mode, args) {
    args = Array.prototype.slice.call(args);

    logged.push('[' + mode + '] ' + args.join(' '));
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

  this.restore = function() {
    write(contents);
  };
}


module.exports.File = File;
module.exports.LoggerFactory = LoggerFactory;