# karma-bro


## Usage


```javascript
module.exports = function(karma) {
  karma.set({

    // include browserify first in used frameworks
    frameworks: [ 'browserify', 'jasmine' ],

    // add all your files here
    files: [
      'test/spec/**/*Spec.js'
    ],

    // add preprocessor to the files that should be
    // processed via browserify
    preprocessors: {
      'test/spec/**/*Spec.js': [ 'browserify' ]
    },

    // see what is going on
    logLevel: 'LOG_DEBUG',

    // use autoWatch=true for quick and easy test re-execution once files change
    autoWatch: true,

    // add additional browserify configurations here such as transforms
    browserify: {
      debug: true,
      transform: [ 'brfs' ]
    }
  });
};
```