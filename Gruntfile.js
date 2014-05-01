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

    jasmine_node: {
      options: {
        specNameMatcher: '.*Spec'
      },
      all: [ 'test/spec' ]
    },

    release: {
      options: {
        commitMessage: 'chore(project): release v<%= version %>',
        tagMessage: 'chore(project): tag v<%= version %>',
        tagName: 'v<%= version %>'
      }
    }
  });


  grunt.registerTask('test', [ 'jasmine_node' ]);

  grunt.registerTask('default', [ 'jshint', 'test' ]);

  grunt.registerTask('travis', [ 'default' ]);
};