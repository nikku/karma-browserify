
var Runner = require('../runner'),
  touch = require('touch');

describe('karma-browserify', function() {
  var runner;

  beforeEach(function() {
    runner = new Runner();
  });

  it('should succeed for a simple single run', function(done) {
    runner.start('singleRunPass.conf.js', function(result) {
      expect(result).to.equal(0);
      done();
    });
  });

  it('should not double bundle if files change in angular and watchify', function(done) {
    this.timeout(5000);

    var runCount = 0;
    runner.on('run_start', function() {
      runCount++;
    });

    // Touch file to trigger additional run, then stop after delay after 2nd run
    runner.once('run_complete', function() {
      runner.once('run_complete', function() {
        runner.stopAfter(2000);
      });

      touch('test/integration/test/aSpec.js');
    });

    runner.start('autoWatchPass.conf.js', function() {
      expect(runCount).to.equal(2);
      done();
    });
  });

  it('should not rebundle if a changed file is not in bundle', function(done) {
    this.timeout(5000);

    var bundleCount = 0;
    runner.once('framework', function() {
      runner.bundler.on('bundle', function() {
        bundleCount++;
      });
    });

    // Touch file to *not* trigger additional run, then stop after delay
    runner.once('run_complete', function() {
      touch('test/integration/vendor/external.js', function () {
        runner.stopAfter(2000);
      });
    });

    runner.start('autoWatchPass.conf.js', function() {
      expect(bundleCount).to.equal(1);
      done();
    });
  });
});
