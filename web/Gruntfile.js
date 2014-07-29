module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-file-blocks');
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-less');

    function getIpAddress() {
        var os=require('os');
        var ifaces=os.networkInterfaces();
        for (var dev in ifaces) {
            var details = ifaces[dev];
            for (var i = 0; i < details.length; i++){
                var detail = details[i];
                if (detail.family=='IPv4') {
                    if (dev == "eth0" || dev == "wlan0") {
                        return detail.address;
                    }
                }
            };
        }
    }

    var bower_libs = [
        'bower_components/less/dist/less-1.7.0.js',
        'bower_components/jQuery/dist/jquery.js',
        'bower_components/knockout/index.js',
        'bower_components/dispatch/dispatch.js',
        'bower_components/jquery.transit/jquery.transit.js',
        'bower_components/fastclick/lib/fastclick.js',
        'bower_components/bluebird/js/browser/bluebird.js',
        'bower_components/catiline/dist/catiline.js',
        'bower_components/operative/dist/operative.js',
        'bower_components/FileSaver/FileSaver.js',
        'bower_components/asmcrypto/asmcrypto.js',
        'bower_components/knockout-secure-binding/dist/knockout-secure-binding.js',
        'bower_components/chai/chai.js' // only for testing
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        fileblocks: {
            web: {
                options: {
                    removeFiles: true,
                    rebuild: true
                },
                src: 'index.html',
                blocks: {
                    'libs': { src: ['lib/*.js']},
                    'app': { src: ["js/**/*.js", "!js/util/init.js"] }
                }
            },
            test: {
                options: {
                    removeFiles: true,
                    rebuild: true,
                    prefix: "../"
                },
                src: 'test/index.html',
                blocks: {
                    'test': { src: ['test/js/rest/EntityRestTestFunctions.js', 'test/js/**/*.js'] },
                    'libs': { src: ['lib/*.js', 'test/lib/*.js', "!test/lib/mocha.js" ]},
                    'app': { src: ['js/**/*.js', "!js/util/init.js"] }
                }
            }
        },

        uglify: {
            default: {
                files: {
                    "build/libs.min.js": 'libs/**/*.js',
                    "build/app.min.js": "js/**/*.js"
                }
            }
        },

        processhtml: {
            dist: {
                files: {
                    'build/index.html': ['index.html'],
                    'build/test.html': ['test.html']
                }
            }
        },

        concat: {
            webapp: {
                files: {
                    'build/app.js': ["js/**/*.js", "!js/util/init.js", "!js/util/Environment.js"]
                },
                options: {
                    // Replace all 'use strict' statements in the code with a single one at the top
                    process: function (src, filepath) {
                        return '// Source: ' + filepath + '\n' +
                            src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                    },
                    banner: "goog.provide(\"mizz.Env\"); \n\
                        mizz.Env = { \n\
                        ssl: false, \n\
                        server: '" + getIpAddress() + "', \n\
                        port: '9012' \n\
                    };\n\n",
                    //footer: grunt.file.read("js/util/init.js").toString('utf-8')
                }
            },
            libs: {
                files: {
                    'build/libs.js': 'libs/**/*.js'
                }
            }

        },

        copy: {
            main: {
                files: [
                    // includes files within path
                    {expand: true, src: ['images/**', 'fonts/**'], dest: 'build/'}
                ]
            },
            bower_libs: {
                files: [
                    {expand: true, flatten: true, src: bower_libs, dest: 'libs/bower/'}
                ]
            },
            worker: {
                files: [
                    // includes files within path
                    {expand: true, src: ['libs/native/**'], dest: 'build/'}
                ]
            }
        },

        less: {
            development: {
                options: {
                    paths: ["less"]
                },
                files: {
                    "build/css/main.css": "less/main.less"
                }
            }
        },

        watch: {
            scripts: {
                files: ['index.html', 'test.html', 'js/**/*.js', 'libs/**/*.js', 'less/**.less'],
                tasks: ['concat', 'processhtml', 'copy', 'less'],
                options: {
                    spawn: false
                }
            }
        },

        clean: ["build"]

    });

    grunt.registerTask("default", ['clean', 'fileblocks', 'concat', 'processhtml', 'copy', 'less']);
}