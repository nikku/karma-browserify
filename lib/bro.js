'use strict';

var fs = require('fs'),
    path = require('path'),
    os = require('os'),
    browserify = require('watchify'),
    crypto = require('crypto'),
    convert = require('convert-source-map'),
    _ = require('lodash');


/**
 * Hash the given string
 */
function hash(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}


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


/**
 * A instance of a bundle file
 */
function BundleFile(log) {

  var location = path.join(os.tmpdir(), hash(process.cwd()) + '.browserify');

  function write(content) {
    fs.writeFileSync(location, content);
  }

  function update(content) {
    write(content);
    log.debug('updated bundle file contents');
  }

  function touch() {
    write('');
    log.debug('created bundle file %s', location);
  }

  function remove() {
    fs.unlinkSync(location);
    log.debug('removed bundle file');
  }

  touch();

  // API

  this.update = update;
  this.remove = remove;

  this.location = location;
}


function Bro() {

  var log;

  // the file to write the browserify bundle to
  var bundleFile;


  /**
   * The browserify framework that creates the initial logger and bundle file
   * as well as prepends the bundle file to the karma file configuration.
   */
  function framework(emitter, config, logger) {

    log = logger.create('framework.browserify');


    bundleFile = new BundleFile(log);

    emitter.on('exit', function(done) {
      bundleFile.remove();
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

        log.debug('bundle updated');

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


module.exports = Bro;