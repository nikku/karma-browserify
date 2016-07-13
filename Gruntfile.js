'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);


  // project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      all: [
        'Gruntfile.js',
        'index.js',
        'lib/**/*.js',
        'test/spec/**/*.js'
      ],
      options: {
        jshintrc: true
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: [
            './test/expect.js'
          ]
        },
        src: ['test/spec/**/*.js']
      }
    },

    release: {
      options: {
        commitMessage: 'chore(project): release v<%= version %>',
        tagMessage: 'chore(project): tag v<%= version %>',
        tagName: 'v<%= version %>',
        npm: false
      }
    }
  });


  grunt.registerTask('test', [ 'mochaTest' ]);

  grunt.registerTask('default', [ 'jshint', 'test' ]);
};
