'use strict';

var _          = require('lodash');
var events     = require('events');
var Bro        = require('../../lib/bro');
var BundleFile = require('../../lib/bundle-file');
var stubs      = require('./stubs');
var chai       = require('chai');
var path       = require('path');
var fs         = require('fs');
var unpack     = require('browser-unpack');
var escape     = require('js-string-escape');

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

function createFile(p) {
  return {
    path: path.resolve(p),
    realContents: function() {
      return fs.readFileSync(this.path, 'utf-8');
    }
  };
}

function createConfig(config) {
  config = config || {};

  return _.extend({}, {
    basePath: '',
    files: [ createFilePattern('*.js') ],
    preprocessors: {
      '*.js': [ 'browserify' ]
    }
  }, config);
}

/**
 * Preprocess bundle and test files, collect async results
 * and call the callback with all files in the order they have been processed.
 */
function preprocess(bundle, testFiles, done) {

  /*jshint validthis:true */
  var plugin = this;

  var total = 1 + testFiles.length;

  var processed = [];

  function fileProcessed(file, result) {
    file.bundled = result;

    processed.push(file);

    if (processed.length == total) {
      done();
    }
  }

  function process(preprocessor, file) {
    preprocessor(file.bundled || '', file, function(result) {
      fileProcessed(file, result);
    });
  }

  process(plugin.bundlePreprocessor, bundle);

  // Karma does not necessarily preprocess test files in the order they are given.
  var shuffledTestFiles = testFiles.slice(0).reverse();

  _.forEach(shuffledTestFiles, function(file) {
    process(plugin.testFilePreprocessor, file);
  });
}

function expectedBundle(filename) {
  return 'require("' + escape(path.relative('', filename)) + '");';
}


describe('bro', function() {

  var emitter, loggerFactory, bundle, bro;

  beforeEach(function() {

    emitter = new events.EventEmitter();
    loggerFactory = new stubs.LoggerFactory();

    bundle = new BundleFile();

    bundle.update = chai.spy(bundle.update);
    bundle.touch = chai.spy(bundle.touch);
    bundle.remove = chai.spy(bundle.remove);

    bro = new Bro(bundle);
  });


  afterEach(function(done) {
    emitter.emit('exit', done);
  });

  // increase timeout
  this.timeout(8000);


  function createPlugin(config) {

    config = createConfig(config);

    function TestPlugin(bro) {

      this.framework = bro.framework(emitter, config, loggerFactory);
      this.testFilePreprocessor = bro.testFilePreprocessor(config);
      this.bundlePreprocessor = bro.bundlePreprocessor(config);

      this.preprocess = preprocess.bind(this);
    }

    return new TestPlugin(bro);
  }


  describe('framework', function() {


    describe('init', function() {

      it('should prepend and init bundle file', function() {

        // given
        var config = createConfig();

        // when
        createPlugin(config);

        // then
        expect(bundle.touch).to.have.been.called();

        expect(config.files[0].pattern).to.eql(bundle.location);
      });


      it('should insert bundle file right before first preprocessed file', function() {

        // given
        var config = createConfig({
          files: [
            { pattern: 'vendor/external.js' },
            { pattern: 'foo/*Spec.js' }
          ],
          preprocessors: {
            'foo/*Spec.js': [ 'browserify' ]
          }
        });

        // when
        createPlugin(config);

        // expect bundle file to be inserted at pos=1
        expect(config.files).to.deep.eql([
          { pattern : 'vendor/external.js' },
          { pattern : bundle.location, served : true, included : true, watched : true },
          { pattern : 'foo/*Spec.js' }
        ]);

      });

      it('should insert bundle file before more-specific preprocessed pattern', function() {

        // given
        var config = createConfig({
          files: [
            { pattern: 'vendor/external.js' },
            { pattern: 'foo/*Spec.js' }
          ],
          preprocessors: {
            'foo/*.js': [ 'browserify' ]
          }
        });

        // when
        createPlugin(config);

        // expect bundle file to be inserted at pos=1
        // since foo/*Spec.js matches the foo/*.js glob
        expect(config.files).to.deep.eql([
          { pattern : 'vendor/external.js' },
          { pattern : bundle.location, served : true, included : true, watched : true },
          { pattern : 'foo/*Spec.js' }
        ]);

      });

      it('should not insert bundle file before less-specific preprocessed pattern', function() {

        // given
        var config = createConfig({
          files: [
            { pattern: 'vendor/external.js' },
            { pattern: 'foo/*.js' }
          ],
          preprocessors: {
            'foo/*Spec.js': [ 'browserify' ]
          }
        });

        // when
        createPlugin(config);

        // then
        expect(config.files[0].pattern).to.eql(bundle.location);

      });

    });


    describe('cleanup', function() {

      it('should remove bundle file on exit', function() {

        // given
        createPlugin();

        // when
        emitter.emit('exit', function() { });

        // then
        expect(bundle.remove).to.have.been.called();
      });

    });

  });


  describe('preprocessing', function() {

    it('should create bundle', function(done) {

      // given
      var plugin = createPlugin();

      var bundleFile = createFile(bundle.location);
      var testFileB = createFile('test/fixtures/b.js');
      var testFileC = createFile('test/fixtures/c.js');

      // when
      plugin.preprocess(bundleFile, [ testFileB, testFileC ], function() {

        // then
        // bundle got created
        var bundledFiles = unpack(bundleFile.bundled)
          .map(function (row) { return row.id; });
        expect(bundledFiles).to.contain(path.relative('', 'test/fixtures/c.js'));
        expect(bundledFiles).to.contain(path.relative('', 'test/fixtures/b.js'));

        // test file stub got created
        expect(testFileB.bundled).to.eql(expectedBundle('test/fixtures/b.js'));
        expect(testFileC.bundled).to.eql(expectedBundle('test/fixtures/c.js'));

        done();
      });

    });


    it('should pass through on updates', function(done) {

      // given
      var plugin = createPlugin();

      var bundleFile = createFile(bundle.location);
      var testFile = createFile('test/fixtures/b.js');

      // initial bundle creation
      plugin.preprocess(bundleFile, [ testFile ], function() {

        // when
        plugin.preprocess(bundleFile, [ testFile ], function() {

          // then

          // bundle got passed through
          var bundledFiles = unpack(bundleFile.bundled)
            .map(function (row) { return row.id; });
          expect(bundledFiles).to.contain(path.relative('', 'test/fixtures/b.js'));

          // test file got regenerated
          expect(testFile.bundled).to.eql(expectedBundle('test/fixtures/b.js'));

          done();
        });

      });

    });


    describe('automatic rebuild (autoWatch=true)', function() {

      // remember test files and restore them later
      // because they are going to be updated
      var aFile = new stubs.File(__dirname + '/../fixtures/a.js');
      var bFile = new stubs.File(__dirname + '/../fixtures/b.js');

      beforeEach(function() {
        aFile.load();
        bFile.load();
      });

      afterEach(function() {
        aFile.restore();
        bFile.restore();
      });


      it('should update on change', function(done) {

        // given
        var plugin = createPlugin({ autoWatch: true });

        var bundleFile = createFile(bundle.location);
        var testFile = createFile('test/fixtures/b.js');

        // initial bundle creation
        plugin.preprocess(bundleFile, [ testFile ], function() {

          // reset spy on bundle
          bundle.update.__spy.calls = [];
          bundle.update.__spy.called = false;

          // when
          // update bundle file
          delay(function() {
            aFile.update('module.exports = "UPDATED";');
          });

          // give watch a chance to trigger
          delay(function() {

            // then
            expect(bundle.update).to.have.been.called();

            done();
          }, 2000);

        });

      });


      it('should handle bundle error', function(done) {

        // given
        var plugin = createPlugin();

        var bundleFile = createFile(bundle.location);
        var testFile = createFile('test/fixtures/error.js');

        // when
        plugin.preprocess(bundleFile, [ testFile ], function() {

          // then
          // bundle reports error
          expect(bundleFile.bundled).to.exist;
          expect(bundleFile.bundled.message).to.eql('Unexpected token');

          // test file stub got created anyway
          expect(testFile.bundled).to.eql(expectedBundle('test/fixtures/error.js'));

          done();
        });
      });


      it('should handle bundle update error', function(done) {

        // given
        var plugin = createPlugin({ autoWatch: true });

        var bundleFile = createFile(bundle.location);
        var testFile = createFile('test/fixtures/b.js');

        // initial bundle creation
        plugin.preprocess(bundleFile, [ testFile ], function() {

          // reset spy on bundle
          bundle.update.__spy.calls = [];
          bundle.update.__spy.called = false;

          // when
          // update bundle file
          delay(function() {
            aFile.update('unpoarsable / {{ code');
          });

          // give watch a chance to trigger
          delay(function() {

            // then
            // no update on parse error
            expect(bundle.update).not.to.have.been.called();

            done();
          }, 2000);

        });

      });


      // TODO(Nikku): Yup, aint gonna work on travis CI :-(
      if (!process.env.TRAVIS) {

        it('should handle file remove', function(done) {

          // given
          var plugin = createPlugin({ autoWatch: true });

          var bundleFile = createFile(bundle.location);
          var testFile = createFile('test/fixtures/b.js');

          // initial bundle creation
          plugin.preprocess(bundleFile, [ testFile ], function() {

            // reset spy on bundle
            bundle.update.__spy.calls = [];
            bundle.update.__spy.called = false;

            // when
            // remove file
            delay(function() {
              bFile.remove();
            });

            // update a bundled file
            delay(function() {
              aFile.update('module.exports = "UPDATED";');
            }, 500);

            // give watch a chance to trigger
            delay(function() {

              // then
              // update with file deleted
              expect(bundle.update).to.have.been.called();

              expect(bundleFile.realContents()).not.to.contain('/b.js');
              done();
            }, 3000);

          });

        });

      }

    });

  });


  describe('browserify', function() {

    it('should configure transform', function(done) {

      // given
      var plugin = createPlugin({
        browserify: {
          transform: [ 'brfs' ]
        }
      });

      var bundleFile = createFile(bundle.location);
      var testFile = createFile('test/fixtures/transform.js');

      // when
      plugin.preprocess(bundleFile, [ testFile ], function() {

        // then

        // bundle got created
        expect(bundleFile.bundled).to.contain("module.exports.text = '<' + \"HALLO\" + '>'");

        done();
      });
    });


    it('should configure transform with options', function(done) {

      // given
      var plugin = createPlugin({
        browserify: {
          transform: [ ['brfs', { foo: 'bar' }] ]
        }
      });

      var bundleFile = createFile(bundle.location);
      var testFile = createFile('test/fixtures/transform.js');

      // when
      plugin.preprocess(bundleFile, [ testFile ], function() {

        // then

        // bundle got created
        expect(bundleFile.bundled).to.contain("module.exports.text = '<' + \"HALLO\" + '>'");

        done();
      });
    });


    it('should support prebundle in the options', function(done) {

      // given
      var plugin = createPlugin({
        browserify: {
          prebundle: function(bundle) {
            bundle.external('foobar');
          }
        }
      });

      var bundleFile = createFile(bundle.location);
      var testFile = createFile('test/fixtures/prebundle.js');

      // when
      plugin.preprocess(bundleFile, [ testFile ], function() {

        // then
        // bundle got created
        expect(bundleFile.bundled).to.exist;
        done();
      });
    });


    it('should configure debug with source map support', function(done) {

      // given
      var plugin = createPlugin({
        browserify: {
          debug: true
        }
      });

      var bundleFile = createFile(bundle.location);
      var testFile = createFile('test/fixtures/a.js');

      // when
      plugin.preprocess(bundleFile, [ testFile ], function() {

        // then

        // contains source map
        expect(bundleFile.bundled).to.contain('//# sourceMappingURL');

        // and has the parsed mapping attached
        expect(bundleFile.sourceMap).to.exist;

        done();
      });
    });


    it('should configure plugin with options', function(done) {

      // given
      var plugin = createPlugin({
        browserify: {
          plugin: [ ['tsify', { removeComments: true } ] ]
        }
      });

      var bundleFile = createFile(bundle.location);
      var testFile = createFile('test/fixtures/plugin.ts');

      // when
      plugin.preprocess(bundleFile, [ testFile ], function() {

        // then

        // bundle file got processed via plug-in
        expect(bundleFile.bundled).to.contain('module.exports = plugin');
        expect(bundleFile.bundled).not.to.contain('// typescript');

        done();
      });
    });


    it('should persist transforms', function(done) {
      var bundleFile = createFile(bundle.location);
      var testFile = createFile('test/fixtures/transform.js');
      var plugin = createPlugin({
        browserify: {
          transform: [ 'brfs' ],
          // Hook into bundler/pipeline events for success/error
          prebundle: function(bundle) {
            // After first bundle
            bundle.once('bundled', function (err) {
              // Fail if there was an error
              if (err) return done(err);
              // Set up error/success handlers
              bundle.on('bundle', function (pipeline) {
                pipeline
                  .on('error', done)
                  .on('end', function() {
                    expect(bundleFile.bundled).to.contain("module.exports.text = '<' + \"HALLO\" + '>'");
                    done();
                  });
              });
              // Rebundle
              plugin.preprocess(bundleFile, [ testFile ], function() {});
            });
          }
        }
      });
      // Initial bundle
      plugin.preprocess(bundleFile, [ testFile ], function() {});
    });


    it('should persist plugins', function(done) {
      var bundleFile = createFile(bundle.location);
      var testFile = createFile('test/fixtures/plugin.ts');
      var plugin = createPlugin({
        browserify: {
          plugin: [ ['tsify', { removeComments: true } ] ],
          // Hook into bundler/pipeline events for success/error
          prebundle: function(bundle) {
            // After first bundle
            bundle.once('bundled', function (err) {
              // Fail if there was an error
              if (err) return done(err);
              // Set up error/success handlers
              bundle.on('bundle', function (pipeline) {
                pipeline
                  .on('error', done)
                  .on('end', done);
              });
              // Rebundle
              plugin.preprocess(bundleFile, [ testFile ], function() {});
            });
          }
        }
      });
      // Initial bundle
      plugin.preprocess(bundleFile, [ testFile ], function() {});
    });

  });

});
