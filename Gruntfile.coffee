module.exports = (grunt) ->

  # loads all npm tasks so we don't have to run "grunt.loadNpmTasks()" for every single task
  require('load-grunt-tasks')(grunt);

  grunt.initConfig
    dir_css: 'skin/css/'
    dir_scss: 'skin/scss'
    dir_js: 'content'


    # set up sass-compilation
    # https://github.com/sindresorhus/grunt-sass
    sass:
      build:
        options:
          outputStyle: 'nested'
          sourceComments: 'none'
          trace: true
        files: [
          expand: true
          cwd: '<%= dir_scss %>/'
          src: ['**/*.scss']
          ext: '.css'
          dest: '<%= dir_css %>/'
        ]
      deploy:
        options:
          outputStyle: 'compressed'
          sourceComments: 'none'
          trace: true
        files: [
          expand: true
          cwd: '<%= dir_scss %>/'
          src: ['**/*.scss']
          ext: '.css'
          dest: '<%= dir_css %>/'
        ]


    # Run JSHint on self-authored JavaScript-Files
    # …but don't run on external libraries because the
    # performance impact would be too high to let jshint run through jQuery…
    # https://github.com/gruntjs/grunt-contrib-jshint
    jshint:
      files: ['<%= dir_js %>/*.js']
      options:
        globals:
          console: true
          module: true


    # Watch JS and SCSS Files to perform compilation and livereloading on change
    # https://github.com/gruntjs/grunt-contrib-watch
    watch:
      sass:
        files: ['<%= dir_scss %>/**']
        tasks: ['css-build']

      #js:
      #  files: ['<%= jshint.files %>']
      #  tasks: ['js-build']

      options:
        dateFormat: (time) ->
          grunt.log.writeln 'The watch finished in ' + time + 's at ' + (new Date().toString())
          grunt.log.writeln 'Waiting for more changes...'


    # Automatic Notifications when Grunt tasks fail or finish
    # https://github.com/dylang/grunt-notify
    notify:
      js:
        options:
          message: 'JS - Mission accomplished!'
      css:
        options:
          message: 'CSS - Mission accomplished!'
      deploy:
        options:
          message: 'DEPLOY - Mission accomplished!'


  # register tasks
  grunt.registerTask 'default',     ['watch']

  #grunt.registerTask 'js-build',    ['newer:jshint', 'notify:js']
  #grunt.registerTask 'js-deploy',   ['jshint']

  grunt.registerTask 'css-build',   ['newer:sass:build', 'notify:css']
  grunt.registerTask 'css-deploy',  ['sass:deploy']

  #grunt.registerTask 'build',       ['css-build', 'js-build']
  #grunt.registerTask 'deploy',      ['css-deploy', 'js-deploy', 'notify:deploy']
  grunt.registerTask 'build',       ['css-build']
  grunt.registerTask 'deploy',      ['css-deploy', 'notify:deploy']
