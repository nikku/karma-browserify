'use strict';

var karma = require('karma'),
    events = require('events'),
    util = require('util'),
    path = require('path');

var assign = require('lodash/assign');

function Runner() {
  this.reset();
  this.on('newListener', this.listen.bind(this));
}

util.inherits(Runner, events.EventEmitter);

Runner.prototype.start = function(configFile, config, done) {
  if (this.running) throw new Error('Already running');
  if ('function' === typeof config) {
    done = config;
    config = {};
  }
  if ('function' !== typeof done) done = function() {};

  this.running = true;

  var karmaConfiguration = this.configure(configFile, config);

  // karma >= v0.13.x
  if (karma.Server) {
    var server = new karma.Server(karmaConfiguration, done);
    server.start();
  }
  // karma <= v0.12.x
  else {
    karma.server.start(karmaConfiguration, done);
  }
};

Runner.prototype.stop = function() {
  if (!this.stopFn) return;
  this.stopFn(0);
  this.stopFn = null;
};

Runner.prototype.stopAfter = function(ms) {
  if (this.stopTimeout) clearTimeout(this.stopTimeout);
  return this.stopTimeout = setTimeout(this.stop.bind(this), ms);
};

Runner.prototype.reset = function() {
  this.removeAllListeners();
  this.running = false;
  this.reporter = null;
  this.listened = {};
  this.queuedListeners = {};
  this.stopFn = null;
  if (this.stopTimeout) clearTimeout(this.stopTimeout);
  this.stopTimeout = null;
  this.bundler = null;
};

Runner.prototype.configure = function(configFile, config) {
  configFile = path.resolve(configFile);
  var karmaConfig = {};
  require(configFile)({
    set: function(conf) { assign(karmaConfig, conf); }
  });
  config = assign({}, karmaConfig, config);
  return {
    configFile: configFile,
    frameworks: (config.frameworks || ['browserify']).concat('runner'),
    plugins: (config.plugins || ['karma-*']).concat(this.plugin()),
  };
};

Runner.prototype.plugin = function() {
  return { 'framework:runner': ['factory', this.factory()] };
};

Runner.prototype.factory = function() {
  var factory = function(emitter, bundler) {
    this.emitter = emitter;
    this.bundler = bundler;
    emitter.on('exit', function(done) {
      this.reset();
      done();
    }.bind(this));

    emitter.once('run_start', function() {
      // find karma runner SIGINT handler
      this.stopFn = process.listeners('SIGINT').filter(function(fn, idx) {
        return /disconnectBrowsers/.test(fn.toString());
      })[0];
    }.bind(this));
    for (var k in this.queuedListeners) this.listen(k);
    this.emit('framework');
  }.bind(this);
  factory.$inject = ['emitter', 'framework:browserify'];
  return factory;
};

Runner.prototype.listen = function(name) {
  if (!this.emitter) return this.queuedListeners[name] = true;
  if (name in this.listened) return;
  this.listened[name] = true;
  this.emitter.on(name, function() {
    this.emit.apply(this, [name].concat([].slice.apply(arguments)));
  }.bind(this));
};

module.exports = Runner;
