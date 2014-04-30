'use strict';

var _ = require('lodash');

var events = require('events');

var Bro = require('../../lib/bro'),
    BundleFile = require('../../lib/bundle-file');

var stubs = require('./stubs');


function delay(fn, time) {
  setTimeout(fn, time || 205);
}


function createFilePattern(file) {
  return {
    pattern: file,
    served: true,
    included: true,
    watched: true
  };
}

function createFile(path) {
  return {
    path: path
  };
}

function createConfig(config) {
  return _.merge({
    basePath: '',
    files: [ createFilePattern('*.js') ],
    preprocessors: {
      '*.js': [ 'browserify' ]
    }
  }, config || {});
}


describe('bro', function() {

  var emitter, loggerFactory, bundle, bro;

  beforeEach(function() {

    emitter = new events.EventEmitter();
    loggerFactory = new stubs.LoggerFactory();

    bundle = new BundleFile();

    spyOn(bundle, 'update').andCallThrough();
    spyOn(bundle, 'touch').andCallThrough();
    spyOn(bundle, 'remove').andCallThrough();

    bro = new Bro(bundle);
  });


  afterEach(function() {
    bundle.remove();
  });


  function createPlugin(config) {

    return {
      framework: bro.framework(emitter, config, loggerFactory),
      testFilePreprocessor: bro.testFilePreprocessor(config),
      bundlePreprocessor: bro.bundlePreprocessor(config)
    };
  }


  function preprocess(plugin, bundle, testFiles, done) {

    var total = 1 + testFiles.length;

    var processed = [];

    function fileProcessed(file, result) {
      file.bundled = result;

      processed.push(file);

      if (processed.length == total) {
        done(processed);
      }
    }

    function process(preprocessor, file) {
      preprocessor(file.bundled || '', file, function(result) {
        fileProcessed(file, result);
      });
    }

    process(plugin.bundlePreprocessor, bundle);

    _.forEach(testFiles, function(file) {
      process(plugin.testFilePreprocessor, file);
    });
  }


  describe('framework', function() {

    it('should prepend and init browserify bundle file', function() {

      // given
      var config = createConfig();

      // when
      createPlugin(config);

      // then
      expect(bundle.touch).toHaveBeenCalled();

      expect(config.files[0].pattern).toEqual(bundle.location);
    });


    it('should cleanup bundle file on exit', function() {

      // given
      var config = createConfig();

      createPlugin(config);

      // when
      emitter.emit('exit', function() { });

      // then
      expect(bundle.remove).toHaveBeenCalled();
    });

  });


  describe('preprocessing', function() {


    it('should create bundle', function(done) {

      // given
      var config = createConfig();
      var plugin = createPlugin(config);

      var bundleFile = createFile(bundle.location);
      var testFile = createFile('test/fixtures/b.js');

      // when
      preprocess(plugin, bundleFile, [ testFile ], function(order) {

        // then
        // resolve order: bundle, testFileStubs ...
        expect(order).toEqual([ bundleFile, testFile ]);

        // bundle got created
        expect(bundleFile.bundled).toMatch(/require=\(.*\)/);

        // test file stub got created
        expect(testFile.bundled).toEqual('if (window.require) { require("./test/fixtures/b.js"); }');

        done();
      });

    });


    it ('should path through on updates', function(done) {

      // given
      var config = createConfig();
      var plugin = createPlugin(config);

      var bundleFile = createFile(bundle.location);
      var testFile = createFile('test/fixtures/b.js');

      // initial bundle creation
      preprocess(plugin, bundleFile, [ testFile ], function() {

        // when
        preprocess(plugin, bundleFile, [ testFile ], function() {

          // then

          // bundle got passed through
          expect(bundleFile.bundled).toMatch(/require=\(.*\)/);

          // test file got regenerated
          expect(testFile.bundled).toEqual('if (window.require) { require("./test/fixtures/b.js"); }');

          done();
        });

      });

    });


    it('should handle bundle error', function(done) {

      // given
      var config = createConfig();
      var plugin = createPlugin(config);

      var bundleFile = createFile(bundle.location);
      var testFile = createFile('test/fixtures/error.js');

      // when
      preprocess(plugin, bundleFile, [ testFile ], function(order) {

        // then
        expect(order).toEqual([ bundleFile, testFile ]);

        // bundle is empty
        expect(bundleFile.bundled).toBe(null);

        // test file result reports error
        expect(testFile.bundled).toBeDefined();
        expect(testFile.bundled.message).toEqual('Unexpected token )');

        done();
      });
    });


    describe('automatic rebuild (autoWatch=true)', function() {

      // the file test/fixtures/a.js
      // that is going to be updated
      var file = new stubs.File(__dirname + '/../fixtures/a.js');


      beforeEach(function() {
        file.load();
      });

      afterEach(function() {
        file.restore();
      });


      it('should update on change', function(done) {

        // given
        var config = createConfig({ autoWatch: true });
        var plugin = createPlugin(config);

        var bundleFile = createFile(bundle.location);
        var testFile = createFile('test/fixtures/b.js');

        // initial bundle creation
        preprocess(plugin, bundleFile, [ testFile ], function() {

          // reset spy on bundle
          bundle.update.reset();

          // when
          // update bundle file
          delay(function() {
            file.update('module.exports = "XXXX";');
          });

          // give watch a chance to trigger
          delay(function() {

            // then
            expect(bundle.update).toHaveBeenCalled();

            done();
          }, 2000);

        });

      });


      it('should handle bundle update error', function(done) {

        // given
        var config = createConfig({ autoWatch: true });
        var plugin = createPlugin(config);

        var bundleFile = createFile(bundle.location);
        var testFile = createFile('test/fixtures/b.js');

        // initial bundle creation
        preprocess(plugin, bundleFile, [ testFile ], function() {

          // reset spy on bundle
          bundle.update.reset();

          // when
          // update bundle file
          delay(function() {
            file.update('unpoarsable / {{ code');
          });

          // give watch a chance to trigger
          delay(function() {

            // then
            // no update on parse error
            expect(bundle.update).not.toHaveBeenCalled();

            done();
          }, 2000);

        });

      });

    });

  });

});