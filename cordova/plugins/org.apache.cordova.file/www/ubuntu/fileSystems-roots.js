/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var fsMap = null;
var FileSystem = require('./FileSystem');
var LocalFileSystem = require('./LocalFileSystem');
var exec = require('cordova/exec');

var requestFileSystem = function(type, size, successCallback) {
    var success = function(file_system) {
        if (file_system) {
            if (successCallback) {
                fs = new FileSystem(file_system.name, file_system.root);
                successCallback(fs);
            }
        }
    };
    exec(success, null, "File", "requestFileSystem", [type, size]);
};

require('./fileSystems').getFs = function(name, callback) {
    if (fsMap) {
        callback(fsMap[name]);
    } else {
        requestFileSystem(LocalFileSystem.PERSISTENT, 1, function(fs) {
            requestFileSystem(LocalFileSystem.TEMPORARY, 1, function(tmp) {
                fsMap = {};
                fsMap[tmp.name] = tmp;
                fsMap[fs.name] = fs;
                callback(fsMap[name]);
            });
        });
    }
};

