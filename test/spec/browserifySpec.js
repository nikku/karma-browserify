'use strict';

var browserify = require('browserify');


function delay(fn, time) {
  setTimeout(fn, time);
}


describe('browserify', function() {

  var bundler;

  beforeEach(function() {
    bundler = browserify();
  });


  this.timeout(5000);

  it('should expose external require', function(done) {

    // given
    bundler.add('./test/fixtures/a.js');
    bundler.require('./test/fixtures/a.js', { expose: './test/fixtures/a.js' });

    // when
    bundler.bundle(function(err, content) {
      content = content && content.toString('utf-8');

      // then
      expect(content).to.match(/^require=/);

      expect(content).to.contain('test/fixtures/a.js');

      done(err);
    });

  });


  it('should remove already added files on reset', function(done) {

    // given
    bundler.add('./test/fixtures/a.js');
    bundler.require('./test/fixtures/a.js', { expose: './test/fixtures/a.js' });

    bundler.bundle(function(err, content) {
      expect(err).not.to.exist;
    });

    // when
    delay(function() {

      bundler.reset();
      bundler.add('./test/fixtures/b.js');
      bundler.require('./test/fixtures/b.js', { expose: './test/fixtures/b.js' });

      bundler.bundle(function(err, content) {
        content = content && content.toString('utf-8');

        // then
        expect(content).to.match(/^require=/);

        expect(content).not.to.contain('{"./test/fixtures/a.js":[function(');
      });
    }, 200);


    delay(done, 2000);
  });


  it('should run transforms on required files', function(done) {

    // given
    bundler
      .transform('brfs')
      .add('./test/fixtures/transform.js')
      .require('./test/fixtures/transform.js', { expose: './test/fixtures/a.js' });

    // when
    bundler.bundle(function(err, content) {
      content = content && content.toString('utf-8');

      // then
      expect(content).to.match(/^require=/);

      expect(content).to.contain('HALLO');

      done(err);
    });

  });


  it('should reuse callback', function(done) {

    // given
    var count = 0;

    function bundled(err, content) {
      count++;
    }

    // when
    bundler.bundle(bundled);

    delay(function() {
      bundler.reset();
      bundler.add('./test/fixtures/a.js');

      bundler.bundle(bundled);
    }, 300);

    delay(function() {
      bundler.reset();
      bundler.add('./test/fixtures/b.js');

      bundler.bundle(bundled);
    }, 600);


    // then
    delay(function() {
      expect(count).to.eql(3);
      done();
    }, 2000);

  });

});