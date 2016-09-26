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
 * copyTo
 * 
 * IN:
 *  args
 *   0 - URL of entry to copy
 *   1 - URL of the directory into which to copy/move the entry
 *   2 - the new name of the entry, defaults to the current name
 *  move - if true, delete the entry which was copied
 * OUT:
 *  success - entry for the copied file or directory
 *  fail - FileError
 */

var resolve = cordova.require('cordova-plugin-file.resolveLocalFileSystemURIProxy'),
    requestAnimationFrame = cordova.require('cordova-plugin-file.bb10RequestAnimationFrame');

module.exports = function (success, fail, args, move) {
    var uri = args[0],
        destination = args[1],
        fileName = args[2],
        copiedEntry,
        onSuccess = function () {
            resolve(
                function (entry) {
                    if (typeof(success) === 'function') {
                        success(entry);
                    }
                },
                onFail,
                [destination + copiedEntry.name]
            );
        },
        onFail = function (error) {
            if (typeof(fail) === 'function') {
                if (error && error.code) {
                    //set error codes expected by mobile spec
                    if (uri === destination) {
                        fail(FileError.INVALID_MODIFICATION_ERR);
                    } else if (error.code === FileError.SECURITY_ERR) {
                        fail(FileError.INVALID_MODIFICATION_ERR);
                    } else {
                        fail(error.code);
                    }
                } else {
                    fail(error);
                }
            }
        },
        writeFile = function (fileEntry, blob, entry) {
            copiedEntry = fileEntry;
            fileEntry.createWriter(function (fileWriter) {
                fileWriter.onwriteend = function () {
                    if (move) {
                        entry.nativeEntry.remove(onSuccess, function () {
                            console.error("Move operation failed. Files may exist at both source and destination");
                        });
                    } else {
                        onSuccess();
                    }
                };
                fileWriter.onerror = onFail;
                fileWriter.write(blob);
            }, onFail);
        },
        copyFile = function (entry) {
            if (entry.nativeEntry.file) {
                entry.nativeEntry.file(function (file) {
                    var reader = new FileReader()._realReader;
                    reader.onloadend = function (e) {
                        var contents = new Uint8Array(this.result),
                            blob = new Blob([contents]);
                        resolve(function (destEntry) {
                            requestAnimationFrame(function () {
                                destEntry.nativeEntry.getFile(fileName, {create: true}, function (fileEntry) {
                                    writeFile(fileEntry, blob, entry);
                                }, onFail);
                            });
                        }, onFail, [destination]);   
                    };
                    reader.onerror = onFail;
                    reader.readAsArrayBuffer(file);
                }, onFail);
            } else {
                onFail(FileError.INVALID_MODIFICATION_ERR);
            }
        },
        copyDirectory = function (entry) {
            resolve(function (destEntry) {
                if (entry.filesystemName !== destEntry.filesystemName) {
                    console.error("Copying directories between filesystems is not supported on BB10");
                    onFail(FileError.INVALID_MODIFICATION_ERR);   
                } else {
                    entry.nativeEntry.copyTo(destEntry.nativeEntry, fileName, function () {
                        resolve(function (copiedDir) {
                            copiedEntry = copiedDir;
                            if (move) {
                                entry.nativeEntry.removeRecursively(onSuccess, onFail);
                            } else {
                                onSuccess();
                            }
                        }, onFail, [destination + fileName]);
                    }, onFail);
                }
            }, onFail, [destination]); 
        };
    if (destination + fileName === uri) {
        onFail(FileError.INVALID_MODIFICATION_ERR);
    } else if (fileName.indexOf(':') > -1) {
        onFail(FileError.ENCODING_ERR);
    } else {
        resolve(function (entry) {
            if (entry.isDirectory) {
                copyDirectory(entry);
            } else {
                copyFile(entry);
            }
        }, onFail, [uri]);
    }
};
