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

var FileTransferError = require('./FileTransferError'),
    xhr = {};

function getParentPath(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(0, pos + 1);
}

function getFileName(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(pos + 1);
}

module.exports = {
    abort: function (successCallback, errorCallback, args) {
        var id = args[0];
        if (xhr[id]) {
            xhr[id].abort();
            if (typeof(successCallback) === 'function') {
                successCallback();
            }
        } else if (typeof(errorCallback) === 'function') {
            errorCallback();
        }
    },

    upload: function(successCallback, errorCallback, args) {
        var filePath = args[0],
            server = args[1],
            fileKey = args[2],
            fileName = args[3],
            mimeType = args[4],
            params = args[5],
            /*trustAllHosts = args[6],*/
            /*chunkedMode = args[7],*/
            headers = args[8];

        xhr[fileKey] = new XMLHttpRequest({mozSystem: true});
        xhr[fileKey].onabort = function() {
            onFail(new FileTransferError(FileTransferError.ABORT_ERR, server, filePath, this.status, xhr[fileKey].response));
        };

        window.resolveLocalFileSystemURL(filePath, function(entry) {
            entry.file(function(file) {
                var reader = new FileReader();

                reader.onloadend = function() {
                    var blob = new Blob([this.result], {type: mimeType});
                    var fd = new FormData();

                    fd.append(fileKey, blob, fileName);

                    for (var prop in params) {
                        if (params.hasOwnProperty(prop)) {
                            fd.append(prop, params[prop]);
                        }
                    }

                    xhr[fileKey].open("POST", server);

                    xhr[fileKey].onload = function(evt) {
                        if (xhr[fileKey].status === 200) {
                            var result = new FileUploadResult();
                            result.bytesSent = blob.size;
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

                    xhr[fileKey].ontimeout = function() {
                        onFail(new FileTransferError(FileTransferError.CONNECTION_ERR, server, filePath, xhr[fileKey].status, xhr[fileKey].response));
                    };

                    xhr[fileKey].onerror = function() {
                        onFail(new FileTransferError(FileTransferError.CONNECTION_ERR, server, filePath, this.status, xhr[fileKey].response));
                    };

                    for (var header in headers) {
                        if (headers.hasOwnProperty(header)) {
                            xhr[fileKey].setRequestHeader(header, headers[header]);
                        }
                    }

                    xhr[fileKey].send(fd);
                };

                reader.readAsArrayBuffer(file);

            }, function() {
                onFail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR, server, filePath));
            });
        }, function() {
            onFail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR, server, filePath));
        });

        function onSuccess(data) {
            if (typeof(successCallback) === 'function') {
                successCallback(data);
            }
        }

        function onFail(code) {
            delete xhr[fileKey];
            if (typeof(errorCallback) === 'function') {
                errorCallback(code);
            }
        }
    },

    download: function (successCallback, errorCallback, args) {
        var source = args[0],
            target = args[1],
            id = args[3],
            headers = args[4];

        xhr[id] = new XMLHttpRequest({mozSystem: true});

        xhr[id].onload = function () {
            if (xhr[id].readyState === xhr[id].DONE) {
                if (xhr[id].status === 200 && xhr[id].response) {
                    window.resolveLocalFileSystemURL(getParentPath(target), function (dir) {
                        dir.getFile(getFileName(target), {create: true}, writeFile, function (error) {
                            onFail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR, source, target, xhr[id].status, xhr[id].response));
                        });
                    }, function () {
                        onFail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR, source, target, xhr[id].status, xhr[id].response));
                    });
                } else if (xhr[id].status === 404) {
                    onFail(new FileTransferError(FileTransferError.INVALID_URL_ERR, source, target, xhr[id].status, xhr[id].response));
                } else {
                    onFail(new FileTransferError(FileTransferError.CONNECTION_ERR, source, target, xhr[id].status, xhr[id].response));
                }
            }
        };

        function writeFile(entry) {
            entry.createWriter(function (fileWriter) {
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

        xhr[id].open("GET", source, true);

        for (var header in headers) {
            if (headers.hasOwnProperty(header)) {
                xhr[id].setRequestHeader(header, headers[header]);
            }
        }

        xhr[id].responseType = "blob";

        setTimeout(function () {
            if (xhr[id]) {
                xhr[id].send();
            }
        }, 0);

        function onSuccess(entry) {
            if (typeof(successCallback) === 'function') {
                successCallback(entry);
            }
        }

        function onFail(error) {
            delete xhr[id];
            if (typeof(errorCallback) === 'function') {
                errorCallback(error);
            }
        }
    }
};

require('cordova/exec/proxy').add('FileTransfer', module.exports);
