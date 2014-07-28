'use strict';

var util = require('./util'),
    browserify = require('watchify'),
    convert = require('convert-source-map');

var _ = require('lodash');


var BundleFile = require('./bundle-file');


function Bro(bundleFile) {

  var log;

  /**
   * Add bundle file to the list of files in the
   * configuration, right before the first browserified
   * test file and after everything else.
   *
   * That makes sure users can include non-commonJS files
   * prior to the browserified bundle.
   *
   * @param {BundleFile} bundleFile the file containing the browserify bundle
   * @param {Object} config the karma configuration to be updated
   */
  function addBundleFile(bundleFile, config) {

    var files = config.files,
        preprocessors = config.preprocessors;

    // TODO(Nikku): properly compare patterns from config.files and
    // config.preprocessors with ['browserify'] specified. Is this even
    // possible on glob expressions?

    // list of patterns using our preprocessor
    var patterns = _.reduce(preprocessors, function(matched, val, key) {
      if (val.indexOf('browserify') !== -1) {
        matched.push(key);
      }
      return matched;
    }, []);

    // first file being preprocessed
    var file = _.find(files, function(f) {
      return patterns.indexOf(f.pattern) !== -1;
    });

    var idx = 0;

    if (file) {
      idx = files.indexOf(file);
    } else {
      log.debug('no matching preprocessed file was found, defaulting to prepend');
    }

    log.debug('insert browserified bundle in config.files at position', idx);

    // insert bundle on the correct spot
    files.splice(idx, 0, {
      pattern: bundleFile.location,
      served: true,
      included: true,
      watched: true
    });
  }


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
      getBundle(config).close();
      bundleFile.remove();
      log.debug('bundle file cleaned up');
      done();
    });


    config.browserify = config.browserify || {};

    // add bundle file to the list of files defined in the
    // configuration. be smart by doing so.
    addBundleFile(bundleFile, config);
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

    _.forEach(bopts.plugin, function(p) {
      // ensure we can pass plugin options as
      // the first parameter
      if (!Array.isArray(p)) {
        p = [p];
      }
      bundle.plugin.apply(bundle, p);
    });

    _.forEach(bopts.transform, function(t) {
      // ensure we can pass transform options as
      // the first parameter
      if (!Array.isArray(t)) {
        t = [t];
      }
      bundle.transform.apply(bundle, t);
    });

    // Test if we have a prebundle function
    if (bopts.prebundle && typeof bopts.prebundle == "function") {
      bopts.prebundle(bundle);
    }

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


    var buildBundle = function(done) {

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

    bundle.deferredBundle = util.deferred(buildBundle, 1000);

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

      var fileName = util.relativePath(file, basePath);

      var relativeFile = './' + fileName;

      // add file to global bundle and make it publicly available
      bundle.add(relativeFile);
      bundle.require(relativeFile);

      log.debug('added file to bundle: %s', fileName);

      bundle.deferredBundle(function(err, content) {
        if (err) {
          return done(err, null);
        }

        log.debug('created stub for file: %s', fileName);

        // write module stub
        // (make sure not to fail if bundle is not yet loaded)
        content = 'if (window.require) { require("' + relativeFile + '"); }';

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
      var map;

      if (debug) {
        map = convert.fromSource(content);

        if (map) {
          file.sourceMap = map.sourcemap;
        }
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
