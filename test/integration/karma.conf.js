'use strict';

var platformSuffix = /^win/.test(process.platform) ? '-win' : '',
    prebundledCommon = 'prebundled/common' + platformSuffix + '.js';

module.exports = function(karma) {

  karma.set({

    plugins: ['karma-*', require('../..')],

    frameworks: [ 'jasmine', 'browserify' ],

    files: [
      // external (non-browserified) library that exposes a global
      'vendor/external.js',

      // external (browserified) bundle
      prebundledCommon,

      // source file, accidently included
      // (there is usually no reason to do this)
      'lib/a.js',

      // tests
      'test/*Spec.js',

      // a helper, accidently included with the tests
      'test/helper.js'
    ],

    reporters: [ 'dots' ],

    preprocessors: {
      'lib/a.js': [ 'browserify' ],
      'test/*Spec.js': [ 'browserify' ],
      'test/helper.js': [ 'browserify' ]
    },

    browsers: [ 'PhantomJS' ],

    logLevel: 'LOG_DEBUG',

    singleRun: true,
    autoWatch: false,

    // browserify configuration
    browserify: {
      debug: true,
      transform: [ 'brfs' ],

      // configure browserify
      configure: function(b) {
        b.on('prebundle', function() {
          b.external('lib/common.js');
        });
      }
    }
  });
};
