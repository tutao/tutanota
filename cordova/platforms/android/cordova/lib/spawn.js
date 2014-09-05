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

var child_process = require('child_process'),
    Q       = require('q');
var isWindows = process.platform.slice(0, 3) == 'win';

// Takes a command and optional current working directory.
module.exports = function(cmd, args, opt_cwd) {
    var d = Q.defer();
    try {
        // Work around spawn not being able to find .bat files.
        if (isWindows) {
          args.unshift('/s', '/c', cmd);
          cmd = 'cmd';
        }
        var child = child_process.spawn(cmd, args, {cwd: opt_cwd, stdio: 'inherit'});
        child.on('exit', function(code) {
            if (code) {
                d.reject('Error code ' + code + ' for command: ' + cmd + ' with args: ' + args);
            } else {
                d.resolve();
            }
        });
    } catch(e) {
        console.error('error caught: ' + e);
        d.reject(e);
    }
    return d.promise;
}

