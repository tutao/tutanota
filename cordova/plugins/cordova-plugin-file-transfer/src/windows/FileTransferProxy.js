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

/*jshint -W030 */
/*global Windows, WinJS*/
/*global module, require*/

var FTErr = require('./FileTransferError'),
    ProgressEvent = require('cordova-plugin-file.ProgressEvent'),
    FileUploadResult = require('cordova-plugin-file.FileUploadResult'),
    FileProxy = require('cordova-plugin-file.FileProxy'),
    FileEntry = require('cordova-plugin-file.FileEntry');

var appData = Windows.Storage.ApplicationData.current;

var LINE_START = "--";
var LINE_END = "\r\n";
var BOUNDARY = '+++++';

// Some private helper functions, hidden by the module
function cordovaPathToNative(path) {

    var cleanPath = String(path);
    // turn / into \\
    cleanPath = cleanPath.replace(/\//g, '\\');
    // turn  \\ into \
    cleanPath = cleanPath.replace(/\\\\/g, '\\');
    // strip end \\ characters
    cleanPath = cleanPath.replace(/\\+$/g, '');
    return cleanPath;
}

function nativePathToCordova(path) {
    return String(path).replace(/\\/g, '/');
}

function alreadyCancelled(opId) {
    var op = fileTransferOps[opId];
    return op && op.state === FileTransferOperation.CANCELLED;
}

function doUpload (upload, uploadId, filePath, server, successCallback, errorCallback) {
    if (alreadyCancelled(uploadId)) {
        errorCallback(new FTErr(FTErr.ABORT_ERR, nativePathToCordova(filePath), server));
        return;
    }

    // update internal TransferOperation object with newly created promise
    var uploadOperation = upload.startAsync();
    fileTransferOps[uploadId].promise = uploadOperation;

    uploadOperation.then(
        function (result) {
            // Update TransferOperation object with new state, delete promise property
            // since it is not actual anymore
            var currentUploadOp = fileTransferOps[uploadId];
            if (currentUploadOp) {
                currentUploadOp.state = FileTransferOperation.DONE;
                currentUploadOp.promise = null;
            }

            var response = result.getResponseInformation();
            var ftResult = new FileUploadResult(result.progress.bytesSent, response.statusCode, '');

            // if server's response doesn't contain any data, then resolve operation now
            if (result.progress.bytesReceived === 0) {
                successCallback(ftResult);
                return;
            }

            // otherwise create a data reader, attached to response stream to get server's response
            var reader = new Windows.Storage.Streams.DataReader(result.getResultStreamAt(0));
            reader.loadAsync(result.progress.bytesReceived).then(function (size) {
                ftResult.response = reader.readString(size);
                successCallback(ftResult);
                reader.close();
            });
        },
        function (error) {
            var source = nativePathToCordova(filePath);

            // Handle download error here.
            // Wrap this routines into promise due to some async methods
            var getTransferError = new WinJS.Promise(function (resolve) {
                if (error.message === 'Canceled') {
                    // If download was cancelled, message property will be specified
                    resolve(new FTErr(FTErr.ABORT_ERR, source, server, null, null, error));
                } else {
                    // in the other way, try to get response property
                    var response = upload.getResponseInformation();
                    if (!response) {
                        resolve(new FTErr(FTErr.CONNECTION_ERR, source, server));
                    } else {
                        var reader = new Windows.Storage.Streams.DataReader(upload.getResultStreamAt(0));
                        reader.loadAsync(upload.progress.bytesReceived).then(function (size) {
                            var responseText = reader.readString(size);
                            resolve(new FTErr(FTErr.FILE_NOT_FOUND_ERR, source, server, response.statusCode, responseText, error));
                            reader.close();
                        });
                    }
                }
            });

            // Update TransferOperation object with new state, delete promise property
            // since it is not actual anymore
            var currentUploadOp = fileTransferOps[uploadId];
            if (currentUploadOp) {
                currentUploadOp.state = FileTransferOperation.CANCELLED;
                currentUploadOp.promise = null;
            }

            // Report the upload error back
            getTransferError.then(function (transferError) {
                errorCallback(transferError);
            });
        },
        function (evt) {
            var progressEvent = new ProgressEvent('progress', {
                loaded: evt.progress.bytesSent,
                total: evt.progress.totalBytesToSend,
                target: evt.resultFile
            });
            progressEvent.lengthComputable = true;
            successCallback(progressEvent, { keepCallback: true });
        }
    );
}

var fileTransferOps = [];

function FileTransferOperation(state, promise) {
    this.state = state;
    this.promise = promise;
}

FileTransferOperation.PENDING = 0;
FileTransferOperation.DONE = 1;
FileTransferOperation.CANCELLED = 2;

var HTTP_E_STATUS_NOT_MODIFIED = -2145844944;

module.exports = {

/*
exec(win, fail, 'FileTransfer', 'upload', 
[filePath, server, fileKey, fileName, mimeType, params, trustAllHosts, chunkedMode, headers, this._id, httpMethod]);
*/
    upload: function (successCallback, errorCallback, options) {
        var filePath = options[0];
        var server = options[1];
        var fileKey = options[2] || 'source';
        var fileName = options[3];
        var mimeType = options[4];
        var params = options[5];
        // var trustAllHosts = options[6]; // todo
        // var chunkedMode = options[7]; // todo 
        var headers = options[8] || {};
        var uploadId = options[9];
        var httpMethod = options[10];

        var isMultipart = typeof headers["Content-Type"] === 'undefined';

        if (!filePath || (typeof filePath !== 'string')) {
            errorCallback(new FTErr(FTErr.FILE_NOT_FOUND_ERR, null, server));
            return;
        }

        if (filePath.indexOf("data:") === 0 && filePath.indexOf("base64") !== -1) {
            // First a DataWriter object is created, backed by an in-memory stream where 
            // the data will be stored.
            var writer = Windows.Storage.Streams.DataWriter(new Windows.Storage.Streams.InMemoryRandomAccessStream());
            writer.unicodeEncoding = Windows.Storage.Streams.UnicodeEncoding.utf8;
            writer.byteOrder = Windows.Storage.Streams.ByteOrder.littleEndian;

            var commaIndex = filePath.indexOf(",");
            if (commaIndex === -1) {
                errorCallback(new FTErr(FTErr.INVALID_URL_ERR, fileName, server, null, null, "No comma in data: URI"));
                return;
            }

            // Create internal download operation object
            fileTransferOps[uploadId] = new FileTransferOperation(FileTransferOperation.PENDING, null);

            var fileDataString = filePath.substr(commaIndex + 1);

            function stringToByteArray(str) {
                var byteCharacters = atob(str);
                var byteNumbers = new Array(byteCharacters.length);
                for (var i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                return new Uint8Array(byteNumbers);
            };

            // setting request headers for uploader
            var uploader = new Windows.Networking.BackgroundTransfer.BackgroundUploader();
            uploader.method = httpMethod;
            for (var header in headers) {
                if (headers.hasOwnProperty(header)) {
                    uploader.setRequestHeader(header, headers[header]);
                }
            }

            if (isMultipart) {
                // adding params supplied to request payload
                var multipartParams = '';
                for (var key in params) {
                    if (params.hasOwnProperty(key)) {
                        multipartParams += LINE_START + BOUNDARY + LINE_END;
                        multipartParams += "Content-Disposition: form-data; name=\"" + key + "\"";
                        multipartParams += LINE_END + LINE_END;
                        multipartParams += params[key];
                        multipartParams += LINE_END;
                    }
                }

                var multipartFile = LINE_START + BOUNDARY + LINE_END;
                multipartFile += "Content-Disposition: form-data; name=\"file\";";
                multipartFile += " filename=\"" + fileName + "\"" + LINE_END;
                multipartFile += "Content-Type: " + mimeType + LINE_END + LINE_END;

                var bound = LINE_END + LINE_START + BOUNDARY + LINE_START + LINE_END;

                uploader.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + BOUNDARY);
                writer.writeString(multipartParams);
                writer.writeString(multipartFile);
                writer.writeBytes(stringToByteArray(fileDataString));
                writer.writeString(bound);
            } else {
                writer.writeBytes(stringToByteArray(fileDataString));
            }

            var stream;

            // The call to store async sends the actual contents of the writer 
            // to the backing stream.
            writer.storeAsync().then(function () {
                // For the in-memory stream implementation we are using, the flushAsync call 
                // is superfluous, but other types of streams may require it.
                return writer.flushAsync();
            }).then(function () {
                // We detach the stream to prolong its useful lifetime. Were we to fail 
                // to detach the stream, the call to writer.close() would close the underlying 
                // stream, preventing its subsequent use by the DataReader below. Most clients 
                // of DataWriter will have no reason to use the underlying stream after 
                // writer.close() is called, and will therefore have no reason to call
                // writer.detachStream(). Note that once we detach the stream, we assume 
                // responsibility for closing the stream subsequently; after the stream 
                // has been detached, a call to writer.close() will have no effect on the stream.
                stream = writer.detachStream();
                // Make sure the stream is read from the beginning in the reader 
                // we are creating below.
                stream.seek(0);
                // Most DataWriter clients will not call writer.detachStream(), 
                // and furthermore will be working with a file-backed or network-backed stream, 
                // rather than an in-memory-stream. In such cases, it would be particularly 
                // important to call writer.close(). Doing so is always a best practice.
                writer.close();

                if (alreadyCancelled(uploadId)) {
                    errorCallback(new FTErr(FTErr.ABORT_ERR, nativePathToCordova(filePath), server));
                    return;
                }

                // create download object. This will throw an exception if URL is malformed
                var uri = new Windows.Foundation.Uri(server);

                var createUploadOperation;
                try {
                    createUploadOperation = uploader.createUploadFromStreamAsync(uri, stream);
                } catch (e) {
                    errorCallback(new FTErr(FTErr.INVALID_URL_ERR));
                    return;
                }

                createUploadOperation.then(
                    function (upload) {
                        doUpload(upload, uploadId, filePath, server, successCallback, errorCallback);
                    },
                    function (err) {
                        var errorObj = new FTErr(FTErr.INVALID_URL_ERR);
                        errorObj.exception = err;
                        errorCallback(errorObj);
                    });
            });

            return;
        }

        if (filePath.substr(0, 8) === "file:///") {
            filePath = appData.localFolder.path + filePath.substr(8).split("/").join("\\");
        } else if (filePath.indexOf('ms-appdata:///') === 0) {
            // Handle 'ms-appdata' scheme
            filePath = filePath.replace('ms-appdata:///local', appData.localFolder.path)
                               .replace('ms-appdata:///temp', appData.temporaryFolder.path);
        } else if (filePath.indexOf('cdvfile://') === 0) {
            filePath = filePath.replace('cdvfile://localhost/persistent', appData.localFolder.path)
                               .replace('cdvfile://localhost/temporary', appData.temporaryFolder.path);
        }

        // normalize path separators
        filePath = cordovaPathToNative(filePath);

        // Create internal download operation object
        fileTransferOps[uploadId] = new FileTransferOperation(FileTransferOperation.PENDING, null);

        Windows.Storage.StorageFile.getFileFromPathAsync(filePath)
        .then(function (storageFile) {

            if (!fileName) {
                fileName = storageFile.name;
            }
            if (!mimeType) {
                // use the actual content type of the file, probably this should be the default way.
                // other platforms probably can't look this up.
                mimeType = storageFile.contentType;
            }

            if (alreadyCancelled(uploadId)) {
                errorCallback(new FTErr(FTErr.ABORT_ERR, nativePathToCordova(filePath), server));
                return;
            }

            // setting request headers for uploader
            var uploader = new Windows.Networking.BackgroundTransfer.BackgroundUploader();
            uploader.method = httpMethod;
            for (var header in headers) {
                if (headers.hasOwnProperty(header)) {
                    uploader.setRequestHeader(header, headers[header]);
                }
            }

            // create download object. This will throw an exception if URL is malformed
            var uri = new Windows.Foundation.Uri(server);

            var createUploadOperation;
            try {
                if (isMultipart) {
                    // adding params supplied to request payload
                    var transferParts = [];
                    for (var key in params) {
                        if (params.hasOwnProperty(key)) {
                            var contentPart = new Windows.Networking.BackgroundTransfer.BackgroundTransferContentPart();
                            contentPart.setHeader("Content-Disposition", "form-data; name=\"" + key + "\"");
                            contentPart.setText(params[key]);
                            transferParts.push(contentPart);
                        }
                    }

                    // Adding file to upload to request payload
                    var fileToUploadPart = new Windows.Networking.BackgroundTransfer.BackgroundTransferContentPart(fileKey, fileName);
                    fileToUploadPart.setFile(storageFile);
                    transferParts.push(fileToUploadPart);

                    createUploadOperation = uploader.createUploadAsync(uri, transferParts);
                } else {
                    createUploadOperation = WinJS.Promise.wrap(uploader.createUpload(uri, storageFile));
                }
            } catch (e) {
                errorCallback(new FTErr(FTErr.INVALID_URL_ERR));
                return;
            }

            createUploadOperation.then(
                function (upload) {
                    doUpload(upload, uploadId, filePath, server, successCallback, errorCallback);
                },
                function (err) {
                    var errorObj = new FTErr(FTErr.INVALID_URL_ERR);
                    errorObj.exception = err;
                    errorCallback(errorObj);
                }
            );
        }, function (err) {
            errorCallback(new FTErr(FTErr.FILE_NOT_FOUND_ERR, fileName, server, null, null, err));
        });
    },

    // [source, target, trustAllHosts, id, headers]
    download:function(successCallback, errorCallback, options) {
        var source = options[0];
        var target = options[1];
        var downloadId = options[3];
        var headers = options[4] || {};

        if (!target) {
            errorCallback(new FTErr(FTErr.FILE_NOT_FOUND_ERR));
            return;
        }
        if (target.substr(0, 8) === "file:///") {
            target = appData.localFolder.path + target.substr(8).split("/").join("\\");
        } else if (target.indexOf('ms-appdata:///') === 0) {
            // Handle 'ms-appdata' scheme
            target = target.replace('ms-appdata:///local', appData.localFolder.path)
                           .replace('ms-appdata:///temp', appData.temporaryFolder.path);
        } else if (target.indexOf('cdvfile://') === 0) {
            target = target.replace('cdvfile://localhost/persistent', appData.localFolder.path)
                           .replace('cdvfile://localhost/temporary', appData.temporaryFolder.path);
        }
        target = cordovaPathToNative(target);

        var path = target.substr(0, target.lastIndexOf("\\"));
        var fileName = target.substr(target.lastIndexOf("\\") + 1);
        if (path === null || fileName === null) {
            errorCallback(new FTErr(FTErr.FILE_NOT_FOUND_ERR));
            return;
        }
        // Download to a temp file to avoid the file deletion on 304 
        // CB-7006 Empty file is created on file transfer if server response is 304
        var tempFileName = '~' + fileName;

        var download = null;

        // Create internal download operation object
        fileTransferOps[downloadId] = new FileTransferOperation(FileTransferOperation.PENDING, null);

        var downloadCallback = function(storageFolder) {
            storageFolder.createFileAsync(tempFileName, Windows.Storage.CreationCollisionOption.replaceExisting).then(function (storageFile) {

                if (alreadyCancelled(downloadId)) {
                    errorCallback(new FTErr(FTErr.ABORT_ERR, source, target));
                    return;
                }

                // if download isn't cancelled, contunue with creating and preparing download operation
                var downloader = new Windows.Networking.BackgroundTransfer.BackgroundDownloader();
                for (var header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        downloader.setRequestHeader(header, headers[header]);
                    }
                }

                // create download object. This will throw an exception if URL is malformed
                try {
                    var uri = Windows.Foundation.Uri(source);
                    download = downloader.createDownload(uri, storageFile);
                } catch (e) {
                    // so we handle this and call errorCallback
                    errorCallback(new FTErr(FTErr.INVALID_URL_ERR));
                    return;
                }

                var downloadOperation = download.startAsync();
                // update internal TransferOperation object with newly created promise
                fileTransferOps[downloadId].promise = downloadOperation;

                downloadOperation.then(function () {

                    // Update TransferOperation object with new state, delete promise property
                    // since it is not actual anymore
                    var currentDownloadOp = fileTransferOps[downloadId];
                    if (currentDownloadOp) {
                        currentDownloadOp.state = FileTransferOperation.DONE;
                        currentDownloadOp.promise = null;
                    }

                    storageFile.renameAsync(fileName, Windows.Storage.CreationCollisionOption.replaceExisting).done(function () {
                        var nativeURI = storageFile.path.replace(appData.localFolder.path, 'ms-appdata:///local')
                        .replace(appData.temporaryFolder.path, 'ms-appdata:///temp')
                        .replace(/\\/g, '/');

                        // Passing null as error callback here because downloaded file should exist in any case
                        // otherwise the error callback will be hit during file creation in another place
                        FileProxy.resolveLocalFileSystemURI(successCallback, null, [nativeURI]);
                    }, function(error) {
                        errorCallback(new FTErr(FTErr.FILE_NOT_FOUND_ERR, source, target, null, null, error));
                    });
                }, function(error) {

                    var getTransferError = new WinJS.Promise(function (resolve) {
                        // Handle download error here. If download was cancelled,
                        // message property will be specified
                        if (error.message === 'Canceled') {
                            resolve(new FTErr(FTErr.ABORT_ERR, source, target, null, null, error));
                        } else if (error && error.number === HTTP_E_STATUS_NOT_MODIFIED) {
                            resolve(new FTErr(FTErr.NOT_MODIFIED_ERR, source, target, 304, null, error));
                        } else {
                            // in the other way, try to get response property
                            var response = download.getResponseInformation();
                            if (!response) {
                                resolve(new FTErr(FTErr.CONNECTION_ERR, source, target));
                            } else {
                                var reader = new Windows.Storage.Streams.DataReader(download.getResultStreamAt(0));
                                reader.loadAsync(download.progress.bytesReceived).then(function (bytesLoaded) {
                                    var payload = reader.readString(bytesLoaded);
                                    resolve(new FTErr(FTErr.FILE_NOT_FOUND_ERR, source, target, response.statusCode, payload, error));
                                });
                            }
                        }
                    });
                    getTransferError.then(function (fileTransferError) {

                        // Update TransferOperation object with new state, delete promise property
                        // since it is not actual anymore
                        var currentDownloadOp = fileTransferOps[downloadId];
                        if (currentDownloadOp) {
                            currentDownloadOp.state = FileTransferOperation.CANCELLED;
                            currentDownloadOp.promise = null;
                        }

                        // Cleanup, remove incompleted file
                        storageFile.deleteAsync().then(function() {
                            errorCallback(fileTransferError);
                        });
                    });

                }, function(evt) {

                    var progressEvent = new ProgressEvent('progress', {
                        loaded: evt.progress.bytesReceived,
                        total: evt.progress.totalBytesToReceive,
                        target: evt.resultFile
                    });
                    // when bytesReceived == 0, BackgroundDownloader has not yet differentiated whether it could get file length or not,
                    // when totalBytesToReceive == 0, BackgroundDownloader is unable to get file length
                    progressEvent.lengthComputable = (evt.progress.bytesReceived > 0) && (evt.progress.totalBytesToReceive > 0);

                    successCallback(progressEvent, { keepCallback: true });
                });
            }, function(error) {
                errorCallback(new FTErr(FTErr.FILE_NOT_FOUND_ERR, source, target, null, null, error));
            });
        };

        var fileNotFoundErrorCallback = function(error) {
            errorCallback(new FTErr(FTErr.FILE_NOT_FOUND_ERR, source, target, null, null, error));
        };

        Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(downloadCallback, function (error) {
            // Handle non-existent directory
            if (error.number === -2147024894) {
                var parent = path.substr(0, path.lastIndexOf('\\')),
                    folderNameToCreate = path.substr(path.lastIndexOf('\\') + 1);

                Windows.Storage.StorageFolder.getFolderFromPathAsync(parent).then(function(parentFolder) {
                    parentFolder.createFolderAsync(folderNameToCreate).then(downloadCallback, fileNotFoundErrorCallback);
                }, fileNotFoundErrorCallback);
            } else {
                fileNotFoundErrorCallback();
            }
        });
    },

    abort: function (successCallback, error, options) {
        var fileTransferOpId = options[0];

        // Try to find transferOperation with id specified, and cancel its' promise
        var currentOp = fileTransferOps[fileTransferOpId];
        if (currentOp) {
            currentOp.state = FileTransferOperation.CANCELLED;
            currentOp.promise && currentOp.promise.cancel();
        } else if (typeof fileTransferOpId !== 'undefined') {
            // Create the operation in cancelled state to be aborted right away
            fileTransferOps[fileTransferOpId] = new FileTransferOperation(FileTransferOperation.CANCELLED, null);
        }
    }

};

require("cordova/exec/proxy").add("FileTransfer",module.exports);
