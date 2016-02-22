'use strict';

var Runner = require('../runner'),
    touch = require('touch');

var singleRunConfig = require.resolve('../integration/single-run.conf'),
    noAutoWatchConfig = require.resolve('../integration/no-auto-watch.conf'),
    autoWatchConfig = require.resolve('../integration/auto-watch.conf');

var path = require('path');
var resolve = require('resolve');
var chai = require('chai');
var chokidar = require(resolve.sync('chokidar', {
  basedir: path.resolve(__dirname, '../../node_modules/watchify')
}));


function triggerRun(configFile, done) {
  var config = {
    configFile: configFile
  };

  done = done || function() { };

  return require('karma/lib/runner').run(config, done);
}


describe('karma-browserify', function() {

  var runner;

  beforeEach(function() {
    runner = new Runner();
  });

  afterEach(function() {
    runner.stop();
  });

  chokidar.watch = chai.spy(chokidar.watch);

  this.timeout(10 * 1000);


  it('should perform a simple run', function(done) {

    runner.start(singleRunConfig, function(result) {
      expect(result).to.equal(0);

      // Verify that a single run doesn't create a bunch of watchers.
      // (This test assumes that watchify uses chokidar for watching).
      expect(chokidar.watch).to.not.have.been.called();
      done();
    });
  });


  it('should manually trigger no-auto-watch run', function(done) {

    runner.on('run_complete', function(karma, results) {
      runner.stopAfter(500);

      expect(results.success).to.eql(2);
    });

    runner.on('browsers_ready', function() {
      triggerRun(__dirname + '/../integration/no-auto-watch.conf.js');
    });

    runner.start(noAutoWatchConfig, function() {
      done();
    });
  });


  it('should not double bundle on test file change', function(done) {

    var runCount = 0;
    runner.on('run_start', function() {
      runCount++;
    });

    // touch file to trigger additional run
    runner.once('run_complete', function() {
      touch('test/integration/test/externalSpec.js');

      runner.stopAfter(4000);
    });

    runner.start(autoWatchConfig, function() {
      expect(runCount).to.equal(2);
      done();
    });
  });


  it('should not rebundle if file change is outside bundle', function(done) {

    var bundleCount = 0;

    runner.once('framework', function() {
      runner.bundler.on('bundle', function() {
        bundleCount++;
      });
    });

    // touch external file
    runner.once('run_complete', function() {
      touch('test/integration/vendor/external.js');

      runner.stopAfter(4000);
    });

    runner.start(autoWatchConfig, function() {
      // assert external touch did not trigger an additional run
      expect(bundleCount).to.equal(1);
      done();
    });
  });


  it('should detect file rename', function(done) {

    var fs = require('fs');

    var FILE_NAME = 'test/integration/test/aSpec.js',
        UPDATED_FILE_NAME = 'test/integration/test/xxaSpec.js';

    this.timeout(20000);

    var bundleCount = 0;

    runner.once('framework', function() {
      runner.bundler.on('bundle', function() {
        bundleCount++;
      });
    });

    runner.once('run_complete', function() {
      fs.renameSync(FILE_NAME, UPDATED_FILE_NAME);

      runner.once('run_complete', function() {
        fs.renameSync(UPDATED_FILE_NAME, FILE_NAME);
      });

      runner.stopAfter(7000);
    });

    runner.start(autoWatchConfig, function() {
      // assert file remove + restore triggered
      // two additional bundling runs
      expect(bundleCount >= 2).to.equal(true);

      done();
    });

  });


  describe('error handling', function() {

    var testErrorConfig = require.resolve('../integration/test-error.conf'),
        dependencyErrorConfig = require.resolve('../integration/dependency-error.conf');


    it('should handle test error', function(done) {

      runner.start(testErrorConfig, function(result) {
        expect(result).to.equal(1);

        done();
      });
    });


    it('should handle dependency error', function(done) {

      runner.start(dependencyErrorConfig, function(result) {
        expect(result).to.equal(1);

        done();
      });
    });

  });

});
