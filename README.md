# karma-bro

A fast [browserify](http://browserify.org) integration for [Karma](https://karma-runner.github.io) that can easily handle large browserify projects.


## Usage

Install the plug-in via [npm](https://www.npmjs.org/):

```
npm install --save-dev karma-bro
```

Add `browserify` to your Karma configuration as a framework and configure it via the configs `preprocessors` entry to bundle all CommonJS via browserify before executing the tests. Optionally use the `browserify` config entry to configure how the bundle gets created.


```javascript
module.exports = function(karma) {
  karma.set({

    frameworks: [ 'browserify' ],

    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },

    browserify: {
      debug: true,
      transform: [ 'brfs' ]
    }
 });
}
```


#### Long Version


```javascript
module.exports = function(karma) {
  karma.set({

    // include browserify first in used frameworks
    frameworks: [ 'browserify', 'jasmine' ],

    // add all your files here
    files: [
      'test/**/*.js'
    ],

    // add preprocessor to the files that should be
    // processed via browserify
    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
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


## License

MIT