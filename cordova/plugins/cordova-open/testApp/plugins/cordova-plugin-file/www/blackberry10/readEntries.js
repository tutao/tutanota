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

/* 
 * readEntries
 * 
 * IN:
 *  args
 *   0 - URL of directory to list
 * OUT:
 *  success - Array of Entry objects
 *  fail - FileError
 */

var resolve = cordova.require('cordova-plugin-file.resolveLocalFileSystemURIProxy'),
    info = require('cordova-plugin-file.bb10FileSystemInfo'),
    requestAnimationFrame = cordova.require('cordova-plugin-file.bb10RequestAnimationFrame'),
    createEntryFromNative = cordova.require('cordova-plugin-file.bb10CreateEntryFromNative');

module.exports = function (success, fail, args) {
    var uri = args[0],
        onSuccess = function (data) {
            if (typeof success === 'function') {
                success(data);
            }
        },
        onFail = function (error) {
            if (typeof fail === 'function') {
                if (error.code) {
                    fail(error.code);
                } else {
                    fail(error);
                }
            }
        };
    resolve(function (fs) {
        requestAnimationFrame(function () {
            var reader = fs.nativeEntry.createReader(),
                entries = [],
                readEntries = function() {
                    reader.readEntries(function (results) {
                        if (!results.length) {
                            onSuccess(entries.sort().map(createEntryFromNative));
                        } else {
                            entries = entries.concat(Array.prototype.slice.call(results || [], 0));
                            readEntries();
                        }
                    }, onFail);
                };
            readEntries();
        });
    }, fail, [uri]);
};
