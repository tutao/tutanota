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

/* global Blob:false */

var cordova = require('cordova'),
    resolve = cordova.require('cordova-plugin-file.resolveLocalFileSystemURIProxy'),
    requestAnimationFrame = cordova.require('cordova-plugin-file.bb10RequestAnimationFrame'),
    xhr = {};

function getParentPath(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(0, pos + 1);
}

function getFileName(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(pos + 1);
}

function checkURL(url) {
    return url.indexOf(' ') === -1 ?  true : false;
}

module.exports = {
    abort: function (win, fail, args) {
        var id = args[0];
        if (xhr[id]) {
            xhr[id].abort();
            if (typeof(win) === 'function') {
                win();
            }
        } else if (typeof(fail) === 'function') {
            fail();
        }
    },

    upload: function(win, fail, args) {
        var filePath = args[0],
            server = args[1],
            fileKey = args[2],
            fileName = args[3],
            mimeType = args[4],
            params = args[5],
            /*trustAllHosts = args[6],*/
            chunkedMode = args[7],
            headers = args[8],
            onSuccess = function (data) {
                if (typeof(win) === 'function') {
                    win(data);
                }
            },
            onFail = function (code) {
                delete xhr[fileKey];
                if (typeof(fail) === 'function') {
                    fail(code);
                }
            };

        if (!checkURL(server)) {
            onFail(new FileTransferError(FileTransferError.INVALID_URL_ERR, server, filePath));
        }

        xhr[fileKey] = new XMLHttpRequest();
        xhr[fileKey].onabort = function () {
            onFail(new FileTransferError(FileTransferError.ABORT_ERR, server, filePath, this.status, xhr[fileKey].response));
        };

        resolve(function(entry) {
            requestAnimationFrame(function () {
                entry.nativeEntry.file(function(file) {
                    function uploadFile(blobFile) {
                        var fd = new FormData();

                        fd.append(fileKey, blobFile, fileName);
                        for (var prop in params) {
                            if(params.hasOwnProperty(prop)) {
                                fd.append(prop, params[prop]);
                            }
                        }

                        xhr[fileKey].open("POST", server);
                        xhr[fileKey].onload = function(evt) {
                            if (xhr[fileKey].status === 200) {
                                var result = new FileUploadResult();
                                result.bytesSent = file.size;
                                result.responseCode = xhr[fileKey].status;
                                result.response = xhr[fileKey].response;
                                delete xhr[fileKey];
                                onSuccess(result);
                            } else if (xhr[fileKey].status === 404) {
                                onFail(new FileTransferError(FileTransferError.INVALID_URL_ERR, server, filePath, xhr[fileKey].status, xhr[fileKey].response));
                            } else {
                                onFail(new FileTransferError(FileTransferError.CONNECTION_ERR, server, filePath, xhr[fileKey].status, xhr[fileKey].response));
                            }
                        };
                        xhr[fileKey].ontimeout = function(evt) {
                            onFail(new FileTransferError(FileTransferError.CONNECTION_ERR, server, filePath, xhr[fileKey].status, xhr[fileKey].response));
                        };
                        xhr[fileKey].onerror = function () {
                            onFail(new FileTransferError(FileTransferError.CONNECTION_ERR, server, filePath, this.status, xhr[fileKey].response));
                        };
                        xhr[fileKey].upload.onprogress = function (evt) {
                            if (evt.loaded > 0) {
                                onSuccess(evt);
                            }
                        };

                        for (var header in headers) {
                            if (headers.hasOwnProperty(header)) {
                                xhr[fileKey].setRequestHeader(header, headers[header]);
                            }
                        }

                        requestAnimationFrame(function () {
                            xhr[fileKey].send(fd);
                        });
                    }

                    var bytesPerChunk;
                    if (chunkedMode === true) {
                        bytesPerChunk = 1024 * 1024; // 1MB chunk sizes.
                    } else {
                        bytesPerChunk = file.size;
                    }
                    var start = 0;
                    var end = bytesPerChunk;
                    while (start < file.size) {
                        var chunk = file.slice(start, end, mimeType);
                        uploadFile(chunk);
                        start = end;
                        end = start + bytesPerChunk;
                    }
                }, function(error) {
                    onFail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR, server, filePath));
                });
            });
        }, function(error) {
            onFail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR, server, filePath));
        }, [filePath]);
    },

    download: function (win, fail, args) {
        var source = args[0],
            target = args[1],
            id = args[3],
            headers = args[4],
            fileWriter,
            onSuccess = function (entry) {
                if (typeof(win) === 'function') {
                    win(entry);
                }
            },
            onFail = function (error) {
                var reader;
                delete xhr[id];
                if (typeof(fail) === 'function') {
                    if (error && error.body && typeof(error.body) === 'object') {
                        reader = new FileReader()._realReader;
                        reader.onloadend = function () {
                            error.body = this.result;
                            fail(error);
                        };
                        reader.onerror = function () {
                            fail(error);
                        };
                        reader.readAsText(error.body);
                    } else {
                        fail(error);
                    }
                }
            };

        if (!checkURL(source)) {
            onFail(new FileTransferError(FileTransferError.INVALID_URL_ERR, source, target));
        }

        xhr[id] = new XMLHttpRequest();

        function writeFile(entry) {
            entry.createWriter(function (writer) {
                fileWriter = writer;
                fileWriter.onwriteend = function (evt) {
                    if (!evt.target.error) {
                        entry.filesystemName = entry.filesystem.name;
                        delete xhr[id];
                        onSuccess(entry);
                    } else {
                        onFail(evt.target.error);
                    }
                };
                fileWriter.onerror = function (evt) {
                    onFail(evt.target.error);
                };
                fileWriter.write(new Blob([xhr[id].response]));
            }, function (error) {
                onFail(error);
            });
        }

        xhr[id].onerror = function (e) {
            onFail(new FileTransferError(FileTransferError.CONNECTION_ERR, source, target, xhr[id].status, xhr[id].response));
        };

        xhr[id].onabort = function (e) {
            onFail(new FileTransferError(FileTransferError.ABORT_ERR, source, target, xhr[id].status, xhr[id].response));
        };

        xhr[id].onload = function () {
            if (xhr[id].readyState === xhr[id].DONE) {
                if (xhr[id].status === 200 && xhr[id].response) {
                    resolveLocalFileSystemURI(getParentPath(target), function (dir) {
                        dir.getFile(getFileName(target), {create: true}, writeFile, function (error) {
                            onFail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR, source, target, xhr[id].status, xhr[id].response));
                        });
                    }, function (error) {
                        onFail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR, source, target, xhr[id].status, xhr[id].response));
                    });
                } else if (xhr[id].status === 404) {
                    onFail(new FileTransferError(FileTransferError.INVALID_URL_ERR, source, target, xhr[id].status, xhr[id].response));
                } else {
                    onFail(new FileTransferError(FileTransferError.CONNECTION_ERR, source, target, xhr[id].status, xhr[id].response));
                }
            }
        };
        xhr[id].onprogress = function (evt) {
            onSuccess(evt);
        };
        xhr[id].open("GET", source, true);
        for (var header in headers) {
            if (headers.hasOwnProperty(header)) {
                xhr[id].setRequestHeader(header, headers[header]);
            }
        }
        xhr[id].responseType = "blob";
        requestAnimationFrame(function () {
            if (xhr[id]) {
                xhr[id].send();
            }
        });
    }
};
