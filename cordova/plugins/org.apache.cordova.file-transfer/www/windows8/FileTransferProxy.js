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
    FileUploadResult = require('org.apache.cordova.file.FileUploadResult'),
    FileEntry = require('org.apache.cordova.file.FileEntry');

module.exports = {

/*
exec(win, fail, 'FileTransfer', 'upload', 
[filePath, server, fileKey, fileName, mimeType, params, trustAllHosts, chunkedMode, headers, this._id, httpMethod]);
*/
    upload:function(successCallback, error, options) {
        var filePath = options[0];
        var server = options[1];
        var fileKey = options[2] || 'source';
        var fileName = options[3];
        var mimeType = options[4];
        var params = options[5];
        var trustAllHosts = options[6]; // todo
        var chunkedMode = options[7]; // todo 
        var headers = options[8] || {};

        if (filePath === null || typeof filePath === 'undefined') {
            error && error(FileTransferError.FILE_NOT_FOUND_ERR);
            return;
        }

        if (String(filePath).substr(0, 8) == "file:///") {
            filePath = Windows.Storage.ApplicationData.current.localFolder.path + String(filePath).substr(8).split("/").join("\\");
        }

        Windows.Storage.StorageFile.getFileFromPathAsync(filePath).then(function (storageFile) {

            if(!fileName) {
                fileName = storageFile.name;
            }
            if(!mimeType) {
                // use the actual content type of the file, probably this should be the default way.
                // other platforms probably can't look this up.
                mimeType = storageFile.contentType;
            }

            storageFile.openAsync(Windows.Storage.FileAccessMode.read).then(function (stream) {


                var blob = MSApp.createBlobFromRandomAccessStream(mimeType, stream);

                var formData = new FormData();
                formData.append(fileKey, blob, fileName);
                // add params
                for(var key in params) {
                    formData.append(key,params[key]);
                }

                WinJS.xhr({ type: "POST", url: server, data: formData, headers: headers }).then(function (response) {
                    storageFile.getBasicPropertiesAsync().done(function (basicProperties) {

                        Windows.Storage.FileIO.readBufferAsync(storageFile).done(function (buffer) {
                            var dataReader = Windows.Storage.Streams.DataReader.fromBuffer(buffer);
                            var fileContent = dataReader.readString(buffer.length);
                            dataReader.close();
                            var ftResult = new FileUploadResult();
                            ftResult.bytesSent = basicProperties.size;
                            ftResult.responseCode = response.status;
                            ftResult.response = fileContent;
                            successCallback && successCallback(ftResult);
                        });

                    });
                }, function () {
                    error && error(FileTransferError.INVALID_URL_ERR);
                });
            });

        },function() {
            error && error(FileTransferError.FILE_NOT_FOUND_ERR);
        });
    },

    download:function(successCallback, error, options) {
        var source = options[0];
        var target = options[1];
        var headers = options[4] || {};


        if (target === null || typeof target === undefined) {
            error && error(FileTransferError.FILE_NOT_FOUND_ERR);
            return;
        }
        if (String(target).substr(0, 8) == "file:///") {
            target = Windows.Storage.ApplicationData.current.localFolder.path + String(target).substr(8).split("/").join("\\");
        }
        var path = target.substr(0, String(target).lastIndexOf("\\"));
        var fileName = target.substr(String(target).lastIndexOf("\\") + 1);
        if (path === null || fileName === null) {
            error && error(FileTransferError.FILE_NOT_FOUND_ERR);
            return;
        }

        var download = null;


        Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(function (storageFolder) {
            storageFolder.createFileAsync(fileName, Windows.Storage.CreationCollisionOption.generateUniqueName).then(function (storageFile) {
                var uri = Windows.Foundation.Uri(source);
                var downloader = new Windows.Networking.BackgroundTransfer.BackgroundDownloader();

                for (var header in headers) {
                    downloader.setRequestHeader(header, headers[header]);
                }
                download = downloader.createDownload(uri, storageFile);
                download.startAsync().then(function () {
                    successCallback && successCallback(new FileEntry(storageFile.name, storageFile.path));
                }, function () {
                    error && error(FileTransferError.INVALID_URL_ERR);
                });
            });
        });
    }
};

require("cordova/exec/proxy").add("FileTransfer",module.exports);
