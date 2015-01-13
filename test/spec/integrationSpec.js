'use strict';

var Runner = require('../runner'),
    touch = require('touch');

var singleRunConfig = require.resolve('../integration/single-run.conf'),
    autoWatchConfig = require.resolve('../integration/auto-watch.conf');


describe('karma-browserify', function() {

  var runner;

  beforeEach(function() {
    runner = new Runner();
  });

  this.timeout(10 * 1000);

  it('should perform a simple run', function(done) {
    
    runner.start(singleRunConfig, function(result) {
      expect(result).to.equal(0);
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
      
      runner.once('run_complete', function() {
        runner.stopAfter(2000);
      });

      touch('test/integration/test/externalSpec.js');
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
      touch('test/integration/vendor/external.js', function () {
        runner.stopAfter(2000);
      });
    });

    runner.start(autoWatchConfig, function() {
      // assert external touch did not trigger an additional run
      expect(bundleCount).to.equal(1);
      done();
    });
  });
});
