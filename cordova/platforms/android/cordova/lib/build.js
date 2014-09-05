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

var shell   = require('shelljs'),
    spawn   = require('./spawn'),
    Q       = require('q'),
    path    = require('path'),
    fs      = require('fs'),
    ROOT    = path.join(__dirname, '..', '..');


function hasCustomRules() {
    return fs.existsSync(path.join(ROOT, 'custom_rules.xml'));
}
module.exports.getAntArgs = function(cmd) {
    var args = [cmd, '-f', path.join(ROOT, 'build.xml')];
    // custom_rules.xml is required for incremental builds.
    if (hasCustomRules()) {
        args.push('-Dout.dir=ant-build', '-Dgen.absolute.dir=ant-gen');
    }
    return args;
};

/*
 * Builds the project with ant.
 * Returns a promise.
 */
module.exports.run = function(build_type) {
    //default build type
    build_type = typeof build_type !== 'undefined' ? build_type : "--debug";
    var args = module.exports.getAntArgs('debug');
    switch(build_type) {
        case '--debug' :
            break;
        case '--release' :
            args[0] = 'release';
            break;
        case '--nobuild' :
            console.log('Skipping build...');
            return Q();
        default :
            return Q.reject('Build option \'' + build_type + '\' not recognized.');
    }
    // Without our custom_rules.xml, we need to clean before building.
    var ret = Q();
    if (!hasCustomRules()) {
        ret = require('./clean').run();
    }
    return ret.then(function() {
        return spawn('ant', args);
    });
}

/*
 * Gets the path to the apk file, if not such file exists then
 * the script will error out. (should we error or just return undefined?)
 */
module.exports.get_apk = function() {
    var binDir = '';
    if(!hasCustomRules()) {
        binDir = path.join(ROOT, 'bin');
    } else {
        binDir = path.join(ROOT, 'ant-build');
    }
    if (fs.existsSync(binDir)) {
        var candidates = fs.readdirSync(binDir).filter(function(p) {
            // Need to choose between release and debug .apk.
            return path.extname(p) == '.apk';
        }).map(function(p) {
            p = path.join(binDir, p);
            return { p: p, t: fs.statSync(p).mtime };
        }).sort(function(a,b) {
            return a.t > b.t ? -1 :
                   a.t < b.t ? 1 : 0;
        });
        if (candidates.length === 0) {
            console.error('ERROR : No .apk found in ' + binDir + ' directory');
            process.exit(2);
        }
        console.log('Using apk: ' + candidates[0].p);
        return candidates[0].p;
    } else {
        console.error('ERROR : unable to find project ' + binDir + ' directory, could not locate .apk');
        process.exit(2);
    }
}

module.exports.help = function() {
    console.log('Usage: ' + path.relative(process.cwd(), path.join(ROOT, 'cordova', 'build')) + ' [build_type]');
    console.log('Build Types : ');
    console.log('    \'--debug\': Default build, will build project in using ant debug');
    console.log('    \'--release\': will build project using ant release');
    console.log('    \'--nobuild\': will skip build process (can be used with run command)');
    process.exit(0);
}
