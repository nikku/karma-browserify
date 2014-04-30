'use strict';

var path = require('path'),
    browserify = require('watchify'),
    convert = require('convert-source-map');

var _ = require('lodash');


var BundleFile = require('./bundle-file');


/**
 * Return a browserify friently relative path for a given
 * karma file descriptor
 */
function relativePath(file, base) {
  return path.relative(base, file.path).replace(/\\/g, '/');
}


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


function Bro(bundleFile) {

  var log;

  /**
   * The browserify framework that creates the initial logger and bundle file
   * as well as prepends the bundle file to the karma file configuration.
   */
  function framework(emitter, config, logger) {

    log = logger.create('framework.browserify');


    if (!bundleFile) {
      bundleFile = new BundleFile();
    }

    bundleFile.touch();
    log.debug('bundle file used: %s', bundleFile.location);


    emitter.on('exit', function(done) {
      bundleFile.remove();
      log.debug('bundle file cleaned up');
      done();
    });


    config.browserify = config.browserify || {};


    // add bundle file first in the list of files
    // so that it gets loaded before preprocessed test files

    config.files.unshift({
      pattern: bundleFile.location,
      served: true,
      included: true,
      watched: true
    });
  }

  framework.$inject = [ 'emitter', 'config', 'logger' ];


  /**
   * A browserify bundle that contains all preprocessed files
   */
  var cachedBundle;


  /**
   * Create the browserify bundle
   */
  function createBundle(config) {

    var bopts = config.browserify;

    var browserifyOptions = _.pick(bopts, [
      'extensions', 'builtins', 'basedir', 'commondir', 'resolve'
    ]);

    var bundle = browserify(browserifyOptions);

    _.forEach(bopts.transform, function(t) {
      bundle.transform(t);
    });


    if (config.autoWatch) {
      log.debug('register bundle update (autoWatch=true)');

      bundle.on('update', function (ids) {

        log.debug('bundle file changed', ids);

        bundle.deferredBundle(function(err, content) {
          if (!err) {
            bundleFile.update(content);
            log.debug('bundle file updated');
          }
        });
      });
    }


    var buildBundle = function (done) {

      log.debug('building bundle');

      var start = new Date();

      bundle.bundle({ debug: bopts.debug }, function(err, content) {
        if (err) {
          log.error('bundle error');
          log.error(err);
          return done(err, null);
        }

        log.info('bundle built (' + (new Date() - start) + 'ms, ' + Math.floor(content.length / 1024) + 'kB)');

        done(err, content);
      });

    }.bind(bundle);

    bundle.deferredBundle = deferred(buildBundle, 1000);

    return bundle;
  }


  /**
   * Return the (cached) bundle that contains all bundled files
   */
  function getBundle(config) {

    if (!cachedBundle) {
      cachedBundle = createBundle(config);
    }

    return cachedBundle;
  }


  /**
   * A processor that preprocesses commonjs test files which should be
   * delivered via browserify.
   */
  function testFilePreprocessor(config) {

    var bundle = getBundle(config);

    var basePath = config.basePath;

    return function (content, file, done) {

      var relativeFile = relativePath(file, basePath);

      // add file to global bundle and make it publicly available
      bundle.add('./' + relativeFile);
      bundle.require('./' + relativeFile);

      log.debug('added file to bundle: %s', relativeFile);

      bundle.deferredBundle(function(err, content) {
        if (err) {
          return done(err, null);
        }

        log.debug('created stub for file: %s', relativeFile);

        // write module stub
        // (make sure not to fail if bundle is not yet loaded)
        content = 'if (window.require) { require("' + bundle._hash(relativeFile) + '"); }';

        done(content);
      });
    };
  }

  testFilePreprocessor.$inject = [ 'config' ];


  /**
   * A special preprocessor that builds the main browserify bundle once and
   * passes the bundle contents through on all later preprocessing request.
   */
  function bundlePreprocessor(config) {

    var bundle = getBundle(config);

    var debug = config.browserify && config.browserify.debug;

    function updateSourceMap(file, content) {
      if (debug) {
        var map = convert.fromSource(content);
        file.sourceMap = map.sourcemap;
      }
    }

    return function (content, file, done) {

      if (!bundle.builtOnce) {
        log.debug('creating initial bundle');

        bundle.deferredBundle(function(err, content) {

          updateSourceMap(file, content);

          // from now on, watchify will directly update the bundle
          // once changes occur
          bundle.builtOnce = true;

          log.debug('built initial bundle');

          done(content);
        });
      } else {
        updateSourceMap(file, content);
        done(content);
      }
    };
  }

  bundlePreprocessor.$inject = [ 'config' ];


  // API

  this.framework = framework;

  this.testFilePreprocessor = testFilePreprocessor;
  this.bundlePreprocessor = bundlePreprocessor;
}


// module exports

module.exports = Bro;