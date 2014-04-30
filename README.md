# karma-bro

A fast [browserify](http://browserify.org) integration for [Karma](https://karma-runner.github.io) that can easily handle large browserify projects.


## Installation

Get the plug-in via [npm](https://www.npmjs.org/):

```
npm install --save-dev karma-bro
```


## Usage

Add `browserify` as the first framework used in your Karma configuration file. For each file that should be processed and bundled by karma, configure the `browserify` preprocessor. Optionally use the `browserify` config entry to configure how the bundle gets created.


```javascript
module.exports = function(karma) {
  karma.set({

    frameworks: [ 'browserify', 'any', 'other', 'framework' ],

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

Look at the [example directory](https://github.com/Nikku/karma-bro/tree/master/example) for a simple `browserify` + `jasmine` project that uses `karma-bro`.


#### Supported Browserify Options

The following [browserify configuration options](https://github.com/substack/node-browserify#var-b--browserifyfiles-or-opts) are supported through the `browserify: {}` block to tune the way file bundles are created:

*   extensions
*   builtins
*   basedir
*   commondir
*   resolve
*   transform

In addition, specify `debug: true` in the options to generate source maps.


## Detailed Configuration

The following code snippet shows a Karma configuration file with all `karma-bro` related options.

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
    // and/or debug=true to generate source maps
    browserify: {
      debug: true,
      transform: [ 'brfs' ]
    }
  });
};
```


## Related Projects

Thanks goes to to [karma-browserify](https://github.com/xdissent/karma-browserify) and [karma-browserifast](https://github.com/cjohansen/karma-browserifast). Both influenced this project by providing prior integrations of [browserify](http://browserify.org) into [Karma](https://karma-runner.github.io).


#### Differences

There exist a number of noteworthy differences between `karma-bro` and the above mentioned projects:

* It builds __only one browserify bundle__ and keeps that bundle updated incrementally once changes occur
* It makes sure that individual tests are __only executed once__ per test run
* For change detection during `autoWatch=true` it relies solely on [watchify](https://github.com/substack/watchify)
* It provides a clean(er) syntax for configuring browserify


## License

MIT