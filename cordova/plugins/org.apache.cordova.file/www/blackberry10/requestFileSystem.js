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
 * requestFileSystem
 *
 * IN:
 *  args 
 *   0 - type (TEMPORARY = 0, PERSISTENT = 1)
 *   1 - size
 * OUT:
 *  success - FileSystem object
 *   - name - the human readable directory name
 *   - root - DirectoryEntry object
 *      - isDirectory
 *      - isFile
 *      - name
 *      - fullPath
 *  fail - FileError code
 */

var resolve = cordova.require('org.apache.cordova.file.resolveLocalFileSystemURIProxy');

module.exports = function (success, fail, args) {
    var fsType = args[0] === 0 ? 'temporary' : 'persistent',
        size = args[1],
        onSuccess = function (fs) {
            var directory = {
                name: fsType,
                root: fs
            };
            success(directory);
        };
    resolve(onSuccess, fail, ['cdvfile://localhost/' + fsType + '/', undefined, size]);
};
