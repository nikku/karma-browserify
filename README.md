# karma-bro

[![Build Status](https://travis-ci.org/Nikku/karma-bro.svg?branch=master)](https://travis-ci.org/Nikku/karma-bro)

[Bro](https://github.com/Nikku/karma-bro) is a fast [browserify](http://browserify.org) integration for [Karma](https://karma-runner.github.io) that handles large projects with ease.


## Installation

Get the plug-in via [npm](https://www.npmjs.org/)

```
npm install --save-dev karma-bro
```


## Usage

Add `browserify` as a framework to your Karma configuration file. For each file that should be processed and bundled by karma, configure the `browserify` preprocessor. Optionally use the `browserify` config entry to configure how the bundle gets created.


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


### Browserify Config

The way Bro creates browserified test bundles can be tuned through the `browserify` configuration property. The following [configuration options](https://github.com/substack/node-browserify#var-b--browserifyfiles-or-opts) are supported:

*   extensions
*   builtins
*   basedir
*   commondir
*   resolve
*   transform

To generate source maps for easier debugging specify `debug: true` as an additional configuration option.


## How it Works

Bro is a preprocessor for Karma that combines test files and dependencies into a browserified bundle. It relies on [watchify](https://github.com/substack/watchify) to generate the bundle and to keep it updated during `autoWatch=true`.

Before the initial test run Bro builds one browserify bundle for all test cases and dependencies. Once any of the files change, it incrementally updates the bundle. Each file included in karma is required from the file bundle via a stub. Thereby it ensures tests are only executed once per test run.


## Detailed Configuration

The following code snippet shows a Karma configuration file with all Bro related options.

```javascript
module.exports = function(karma) {
  karma.set({

    // include browserify first in used frameworks
    frameworks: [ 'browserify', 'jasmine' ],

    // add all your files here,
    // including non-commonJS files you need to load before your test cases
    files: [
      'some-non-cjs-library.js',
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
