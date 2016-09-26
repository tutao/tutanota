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

/* jshint sub:true */

var shelljs = require('shelljs'),
    child_process = require('child_process'),
    Q     = require('q'),
    path  = require('path'),
    fs    = require('fs'),
    ROOT  = path.join(__dirname, '..', '..');
var CordovaError = require('cordova-common').CordovaError;

var isWindows = process.platform == 'win32';

function forgivingWhichSync(cmd) {
    try {
        return fs.realpathSync(shelljs.which(cmd));
    } catch (e) {
        return '';
    }
}

function tryCommand(cmd, errMsg, catchStderr) {
    var d = Q.defer();
    child_process.exec(cmd, function(err, stdout, stderr) {
        if (err) d.reject(new CordovaError(errMsg));
        // Sometimes it is necessary to return an stderr instead of stdout in case of success, since
        // some commands prints theirs output to stderr instead of stdout. 'javac' is the example
        else d.resolve((catchStderr ? stderr : stdout).trim());
    });
    return d.promise;
}

// Get valid target from framework/project.properties
module.exports.get_target = function() {
    function extractFromFile(filePath) {
        var target = shelljs.grep(/\btarget=/, filePath);
        if (!target) {
            throw new Error('Could not find android target within: ' + filePath);
        }
        return target.split('=')[1].trim();
    }
    if (fs.existsSync(path.join(ROOT, 'framework', 'project.properties'))) {
        return extractFromFile(path.join(ROOT, 'framework', 'project.properties'));
    }
    if (fs.existsSync(path.join(ROOT, 'project.properties'))) {
        // if no target found, we're probably in a project and project.properties is in ROOT.
        return extractFromFile(path.join(ROOT, 'project.properties'));
    }
    throw new Error('Could not find android target. File missing: ' + path.join(ROOT, 'project.properties'));
};

// Returns a promise. Called only by build and clean commands.
module.exports.check_ant = function() {
    return tryCommand('ant -version', 'Failed to run "ant -version", make sure you have ant installed and added to your PATH.')
    .then(function (output) {
        // Parse Ant version from command output
        return /version ((?:\d+\.)+(?:\d+))/i.exec(output)[1];
    });
};

// Returns a promise. Called only by build and clean commands.
module.exports.check_gradle = function() {
    var sdkDir = process.env['ANDROID_HOME'];
    if (!sdkDir)
        return Q.reject(new CordovaError('Could not find gradle wrapper within Android SDK. Could not find Android SDK directory.\n' +
            'Might need to install Android SDK or set up \'ANDROID_HOME\' env variable.'));

    var wrapperDir = path.join(sdkDir, 'tools', 'templates', 'gradle', 'wrapper');
    if (!fs.existsSync(wrapperDir)) {
        return Q.reject(new CordovaError('Could not find gradle wrapper within Android SDK. Might need to update your Android SDK.\n' +
            'Looked here: ' + wrapperDir));
    }
    return Q.when();
};

// Returns a promise.
module.exports.check_java = function() {
    var javacPath = forgivingWhichSync('javac');
    var hasJavaHome = !!process.env['JAVA_HOME'];
    return Q().then(function() {
        if (hasJavaHome) {
            // Windows java installer doesn't add javac to PATH, nor set JAVA_HOME (ugh).
            if (!javacPath) {
                process.env['PATH'] += path.delimiter + path.join(process.env['JAVA_HOME'], 'bin');
            }
        } else {
            if (javacPath) {
                var msg = 'Failed to find \'JAVA_HOME\' environment variable. Try setting setting it manually.';
                // OS X has a command for finding JAVA_HOME.
                if (fs.existsSync('/usr/libexec/java_home')) {
                    return tryCommand('/usr/libexec/java_home', msg)
                    .then(function(stdout) {
                        process.env['JAVA_HOME'] = stdout.trim();
                    });
                } else {
                    // See if we can derive it from javac's location.
                    // fs.realpathSync is require on Ubuntu, which symplinks from /usr/bin -> JDK
                    var maybeJavaHome = path.dirname(path.dirname(javacPath));
                    if (fs.existsSync(path.join(maybeJavaHome, 'lib', 'tools.jar'))) {
                        process.env['JAVA_HOME'] = maybeJavaHome;
                    } else {
                        throw new CordovaError(msg);
                    }
                }
            } else if (isWindows) {
                // Try to auto-detect java in the default install paths.
                var oldSilent = shelljs.config.silent;
                shelljs.config.silent = true;
                var firstJdkDir =
                    shelljs.ls(process.env['ProgramFiles'] + '\\java\\jdk*')[0] ||
                    shelljs.ls('C:\\Program Files\\java\\jdk*')[0] ||
                    shelljs.ls('C:\\Program Files (x86)\\java\\jdk*')[0];
                shelljs.config.silent = oldSilent;
                if (firstJdkDir) {
                    // shelljs always uses / in paths.
                    firstJdkDir = firstJdkDir.replace(/\//g, path.sep);
                    if (!javacPath) {
                        process.env['PATH'] += path.delimiter + path.join(firstJdkDir, 'bin');
                    }
                    process.env['JAVA_HOME'] = firstJdkDir;
                }
            }
        }
    }).then(function() {
        var msg =
            'Failed to run "java -version", make sure that you have a JDK installed.\n' +
            'You can get it from: http://www.oracle.com/technetwork/java/javase/downloads.\n';
        if (process.env['JAVA_HOME']) {
            msg += 'Your JAVA_HOME is invalid: ' + process.env['JAVA_HOME'] + '\n';
        }
        return tryCommand('java -version', msg)
        .then(function() {
            // We use tryCommand with catchStderr = true, because
            // javac writes version info to stderr instead of stdout
            return tryCommand('javac -version', msg, true);
        }).then(function (output) {
            var match = /javac ((?:\d+\.)+(?:\d+))/i.exec(output)[1];
            return match && match[1];
        });
    });
};

// Returns a promise.
module.exports.check_android = function() {
    return Q().then(function() {
        var androidCmdPath = forgivingWhichSync('android');
        var adbInPath = !!forgivingWhichSync('adb');
        var hasAndroidHome = !!process.env['ANDROID_HOME'] && fs.existsSync(process.env['ANDROID_HOME']);
        function maybeSetAndroidHome(value) {
            if (!hasAndroidHome && fs.existsSync(value)) {
                hasAndroidHome = true;
                process.env['ANDROID_HOME'] = value;
            }
        }
        if (!hasAndroidHome && !androidCmdPath) {
            if (isWindows) {
                // Android Studio 1.0 installer
                maybeSetAndroidHome(path.join(process.env['LOCALAPPDATA'], 'Android', 'sdk'));
                maybeSetAndroidHome(path.join(process.env['ProgramFiles'], 'Android', 'sdk'));
                // Android Studio pre-1.0 installer
                maybeSetAndroidHome(path.join(process.env['LOCALAPPDATA'], 'Android', 'android-studio', 'sdk'));
                maybeSetAndroidHome(path.join(process.env['ProgramFiles'], 'Android', 'android-studio', 'sdk'));
                // Stand-alone installer
                maybeSetAndroidHome(path.join(process.env['LOCALAPPDATA'], 'Android', 'android-sdk'));
                maybeSetAndroidHome(path.join(process.env['ProgramFiles'], 'Android', 'android-sdk'));
            } else if (process.platform == 'darwin') {
                // Android Studio 1.0 installer
                maybeSetAndroidHome(path.join(process.env['HOME'], 'Library', 'Android', 'sdk'));
                // Android Studio pre-1.0 installer
                maybeSetAndroidHome('/Applications/Android Studio.app/sdk');
                // Stand-alone zip file that user might think to put under /Applications
                maybeSetAndroidHome('/Applications/android-sdk-macosx');
                maybeSetAndroidHome('/Applications/android-sdk');
            }
            if (process.env['HOME']) {
                // Stand-alone zip file that user might think to put under their home directory
                maybeSetAndroidHome(path.join(process.env['HOME'], 'android-sdk-macosx'));
                maybeSetAndroidHome(path.join(process.env['HOME'], 'android-sdk'));
            }
        }
        if (hasAndroidHome && !androidCmdPath) {
            process.env['PATH'] += path.delimiter + path.join(process.env['ANDROID_HOME'], 'tools');
        }
        if (androidCmdPath && !hasAndroidHome) {
            var parentDir = path.dirname(androidCmdPath);
            var grandParentDir = path.dirname(parentDir);
            if (path.basename(parentDir) == 'tools') {
                process.env['ANDROID_HOME'] = path.dirname(parentDir);
                hasAndroidHome = true;
            } else if (fs.existsSync(path.join(grandParentDir, 'tools', 'android'))) {
                process.env['ANDROID_HOME'] = grandParentDir;
                hasAndroidHome = true;
            } else {
                throw new CordovaError('Failed to find \'ANDROID_HOME\' environment variable. Try setting setting it manually.\n' +
                    'Detected \'android\' command at ' + parentDir + ' but no \'tools\' directory found near.\n' +
                    'Try reinstall Android SDK or update your PATH to include path to valid SDK directory.');
            }
        }
        if (hasAndroidHome && !adbInPath) {
            process.env['PATH'] += path.delimiter + path.join(process.env['ANDROID_HOME'], 'platform-tools');
        }
        if (!process.env['ANDROID_HOME']) {
            throw new CordovaError('Failed to find \'ANDROID_HOME\' environment variable. Try setting setting it manually.\n' +
                'Failed to find \'android\' command in your \'PATH\'. Try update your \'PATH\' to include path to valid SDK directory.');
        }
        if (!fs.existsSync(process.env['ANDROID_HOME'])) {
            throw new CordovaError('\'ANDROID_HOME\' environment variable is set to non-existent path: ' + process.env['ANDROID_HOME'] +
                '\nTry update it manually to point to valid SDK directory.');
        }
    });
};

module.exports.getAbsoluteAndroidCmd = function () {
    var cmd = forgivingWhichSync('android');
    if (process.platform === 'win32') {
        return '"' + cmd + '"';
    }
    return cmd.replace(/(\s)/g, '\\$1');
};

module.exports.check_android_target = function(valid_target) {
    // valid_target can look like:
    //   android-19
    //   android-L
    //   Google Inc.:Google APIs:20
    //   Google Inc.:Glass Development Kit Preview:20
    if (!valid_target) valid_target = module.exports.get_target();
    var msg = 'Android SDK not found. Make sure that it is installed. If it is not at the default location, set the ANDROID_HOME environment variable.';
    return tryCommand('android list targets --compact', msg)
    .then(function(output) {
        var targets = output.split('\n');
        if (targets.indexOf(valid_target) >= 0) {
            return targets;
        }

        var androidCmd = module.exports.getAbsoluteAndroidCmd();
        throw new CordovaError('Please install Android target: "' + valid_target + '".\n\n' +
            'Hint: Open the SDK manager by running: ' + androidCmd + '\n' +
            'You will require:\n' +
            '1. "SDK Platform" for ' + valid_target + '\n' +
            '2. "Android SDK Platform-tools (latest)\n' +
            '3. "Android SDK Build-tools" (latest)');
    });
};

// Returns a promise.
module.exports.run = function() {
    return Q.all([this.check_java(), this.check_android().then(this.check_android_target)])
    .then(function() {
        console.log('ANDROID_HOME=' + process.env['ANDROID_HOME']);
        console.log('JAVA_HOME=' + process.env['JAVA_HOME']);
    });
};

/**
 * Object thar represents one of requirements for current platform.
 * @param {String} id         The unique identifier for this requirements.
 * @param {String} name       The name of requirements. Human-readable field.
 * @param {String} version    The version of requirement installed. In some cases could be an array of strings
 *                            (for example, check_android_target returns an array of android targets installed)
 * @param {Boolean} installed Indicates whether the requirement is installed or not
 */
var Requirement = function (id, name, version, installed) {
    this.id = id;
    this.name = name;
    this.installed = installed || false;
    this.metadata = {
        version: version,
    };
};

/**
 * Methods that runs all checks one by one and returns a result of checks
 * as an array of Requirement objects. This method intended to be used by cordova-lib check_reqs method
 *
 * @return Promise<Requirement[]> Array of requirements. Due to implementation, promise is always fulfilled.
 */
module.exports.check_all = function() {

    var requirements = [
        new Requirement('java', 'Java JDK'),
        new Requirement('androidSdk', 'Android SDK'),
        new Requirement('androidTarget', 'Android target'),
        new Requirement('gradle', 'Gradle')
    ];

    var checkFns = [
        this.check_java,
        this.check_android,
        this.check_android_target,
        this.check_gradle
    ];

    // Then execute requirement checks one-by-one
    return checkFns.reduce(function (promise, checkFn, idx) {
        // Update each requirement with results
        var requirement = requirements[idx];
        return promise.then(checkFn)
        .then(function (version) {
            requirement.installed = true;
            requirement.metadata.version = version;
        }, function (err) {
            requirement.metadata.reason = err instanceof Error ? err.message : err;
        });
    }, Q())
    .then(function () {
        // When chain is completed, return requirements array to upstream API
        return requirements;
    });
};
