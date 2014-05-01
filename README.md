# karma-bro

[![Build Status](https://travis-ci.org/Nikku/karma-bro.svg?branch=master)](https://travis-ci.org/Nikku/karma-bro)

[Bro](https://github.com/Nikku/karma-bro) is a fast [browserify](http://browserify.org) integration for [Karma](https://karma-runner.github.io) that handles large projects with ease.


## Features

Bro is a preprocessor for Karma that combines test files and dependencies into a browserified bundle before tests get executed. It relies on [watchify](https://github.com/substack/watchify) to generate the bundle and to keep it updated during `autoWatch=true`.


Some important features are

* it builds one browserify bundle _only_
* it incrementally updates the browserify bundle once tests and/or source files
* it ensures tests are only once per test run


## Installation

Get the plug-in via [npm](https://www.npmjs.org/)

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

Look at the [example directory](https://github.com/Nikku/karma-bro/tree/master/example) for a simple [browserify](http://browserify.org) + [jasmine](http://jasmine.github.io) project that uses this plug-in.


### Configure Browserify

The way Bro creates browserified test bundles can be tuned through the `browserify` configuration property. The following [configuration options](https://github.com/substack/node-browserify#var-b--browserifyfiles-or-opts) are supported:

*   extensions
*   builtins
*   basedir
*   commondir
*   resolve
*   transform

To generate source maps for easier debugging specify `debug: true` as an additional configuration option.


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

    // add additional browserify configuration properties here
    // such as transform and/or debug=true to generate source maps
    browserify: {
      debug: true,
      transform: [ 'brfs' ]
    }
  });
};
```


## Related

Credit goes to to [karma-browserify](https://github.com/xdissent/karma-browserify) and [karma-browserifast](https://github.com/cjohansen/karma-browserifast). Bro builds on the lessons learned in these projects and offers improved configurability, speed and/or the ability to handle large projects.


## License

MIT
