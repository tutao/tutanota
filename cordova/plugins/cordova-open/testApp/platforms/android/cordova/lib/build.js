#!/usr/bin/env node

/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/

var Q       = require('q'),
    path    = require('path'),
    fs      = require('fs'),
    nopt = require('nopt');

var Adb = require('./Adb');

var builders = require('./builders/builders');
var events = require('cordova-common').events;
var spawn = require('cordova-common').superspawn.spawn;
var CordovaError = require('cordova-common').CordovaError;

function parseOpts(options, resolvedTarget) {
    options = options || {};
    options.argv = nopt({
        gradle: Boolean,
        ant: Boolean,
        prepenv: Boolean,
        versionCode: String,
        minSdkVersion: String,
        gradleArg: String,
        keystore: path,
        alias: String,
        storePassword: String,
        password: String,
        keystoreType: String
    }, {}, options.argv, 0);

    var ret = {
        buildType: options.release ? 'release' : 'debug',
        buildMethod: process.env.ANDROID_BUILD || 'gradle',
        prepEnv: options.argv.prepenv,
        arch: resolvedTarget && resolvedTarget.arch,
        extraArgs: []
    };

    if (options.argv.ant || options.argv.gradle)
        ret.buildMethod = options.argv.ant ? 'ant' : 'gradle';

    if (options.nobuild) ret.buildMethod = 'none';

    if (options.argv.versionCode)
        ret.extraArgs.push('-PcdvVersionCode=' + options.versionCode);

    if (options.argv.minSdkVersion)
        ret.extraArgs.push('-PcdvMinSdkVersion=' + options.minSdkVersion);

    if (options.argv.gradleArg)
        ret.extraArgs.push(options.gradleArg);

    var packageArgs = {};

    if (options.argv.keystore)
        packageArgs.keystore = path.relative(this.root, path.resolve(options.argv.keystore));

    ['alias','storePassword','password','keystoreType'].forEach(function (flagName) {
        if (options.argv[flagName])
            packageArgs[flagName] = options.argv[flagName];
    });

    var buildConfig = options.buildConfig;

    // If some values are not specified as command line arguments - use build config to supplement them.
    // Command line arguemnts have precedence over build config.
    if (buildConfig) {
        if (!fs.existsSync(buildConfig)) {
            throw new Error('Specified build config file does not exist: ' + buildConfig);
        }
        events.emit('log', 'Reading build config file: '+ path.resolve(buildConfig));
        var config = JSON.parse(fs.readFileSync(buildConfig, 'utf8'));
        if (config.android && config.android[ret.buildType]) {
            var androidInfo = config.android[ret.buildType];
            if(androidInfo.keystore && !packageArgs.keystore) {
                packageArgs.keystore = path.resolve(path.dirname(buildConfig), androidInfo.keystore);
            }

            ['alias', 'storePassword', 'password','keystoreType'].forEach(function (key){
                packageArgs[key] = packageArgs[key] || androidInfo[key];
            });
        }
    }

    if (packageArgs.keystore && packageArgs.alias) {
        ret.packageInfo = new PackageInfo(packageArgs.keystore, packageArgs.alias, packageArgs.storePassword,
            packageArgs.password, packageArgs.keystoreType);
    }

    if(!ret.packageInfo) {
        if(Object.keys(packageArgs).length > 0) {
            events.emit('warn', '\'keystore\' and \'alias\' need to be specified to generate a signed archive.');
        }
    }

    return ret;
}

/*
 * Builds the project with the specifed options
 * Returns a promise.
 */
module.exports.runClean = function(options) {
    var opts = parseOpts(options);
    var builder = builders.getBuilder(opts.buildMethod);
    return builder.prepEnv(opts)
    .then(function() {
        return builder.clean(opts);
    });
};

/**
 * Builds the project with the specifed options.
 *
 * @param   {BuildOptions}  options      A set of options. See PlatformApi.build
 *   method documentation for reference.
 * @param   {Object}  optResolvedTarget  A deployment target. Used to pass
 *   target architecture from upstream 'run' call. TODO: remove this option in
 *   favor of setting buildOptions.archs field.
 *
 * @return  {Promise<Object>}            Promise, resolved with built packages
 *   information.
 */
module.exports.run = function(options, optResolvedTarget) {
    var opts = parseOpts(options, optResolvedTarget);
    var builder = builders.getBuilder(opts.buildMethod);
    var self = this;
    return builder.prepEnv(opts)
    .then(function() {
        if (opts.prepEnv) {
            self.events.emit('verbose', 'Build file successfully prepared.');
            return;
        }
        return builder.build(opts)
        .then(function() {
            var apkPaths = builder.findOutputApks(opts.buildType, opts.arch);
            self.events.emit('log', 'Built the following apk(s): \n\t' + apkPaths.join('\n\t'));
            return {
                apkPaths: apkPaths,
                buildType: opts.buildType,
                buildMethod: opts.buildMethod
            };
        });
    });
};

// Called by plugman after installing plugins, and by create script after creating project.
module.exports.prepBuildFiles = function() {
    return builders.getBuilder('gradle').prepBuildFiles();
};

/*
 * Detects the architecture of a device/emulator
 * Returns "arm" or "x86".
 */
module.exports.detectArchitecture = function(target) {
    function helper() {
        return Adb.shell(target, 'cat /proc/cpuinfo')
        .then(function(output) {
            return /intel/i.exec(output) ? 'x86' : 'arm';
        });
    }
    // It sometimes happens (at least on OS X), that this command will hang forever.
    // To fix it, either unplug & replug device, or restart adb server.
    return helper()
    .timeout(1000, new CordovaError('Device communication timed out. Try unplugging & replugging the device.'))
    .then(null, function(err) {
        if (/timed out/.exec('' + err)) {
            // adb kill-server doesn't seem to do the trick.
            // Could probably find a x-platform version of killall, but I'm not actually
            // sure that this scenario even happens on non-OSX machines.
            return spawn('killall', ['adb'])
            .then(function() {
                events.emit('verbose', 'adb seems hung. retrying.');
                return helper()
                .then(null, function() {
                    // The double kill is sadly often necessary, at least on mac.
                    events.emit('warn', 'Now device not found... restarting adb again.');
                    return spawn('killall', ['adb'])
                    .then(function() {
                        return helper()
                        .then(null, function() {
                            return Q.reject(new CordovaError('USB is flakey. Try unplugging & replugging the device.'));
                        });
                    });
                });
            }, function() {
                // For non-killall OS's.
                return Q.reject(err);
            });
        }
        throw err;
    });
};

module.exports.findBestApkForArchitecture = function(buildResults, arch) {
    var paths = buildResults.apkPaths.filter(function(p) {
        var apkName = path.basename(p);
        if (buildResults.buildType == 'debug') {
            return /-debug/.exec(apkName);
        }
        return !/-debug/.exec(apkName);
    });
    var archPattern = new RegExp('-' + arch);
    var hasArchPattern = /-x86|-arm/;
    for (var i = 0; i < paths.length; ++i) {
        var apkName = path.basename(paths[i]);
        if (hasArchPattern.exec(apkName)) {
            if (archPattern.exec(apkName)) {
                return paths[i];
            }
        } else {
            return paths[i];
        }
    }
    throw new Error('Could not find apk architecture: ' + arch + ' build-type: ' + buildResults.buildType);
};

function PackageInfo(keystore, alias, storePassword, password, keystoreType) {
    this.keystore = {
        'name': 'key.store',
        'value': keystore
    };
    this.alias = {
        'name': 'key.alias',
        'value': alias
    };
    if (storePassword) {
        this.storePassword = {
            'name': 'key.store.password',
            'value': storePassword
        };
    }
    if (password) {
        this.password = {
            'name': 'key.alias.password',
            'value': password
        };
    }
    if (keystoreType) {
        this.keystoreType = {
            'name': 'key.store.type',
            'value': keystoreType
        };
    }
}

PackageInfo.prototype = {
    toProperties: function() {
        var self = this;
        var result = '';
        Object.keys(self).forEach(function(key) {
            result += self[key].name;
            result += '=';
            result += self[key].value.replace(/\\/g, '\\\\');
            result += '\n';
        });
        return result;
    }
};

module.exports.help = function() {
    console.log('Usage: ' + path.relative(process.cwd(), path.join('../build')) + ' [flags] [Signed APK flags]');
    console.log('Flags:');
    console.log('    \'--debug\': will build project in debug mode (default)');
    console.log('    \'--release\': will build project for release');
    console.log('    \'--ant\': will build project with ant');
    console.log('    \'--gradle\': will build project with gradle (default)');
    console.log('    \'--nobuild\': will skip build process (useful when using run command)');
    console.log('    \'--prepenv\': don\'t build, but copy in build scripts where necessary');
    console.log('    \'--versionCode=#\': Override versionCode for this build. Useful for uploading multiple APKs. Requires --gradle.');
    console.log('    \'--minSdkVersion=#\': Override minSdkVersion for this build. Useful for uploading multiple APKs. Requires --gradle.');
    console.log('    \'--gradleArg=<gradle command line arg>\': Extra args to pass to the gradle command. Use one flag per arg. Ex. --gradleArg=-PcdvBuildMultipleApks=true');
    console.log('');
    console.log('Signed APK flags (overwrites debug/release-signing.proprties) :');
    console.log('    \'--keystore=<path to keystore>\': Key store used to build a signed archive. (Required)');
    console.log('    \'--alias=\': Alias for the key store. (Required)');
    console.log('    \'--storePassword=\': Password for the key store. (Optional - prompted)');
    console.log('    \'--password=\': Password for the key. (Optional - prompted)');
    console.log('    \'--keystoreType\': Type of the keystore. (Optional)');
    process.exit(0);
};
