'use strict';

var browserify = require('browserify'),
    watchify = require('watchify'),
    convert = require('convert-source-map'),
    minimatch = require('minimatch');

var path = require('path');

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

    // list of patterns using our preprocessor
    var patterns = _.reduce(preprocessors, function(matched, val, key) {
      if (val.indexOf('browserify') !== -1) {
        matched.push(key);
      }
      return matched;
    }, []);

    // first file being preprocessed
    var file = _.find(files, function(f) {
      return _.any(patterns, function(p) {
        return minimatch(f.pattern, p);
      });
    });

    var idx = 0;

    if (file) {
      idx = files.indexOf(file);
    } else {
      log.debug('no matching preprocessed file was found, defaulting to prepend');
    }

    log.debug('add bundle to config.files at position', idx);

    // insert bundle on the correct spot
    files.splice(idx, 0, {
      pattern: bundleFile.location,
      served: true,
      included: true,
      watched: true
    });
  }


  /**
   * The browserify instance that creates the
   * minified bundle and gets added all test files to it.
   */
  var b;


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
    log.debug('created browserify bundle: %s', bundleFile.location);

    b = createBundle(config);

    // TODO(Nikku): hook into karma karmas file update facilities
    // to remove files from the bundle once karma detects the deletion

    // hook into exit for cleanup
    emitter.on('exit', function(done) {
      log.debug('cleaning up');

      b.close();
      bundleFile.remove();
      done();
    });


    // add bundle file to the list of files defined in the
    // configuration. be smart by doing so.
    addBundleFile(bundleFile, config);
  }

  framework.$inject = [ 'emitter', 'config', 'logger' ];


  /**
   * Create the browserify bundle
   */
  function createBundle(config) {

    var bopts = config.browserify || {};

    var browserifyOptions = _.extend({}, watchify.args, bopts);

    var w = watchify(browserify(browserifyOptions));

    _.forEach(bopts.plugin, function(p) {
      // ensure we can pass plugin options as
      // the first parameter
      if (!Array.isArray(p)) {
        p = [p];
      }
      w.plugin.apply(w, p);
    });

    _.forEach(bopts.transform, function(t) {
      // ensure we can pass transform options as
      // the first parameter
      if (!Array.isArray(t)) {
        t = [t];
      }
      w.transform.apply(w, t);
    });

    // test if we have a prebundle function
    if (bopts.prebundle && typeof bopts.prebundle === 'function') {
      bopts.prebundle(w);
    }

    // register rebuild bundle on change
    if (config.autoWatch) {
      log.info('registering rebuild (autoWatch=true)');

      w.on('update', function() {
        log.debug('files changed');
        deferredBundle();
      });
    }

    w.on('log', function(msg) {
      log.info(msg);
    });

    // files contained in bundle
    var files = [];


    // update bundle file
    w.on('bundled', function(err, content) {
      if (w._builtOnce && !err) {
        bundleFile.update(content.toString('utf-8'));
        log.info('bundle updated');
      }

      w._builtOnce = true;
    });


    function deferredBundle(cb) {
      if (cb) {
        w.once('bundled', cb);
      }

      rebuild();
    }


    var MISSING_MESSAGE = /^Cannot find module '([^']+)'/;

    var rebuild = _.debounce(function rebuild() {

      log.debug('bundling');

      w.reset();

      files.forEach(function(f) {
        w.add(f);
      });

      w.bundle(function(err, content) {

        if (err) {
          log.error('bundle error');
          log.error(String(err));


          // try to recover from removed test case
          // rebuild, if successful
          var match = MISSING_MESSAGE.exec(err.message);
          if (match) {
            var idx = files.indexOf(match[1]);

            if (idx !== -1) {
              log.debug('removing %s from bundle', match[1]);
              files.splice(idx, 1);

              log.debug('attempting rebuild');
              return rebuild();
            }
          }
        }

        w.emit('bundled', err, content);
      });
    }, 500);


    w.bundleFile = function(file, done) {

      var absolutePath = file.path,
          relativePath = path.relative(config.basePath, absolutePath);

      if (files.indexOf(absolutePath) === -1) {

        // add file
        log.debug('adding %s to bundle', relativePath);

        files.push(absolutePath);
      }

      deferredBundle(function(err) {
        done(err, '/* bundled */');
      });
    };


    /**
     * Wait for the bundle creation to have stabilized (no more additions) and invoke a callback.
     *
     * @param {Function} cb
     * @param {Number} delay
     * @param {Number} timeout
     */
    w.deferredBundle = deferredBundle;

    return w;
  }


  /**
   * A processor that preprocesses commonjs test files which should be
   * delivered via browserify.
   */
  function testFilePreprocessor() {

    return function(content, file, done) {
      b.bundleFile(file, function(err, content) {
        done(content && content.toString());
      });
    };
  }

  testFilePreprocessor.$inject = [ ];


  /**
   * A special preprocessor that builds the main browserify bundle once and
   * passes the bundle contents through on all later preprocessing request.
   */
  function bundlePreprocessor(config) {

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

    return function(content, file, done) {

      if (b._builtOnce) {
        updateSourceMap(file, content);
        return done(content);
      }

      log.debug('building bundle');

      // wait for the initial bundle to be created
      b.deferredBundle(function(err, content) {

        if (err) {
          return done(err);
        }

        content = content.toString('utf-8');
        updateSourceMap(file, content);

        log.info('bundle built');
        done(content);
      });
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
