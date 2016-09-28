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

/*global module, require*/

var argscheck = require('cordova/argscheck'),
    FileTransferError = require('./FileTransferError');

function getParentPath(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(0, pos + 1);
}

function getFileName(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(pos + 1);
}

function getUrlCredentials(urlString) {
    var credentialsPattern = /^https?\:\/\/(?:(?:(([^:@\/]*)(?::([^@\/]*))?)?@)?([^:\/?#]*)(?::(\d*))?).*$/,
        credentials = credentialsPattern.exec(urlString);

    return credentials && credentials[1];
}

function getBasicAuthHeader(urlString) {
    var header =  null;


    // This is changed due to MS Windows doesn't support credentials in http uris
    // so we detect them by regexp and strip off from result url
    // Proof: http://social.msdn.microsoft.com/Forums/windowsapps/en-US/a327cf3c-f033-4a54-8b7f-03c56ba3203f/windows-foundation-uri-security-problem

    if (window.btoa) {
        var credentials = getUrlCredentials(urlString);
        if (credentials) {
            var authHeader = "Authorization";
            var authHeaderValue = "Basic " + window.btoa(credentials);

            header = {
                name : authHeader,
                value : authHeaderValue
            };
        }
    }

    return header;
}

function checkURL(url) {
    return url.indexOf(' ') === -1 ?  true : false;
}

var idCounter = 0;

var transfers = {};

/**
 * FileTransfer uploads a file to a remote server.
 * @constructor
 */
var FileTransfer = function() {
    this._id = ++idCounter;
    this.onprogress = null; // optional callback
};

/**
 * Given an absolute file path, uploads a file on the device to a remote server
 * using a multipart HTTP request.
 * @param filePath {String}           Full path of the file on the device
 * @param server {String}             URL of the server to receive the file
 * @param successCallback (Function}  Callback to be invoked when upload has completed
 * @param errorCallback {Function}    Callback to be invoked upon error
 * @param options {FileUploadOptions} Optional parameters such as file name and mimetype
 * @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
 */
FileTransfer.prototype.upload = function(filePath, server, successCallback, errorCallback, options) {
    // check for arguments
    argscheck.checkArgs('ssFFO*', 'FileTransfer.upload', arguments);

    // Check if target URL doesn't contain spaces. If contains, it should be escaped first
    // (see https://github.com/apache/cordova-plugin-file-transfer/blob/master/doc/index.md#upload)
    if (!checkURL(server)) {
        if (errorCallback) {
            errorCallback(new FileTransferError(FileTransferError.INVALID_URL_ERR, filePath, server));
        }
        return;
    }

    options = options || {};

    var fileKey = options.fileKey || "file";
    var fileName = options.fileName || "image.jpg";
    var mimeType = options.mimeType || "image/jpeg";
    var params = options.params || {};
    var withCredentials = options.withCredentials || false;
    // var chunkedMode = !!options.chunkedMode; // Not supported
    var headers = options.headers || {};
    var httpMethod = options.httpMethod && options.httpMethod.toUpperCase() === "PUT" ? "PUT" : "POST";

    var basicAuthHeader = getBasicAuthHeader(server);
    if (basicAuthHeader) {
        server = server.replace(getUrlCredentials(server) + '@', '');
        headers[basicAuthHeader.name] = basicAuthHeader.value;
    }

    var that = this;
    var xhr = transfers[this._id] = new XMLHttpRequest();
    xhr.withCredentials = withCredentials;

    var fail = errorCallback && function(code, status, response) {
        if (transfers[this._id]) {
            delete transfers[this._id];
        }
        var error = new FileTransferError(code, filePath, server, status, response);
        if (errorCallback) {
            errorCallback(error);
        }
    };

    window.resolveLocalFileSystemURL(filePath, function(entry) {
        entry.file(function(file) {
            var reader = new FileReader();
            reader.onloadend = function() {
                var blob = new Blob([this.result], {type: mimeType});

                // Prepare form data to send to server
                var fd = new FormData();
                fd.append(fileKey, blob, fileName);
                for (var prop in params) {
                    if (params.hasOwnProperty(prop)) {
                        fd.append(prop, params[prop]);
                    }
                }

                xhr.open(httpMethod, server);

                // Fill XHR headers
                for (var header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header, headers[header]);
                    }
                }

                xhr.onload = function() {
                    if (this.status === 200) {
                        var result = new FileUploadResult(); // jshint ignore:line
                        result.bytesSent = blob.size;
                        result.responseCode = this.status;
                        result.response = this.response;
                        delete transfers[that._id];
                        successCallback(result);
                    } else if (this.status === 404) {
                        fail(FileTransferError.INVALID_URL_ERR, this.status, this.response);
                    } else {
                        fail(FileTransferError.CONNECTION_ERR, this.status, this.response);
                    }
                };

                xhr.ontimeout = function() {
                    fail(FileTransferError.CONNECTION_ERR, this.status, this.response);
                };

                xhr.onerror = function() {
                    fail(FileTransferError.CONNECTION_ERR, this.status, this.response);
                };

                xhr.onabort = function () {
                    fail(FileTransferError.ABORT_ERR, this.status, this.response);
                };

                xhr.upload.onprogress = function (e) {
                    if (that.onprogress) {
                        that.onprogress(e);
                    }
                };

                xhr.send(fd);
                // Special case when transfer already aborted, but XHR isn't sent.
                // In this case XHR won't fire an abort event, so we need to check if transfers record
                // isn't deleted by filetransfer.abort and if so, call XHR's abort method again
                if (!transfers[that._id]) {
                    xhr.abort();
                }
            };
            reader.readAsArrayBuffer(file);
        }, function() {
            fail(FileTransferError.FILE_NOT_FOUND_ERR);
        });
    }, function() {
        fail(FileTransferError.FILE_NOT_FOUND_ERR);
    });
};

/**
 * Downloads a file form a given URL and saves it to the specified directory.
 * @param source {String}          URL of the server to receive the file
 * @param target {String}         Full path of the file on the device
 * @param successCallback (Function}  Callback to be invoked when upload has completed
 * @param errorCallback {Function}    Callback to be invoked upon error
 * @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
 * @param options {FileDownloadOptions} Optional parameters such as headers
 */
FileTransfer.prototype.download = function(source, target, successCallback, errorCallback, trustAllHosts, options) {
    argscheck.checkArgs('ssFF*', 'FileTransfer.download', arguments);

    // Check if target URL doesn't contain spaces. If contains, it should be escaped first
    // (see https://github.com/apache/cordova-plugin-file-transfer/blob/master/doc/index.md#download)
    if (!checkURL(source)) {
        if (errorCallback) {
            errorCallback(new FileTransferError(FileTransferError.INVALID_URL_ERR, source, target));
        }
        return;
    }

    options = options || {};
    
    var headers = options.headers || {};
    var withCredentials = options.withCredentials || false;

    var basicAuthHeader = getBasicAuthHeader(source);
    if (basicAuthHeader) {
        source = source.replace(getUrlCredentials(source) + '@', '');
        headers[basicAuthHeader.name] = basicAuthHeader.value;
    }

    var that = this;
    var xhr = transfers[this._id] = new XMLHttpRequest();
    xhr.withCredentials = withCredentials;
    var fail = errorCallback && function(code, status, response) {
        if (transfers[that._id]) {
            delete transfers[that._id];
        }
        // In XHR GET reqests we're setting response type to Blob
        // but in case of error we need to raise event with plain text response
        if (response instanceof Blob) {
            var reader = new FileReader();
            reader.readAsText(response);
            reader.onloadend = function(e) {
                var error = new FileTransferError(code, source, target, status, e.target.result);
                errorCallback(error);
            };
        } else {
            var error = new FileTransferError(code, source, target, status, response);
            errorCallback(error);
        }
    };

    xhr.onload = function (e) {

        var fileNotFound = function () {
            fail(FileTransferError.FILE_NOT_FOUND_ERR);
        };

        var req = e.target;
        // req.status === 0 is special case for local files with file:// URI scheme
        if ((req.status === 200 || req.status === 0) && req.response) {
            window.resolveLocalFileSystemURL(getParentPath(target), function (dir) {
                dir.getFile(getFileName(target), {create: true}, function writeFile(entry) {
                    entry.createWriter(function (fileWriter) {
                        fileWriter.onwriteend = function (evt) {
                            if (!evt.target.error) {
                                entry.filesystemName = entry.filesystem.name;
                                delete transfers[that._id];
                                if (successCallback) {
                                    successCallback(entry);
                                }
                            } else {
                                fail(FileTransferError.FILE_NOT_FOUND_ERR);
                            }
                        };
                        fileWriter.onerror = function () {
                            fail(FileTransferError.FILE_NOT_FOUND_ERR);
                        };
                        fileWriter.write(req.response);
                    }, fileNotFound);
                }, fileNotFound);
            }, fileNotFound);
        } else if (req.status === 404) {
            fail(FileTransferError.INVALID_URL_ERR, req.status, req.response);
        } else {
            fail(FileTransferError.CONNECTION_ERR, req.status, req.response);
        }
    };

    xhr.onprogress = function (e) {
        if (that.onprogress) {
            that.onprogress(e);
        }
    };

    xhr.onerror = function () {
        fail(FileTransferError.CONNECTION_ERR, this.status, this.response);
    };

    xhr.onabort = function () {
        fail(FileTransferError.ABORT_ERR, this.status, this.response);
    };

    xhr.open("GET", source, true);

    for (var header in headers) {
        if (headers.hasOwnProperty(header)) {
            xhr.setRequestHeader(header, headers[header]);
        }
    }

    xhr.responseType = "blob";

    xhr.send();
};

/**
 * Aborts the ongoing file transfer on this object. The original error
 * callback for the file transfer will be called if necessary.
 */
FileTransfer.prototype.abort = function() {
    if (this instanceof FileTransfer) {
        if (transfers[this._id]) {
            transfers[this._id].abort();
            delete transfers[this._id];
        }
    }
};

module.exports = FileTransfer;
