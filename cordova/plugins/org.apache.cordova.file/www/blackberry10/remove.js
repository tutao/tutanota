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
 * remove
 * 
 * IN:
 *  args
 *   0 - URL of Entry to remove
 * OUT:
 *  success - (no args)
 *  fail - FileError
 */

var resolve = cordova.require('org.apache.cordova.file.resolveLocalFileSystemURIProxy'),
    requestAnimationFrame = cordova.require('org.apache.cordova.file.bb10RequestAnimationFrame');

module.exports = function (success, fail, args) {
    var uri = args[0],
        onSuccess = function (data) {
            if (typeof success === 'function') {
                success(data);
            }
        },
        onFail = function (error) {
            if (typeof fail === 'function') {
                if (error && error.code) {
                    fail(error.code);
                } else {
                    fail(error);
                }
            }
        };
    resolve(function (fs) {
        requestAnimationFrame(function () {
            if (fs.fullPath === '/') {
                onFail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            } else {
                fs.nativeEntry.remove(onSuccess, onFail);
            }
        });
    }, fail, [uri]);
};
