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
 * readAsArrayBuffer
 * 
 * IN:
 *  args
 *   0 - URL of file to read
 *   1 - start position
 *   2 - end position
 * OUT:
 *  success - ArrayBuffer of file
 *  fail - FileError
 */

var resolve = cordova.require('cordova-plugin-file.resolveLocalFileSystemURIProxy'),
    requestAnimationFrame = cordova.require('cordova-plugin-file.bb10RequestAnimationFrame');

module.exports = function (success, fail, args) {
    var uri = args[0],
        start = args[1],
        end = args[2],
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
            fs.nativeEntry.file(function (file) {
                var reader = new FileReader()._realReader;
                reader.onloadend = function () {
                    onSuccess(this.result.slice(start, end));
                };
                reader.onerror = onFail;
                reader.readAsArrayBuffer(file); 
            }, onFail);
        });
    }, fail, [uri]);
};
