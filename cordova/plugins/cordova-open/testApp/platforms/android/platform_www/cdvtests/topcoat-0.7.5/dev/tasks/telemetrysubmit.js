module.exports = function(grunt) {

    grunt.registerTask('telemetry-submit', 'Submit telemetry test results', function(gitCWD) {

        var exec = require("child_process").exec,
            commandToBeExecuted = 'git log --pretty=format:"%H %ci" | head -n 1',
            done = this.async();

        var part1 = {
            properties: {
                path: {
                    message: 'Path to telemetry output file',
                    required: true
                },
                device: {
                    message: 'Device on which the test ran',
                    required: true
                }
            }
        };

        var part2 = {
            properties: {
                test: {
                    message: 'What is the name of the test?',
                    required: true,
                    default: ''
                },
                type: {
                    message: 'Is it a test (nightly) ?',
                    required: true,
                    default: 'Yes'
                }
            }
        };

        exec(commandToBeExecuted, { cwd: gitCWD }, function(error, stdout, stderr) {
            if (error) {
                grunt.log.error('Error');
                console.log(error);
                done();
            } else {

                var path = grunt.option('path')
                ,   device = grunt.option('device')
                ,   test = grunt.option('test')
                // use env variables to overwrite the location
                // where the test results end up, for CI example
                ,   host = process.env.TOPCOAT_BENCHMARK_SERVER
                ,   port = process.env.TOPCOAT_BENCHMARK_PORT
                ,   type = grunt.option('type')
                ,   date = grunt.option('date')
                ,   snapshot
                ,   submitData = require('../test/perf/telemetry/lib/submitData')
                ,   fileName = require('../test/perf/telemetry/lib/extractFileName')
                ,   prompt = require('prompt')
                ;

                if (!path || !test || !device) {
                    // Dummy test to see if it was called without arguments
                    // in this case we request the user for data

                    prompt.start();
                    prompt.get(part1, function (err, result) {
                        var options = result;

                        part2.properties.test.default = fileName(result.path);

                        prompt.get(part2, function (err, result) {
                            for (var i in result)
                                options[i] = result[i];

                            if (options.type.match(/y/gi))
                                options.date = 'snapshot ' + new Date().toISOString();
                            else
                                options.date = stdout;

                            submitData(options.date, options.path, {
                                device: options.device,
                                test: options.test
                            }, {
                                host : host,
                                port : port
                            });
                        });
                    });
                } else {
                    // This is in case for automated tasks that submits the data
                    submitData(stdout, path, {
                        device: device,
                        test: test
                    }, {
                        host : host,
                        port : port
                    });
                }
            }
        });

    });
};