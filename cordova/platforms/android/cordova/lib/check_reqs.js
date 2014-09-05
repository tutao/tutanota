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

var shell = require('shelljs'),
    child_process = require('child_process'),
    Q     = require('q'),
    path  = require('path'),
    fs    = require('fs'),
    ROOT  = path.join(__dirname, '..', '..');

// Get valid target from framework/project.properties
module.exports.get_target = function() {
    if(fs.existsSync(path.join(ROOT, 'framework', 'project.properties'))) {
        var target = shell.grep(/target=android-[\d+]/, path.join(ROOT, 'framework', 'project.properties'));
        return target.split('=')[1].replace('\n', '').replace('\r', '').replace(' ', '');
    } else if (fs.existsSync(path.join(ROOT, 'project.properties'))) {
        // if no target found, we're probably in a project and project.properties is in ROOT.
        // this is called on the project itself, and can support Google APIs AND Vanilla Android
        var target = shell.grep(/target=android-[\d+]/, path.join(ROOT, 'project.properties')) ||
          shell.grep(/target=Google Inc.:Google APIs:[\d+]/, path.join(ROOT, 'project.properties'));
        return target.split('=')[1].replace('\n', '').replace('\r', '');
    }
}

// Returns a promise.
module.exports.check_ant = function() {
    var d = Q.defer();
    child_process.exec('ant -version', function(err, stdout, stderr) {
        if (err) d.reject(new Error('ERROR : executing command \'ant\', make sure you have ant installed and added to your path.'));
        else d.resolve();
    });
    return d.promise;
}

// Returns a promise.
module.exports.check_java = function() {
    var d = Q.defer();
    child_process.exec('java -version', function(err, stdout, stderr) {
        if(err) {
            var msg =
                'Failed to run \'java -version\', make sure your java environment is set up\n' +
                'including JDK and JRE.\n' +
                'Your JAVA_HOME variable is ' + process.env.JAVA_HOME + '\n';
            d.reject(new Error(msg + err));
        }
        else d.resolve();
    });
    return d.promise;
}

// Returns a promise.
module.exports.check_android = function() {
    var valid_target = this.get_target();
    var d = Q.defer();
    child_process.exec('android list targets', function(err, stdout, stderr) {
        if (err) d.reject(stderr);
        else d.resolve(stdout);
    });

    return d.promise.then(function(output) {
        if (!output.match(valid_target)) {
            return Q.reject(new Error('Please install Android target ' + valid_target.split('-')[1] + ' (the Android newest SDK). Make sure you have the latest Android tools installed as well. Run \"android\" from your command-line to install/update any missing SDKs or tools.'));
        }
        return Q();
    }, function(stderr) {
        if (stderr.match(/command\snot\sfound/)) {
            return Q.reject(new Error('The command \"android\" failed. Make sure you have the latest Android SDK installed, and the \"android\" command (inside the tools/ folder) is added to your path.'));
        } else {
            return Q.reject(new Error('An error occurred while listing Android targets'));
        }
    });
}

// Returns a promise.
module.exports.run = function() {
    return Q.all([this.check_ant(), this.check_java(), this.check_android()]);
}

