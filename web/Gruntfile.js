module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-file-blocks');
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-appcache');

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
                    'libs': { src: ['lib/*.js', 'lib/dev/*.js']},
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
                    "build/app.min.js": ['js/**/*.js', '!js/generated/entity/**'],
                    "build/lib.min.js": ['lib/*.js'],
                    "build/gen1.min.js": ['js/generated/entity/tutanota/**/*.js'],
                    "build/gen2.min.js": ['js/generated/entity/sys/**/*.js'],
                    "build/gen3.min.js": ['js/generated/entity/monitor/**/*.js', 'js/generated/entity/base/**/*.js']
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
                    'build/app.js': ['lib/*.js', "js/**/*.js", "!js/util/init.js"]
                },
                options: {
                    // Replace all 'use strict' statements in the code with a single one at the top
                    process: function (src, filepath) {
                        return '// Source: ' + filepath + '\n' +
                            src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                    },
                    banner: "goog.provide(\"tutao.Env\"); \n\
                        tutao.Env = { \n\
                        ssl: false, \n\
                        server: '" + getIpAddress() + "', \n\
                        port: '9000' \n\
                    };\n\n",
                    footer: "tutao.Bootstrap.init();"
                }
            }

        },

        copy: {
            main: {
                files: [
                    {expand: true, src: ['images/**', 'fonts/**', 'graphics/**', 'messages.html'], dest: 'build/'},
                    {expand: true, flatten: true, src: ['js/legacy/FlashFileSaver.swf'], dest: 'build//js/legacy/'}
                ]
            },
            worker: {
                files: [
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

        appcache: {
            options: {
                basePath: 'build'
            },
            all: {
                dest: 'build/tutanota.appcache',
                cache: {
                    patterns: [
                        'build/**/*',
                        '!build/test.html'
                    ]
                },
                network: '*'
            }
        },

        watch: {
            scripts: {
                files: ['index.html', 'test/test.html', 'js/**/*.js', 'lib/*.js', 'less/**.less'],
                tasks: ['concat', 'processhtml', 'copy', 'less'],
                options: {
                    spawn: false
                }
            }
        },

        clean: ["build"]

    });

    grunt.registerTask("default", ['clean', 'fileblocks', 'concat', 'processhtml', 'copy', 'less']);
    grunt.registerTask("dist", ['clean', 'fileblocks', 'concat', 'processhtml', 'copy', 'less', 'appcache']);
}