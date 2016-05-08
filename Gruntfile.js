'use strict';

module.exports = function (grunt) {

    // project's configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        src: 'src',
        tests: 'tests',
        build: 'build',
        coverage: '<%= build %>/coverage',
        coverage_tmp: '<%= coverage %>/tmp',

        clean: {
            build: {
                src: ['<%= build %>']
            },
            coverage: {
                src: ['<%= coverage %>']
            },
            coverage_tmp: {
                src: ['<%= coverage_tmp %>']
            }
        },

        // JSHint's configuration (see http://jshint.com/docs/options/ for the list of available options)
        jshint: {
            productionCode: {
                options: {jshintrc: '.jshintrc'},
                src: ['<%= src %>/**/*.js']
            },
            testCode: {
                options: {jshintrc: '.jshintrc'},
                src: ['<%= tests %>/**/*.js']
            }
        },

        runTests: {
            unit: {
                delegate: 'jasmine_nodejs:unit'
            },
            unitWithCoverage: {
                delegate: 'jasmine_nodejs:unitWithCoverage'
            }
        },

        jasmine_nodejs: {
            unit: {
                specs: ['<%= tests %>/**']
            },
            unitWithCoverage: {
                specs: ['<%= coverage_tmp %>/<%= tests %>/**']
            }
        },

        instrument: {
            files: ['<%= src %>/**/*.js'],
            options: {
                lazy: true,
                basePath: '<%= coverage_tmp %>'
            }
        },

        storeCoverage: {
            options: {
                dir: '<%= coverage_tmp %>'
            }
        },

        makeReport: {
            src: '<%= coverage_tmp %>/coverage.json',
            options: {
                type: 'lcov',
                dir: '<%= coverage %>',
                print: 'detail'
            }
        },

        copy: {
            toCoverageTmp: {
                files: [
                    {
                        expand: true,
                        src: '<%= tests %>/**',
                        dest: '<%= coverage_tmp %>'
                    }
                ]
            }
        },

        coveralls: {
            istanbul: {
                src: '<%= coverage %>/lcov.info'
            }
        }
    });

    // plugin for deleting files (see https://github.com/gruntjs/grunt-contrib-clean)
    grunt.loadNpmTasks('grunt-contrib-clean');

    // plugin for validating files (see https://github.com/gruntjs/grunt-contrib-jshint)
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // plugin for testing files (see https://github.com/onury/grunt-jasmine-nodejs)
    grunt.loadNpmTasks('grunt-jasmine-nodejs');

    // plugin for computing test coverage (see https://github.com/taichi/grunt-istanbul)
    grunt.loadNpmTasks('grunt-istanbul');

    // plugin for reporting test coverage to coveralls.io (see https://github.com/pimterry/grunt-coveralls)
    grunt.loadNpmTasks('grunt-coveralls');

    // plugin for copying files (see https://github.com/gruntjs/grunt-contrib-copy)
    grunt.loadNpmTasks('grunt-contrib-copy');

    // If a file is not required, then it won't be included in the coverage report. Actually, that report does not show
    // the coverage of the code but the coverage of the specs, which can be misleading. The workaround is to require the
    // instrumented files before running the tests.
    grunt.task.registerTask('requireInstrumentedFiles', function () {
        var _ = require('lodash');
        var glob = require('glob');
        _.forEach(glob.sync(grunt.config.get('coverage_tmp') + '/**/!(di.js|*.di.js|*.spec.js).js'), function (file) {
            require('./' + file);
        });
    });

    grunt.task.registerMultiTask('runTests', function runTests() {
        var data = this.data;

        // improve the logging of the errors
        require('pretty-error').start();

        return grunt.task.run(data.delegate);
    });

    grunt.task.registerTask('default', ['build']);

    grunt.task.registerTask('build', [
        'clean:build',
        'jshint',
        'build-coverage']);

    grunt.task.registerTask('ci', [
        'build',
        'coveralls']);

    grunt.task.registerTask('build-coverage', [
        'clean:coverage',
        'instrument',
        'requireInstrumentedFiles',
        'copy:toCoverageTmp',
        'runTests:unitWithCoverage',
        'storeCoverage',
        'makeReport',
        'clean:coverage_tmp'
    ]);

    grunt.task.registerTask('test', ['runTests:unit']);
};