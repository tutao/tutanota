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
 * info
 *
 * persistentPath - full path to app sandboxed persistent storage
 * temporaryPath - full path to app sandboxed temporary storage
 * localPath - full path to app source (www dir)
 * MAX_SIZE - maximum size for filesystem request
 */

var info = {
    persistentPath: "", 
    temporaryPath: "", 
    localPath: "",
    MAX_SIZE: 64 * 1024 * 1024 * 1024
};

cordova.exec(
    function (path) {
        info.persistentPath = 'file://' + path + '/webviews/webfs/persistent/local__0';
        info.temporaryPath = 'file://' + path + '/webviews/webfs/temporary/local__0';
        info.localPath = path.replace('/data', '/app/native');
    },
    function () {
        console.error('Unable to determine local storage file path');
    },
    'File',
    'getHomePath',
    false
);

module.exports = info;
