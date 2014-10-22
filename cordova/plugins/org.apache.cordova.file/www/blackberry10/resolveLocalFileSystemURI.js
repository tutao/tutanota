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
 * resolveLocalFileSystemURI
 *
 * IN
 *  args
 *   0 - escaped local filesystem URI
 *   1 - options (standard HTML5 file system options)
 *   2 - size
 * OUT
 *  success - Entry object
 *   - isDirectory
 *   - isFile
 *   - name
 *   - fullPath
 *   - nativeURL
 *   - fileSystemName
 *  fail - FileError code
 */

var info = require('org.apache.cordova.file.bb10FileSystemInfo'),
    requestAnimationFrame = cordova.require('org.apache.cordova.file.bb10RequestAnimationFrame'),
    createEntryFromNative = require('org.apache.cordova.file.bb10CreateEntryFromNative'),
    SANDBOXED = true,
    UNSANDBOXED = false;

module.exports = function (success, fail, args) {
    var request = args[0],
        options = args[1],
        size = args[2];
    if (request) {
        request = decodeURIComponent(request);
        if (request.indexOf('?') > -1) {
            //bb10 does not support params; strip them off
            request = request.substring(0, request.indexOf('?'));
        }
        if (request.indexOf('file://localhost/') === 0) {
            //remove localhost prefix
            request = request.replace('file://localhost/', 'file:///');
        }
        //requests to sandboxed locations should use cdvfile
        request = request.replace(info.persistentPath, 'cdvfile://localhost/persistent');
        request = request.replace(info.temporaryPath, 'cdvfile://localhost/temporary');
        //pick appropriate handler
        if (request.indexOf('file:///') === 0) {
            resolveFile(success, fail, request, options);
        } else if (request.indexOf('cdvfile://localhost/') === 0) {
            resolveCdvFile(success, fail, request, options, size);
        } else if (request.indexOf('local:///') === 0) {
            resolveLocal(success, fail, request, options);
        } else {
            fail(FileError.ENCODING_ERR);
        }
    } else {
        fail(FileError.NOT_FOUND_ERR);
    }
};

//resolve file:///
function resolveFile(success, fail, request, options) {
    var path = request.substring(7);
    resolve(success, fail, path, window.PERSISTENT, UNSANDBOXED, options);
}

//resolve cdvfile://localhost/filesystemname/
function resolveCdvFile(success, fail, request, options, size) {
    var components = /cdvfile:\/\/localhost\/([^\/]+)\/(.*)/.exec(request),
        fsType = components[1],
        path = components[2];
    if (fsType === 'persistent') {
        resolve(success, fail, path, window.PERSISTENT, SANDBOXED, options, size);
    }
    else if (fsType === 'temporary') {
        resolve(success, fail, path, window.TEMPORARY, SANDBOXED, options, size);
    }
    else if (fsType === 'root') {
        resolve(success, fail, path, window.PERSISTENT, UNSANDBOXED, options);
    }
    else {
        fail(FileError.NOT_FOUND_ERR);
    }
}

//resolve local:///
function resolveLocal(success, fail, request, options) {
    var path = localPath + request.substring(8);
    resolve(success, fail, path, window.PERSISTENT, UNSANDBOXED, options);
}

//validate parameters and set sandbox
function resolve(success, fail, path, fsType, sandbox, options, size) {
    options = options || { create: false };
    size = size || info.MAX_SIZE;
    if (size > info.MAX_SIZE) {
        //bb10 does not respect quota; fail at unreasonably large size
        fail(FileError.QUOTA_EXCEEDED_ERR);
    } else if (path.indexOf(':') > -1) {
        //files with : character are not valid in Cordova apps 
        fail(FileError.ENCODING_ERR);
    } else {
        requestAnimationFrame(function () {
            cordova.exec(function () {
                requestAnimationFrame(function () {
                    resolveNative(success, fail, path, fsType, options, size);
                });
            }, fail, 'File', 'setSandbox', [sandbox], false);
        });
    }
}

//find path using webkit file system
function resolveNative(success, fail, path, fsType, options, size) {
    window.webkitRequestFileSystem(
        fsType,
        size,
        function (fs) {
            if (path === '') {
                //no path provided, call success with root file system
                success(createEntryFromNative(fs.root));
            } else {
                //otherwise attempt to resolve as file
                fs.root.getFile(
                    path,
                    options,
                    function (entry) {
                        success(createEntryFromNative(entry));
                    },
                    function (fileError) {
                        //file not found, attempt to resolve as directory
                        fs.root.getDirectory(
                            path,
                            options,
                            function (entry) {
                                success(createEntryFromNative(entry));
                            },
                            function (dirError) {
                                //path cannot be resolved
                                if (fileError.code === FileError.INVALID_MODIFICATION_ERR && 
                                    options.exclusive) {
                                    //mobile-spec expects this error code
                                    fail(FileError.PATH_EXISTS_ERR);
                                } else {
                                    fail(FileError.NOT_FOUND_ERR);
                                }
                            }
                        );
                    }
                );
            }
        }
    );
}
