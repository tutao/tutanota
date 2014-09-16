"use strict";

tutao.provide('tutao.native.FileTransferApp');

/**
 * @constructor
 * @implements {tutao.native.FileTransferInterface}
 */
tutao.native.FileTransferApp = function() {
    this.fileUtil = new tutao.native.device.FileUtil();
};

tutao.native.FileTransferApp.prototype.downloadAndOpen = function(file) {
    if (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID) {
        var self = this;
        var filename = url.split('/')[url.split('/').length - 1];
        return new Promise(function (resolve, reject) {
                           
                           
                           var fileTransfer = new FileTransfer();
                           var uri = encodeURI(url);
                           var fileURL = cordova.file.dataDirectory + "temp/" + filename;
                           
                           fileTransfer.download(
                                                 uri,
                                                 fileURL,
                                                 function(entry) {
                                                 cordova.plugins.bridge.open(fileURL, function success() {
                                                                             console.log('Success');
                                                                             }, function error(code) {
                                                                             if (code === 1) {
                                                                             console.log('No file handler found');
                                                                             } else {
                                                                             console.log('Undefined error');
                                                                             }
                                                                             });
                                                 //                self.fileUtil.open(entry.toURL()).then(function() {
                                                 //                    resolve();
                                                 //                });
                                                 },
                                                 function(error) {
                                                 console.log("download error source " + error.source);
                                                 console.log("download error target " + error.target);
                                                 console.log("upload error code" + error.code);
                                                 reject(new Error("Source: " + error.source + "\n " + "Target: " + error.target + "\n " + "Code: " + error.code));
                                                 },
                                                 false,
                                                 {
                                                 headers: {
                                                 "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
                                                 }
                                                 }
                                                 );
                           });

    } else {
        // download and decrypt file
        var self = this;
        return tutao.tutanota.ctrl.FileFacade.readFileData(file).then(function (dataFile) {
            return self.open(dataFile);
        });
	}
};

tutao.native.FileTransferApp.prototype.open = function(dataFile) {
    return new Promise(function(resolve, reject) {
        window.requestFileSystem(LocalFileSystem.TEMPORARY, dataFile.getSize(), function(fs) {
            var fileName = dataFile.getName().replace(/[ :\	\\/§$%&\*\=\?#°\^\|<>]/g, "_");
            fs.root.getFile(fileName, {create: true}, function(fileEntry) {
                // Create a FileWriter object for our FileEntry (log.txt).
                fileEntry.createWriter(function(fileWriter) {
                    fileWriter.onwriteend = function(e) {
                        resolve(fileEntry);
                    };

                    fileWriter.onerror = function(e) {
                        reject(e);
                    };

                    // Create a new Blob and write it to log.txt.
                    var blob = new Blob([new DataView(dataFile.getData())], {type: dataFile.getMimeType()});
                    fileWriter.write(blob);
                }, function(e) {
                    reject(e);
                });
            }, function(e) {
                reject(e);
            });
        });
    }).then(function(fileEntry) {
        cordova.plugins.bridge.open(fileEntry.toURL(), Promise.resolve, Promise.reject);
        // deleting the temp file would be nice here, but does not work currently because the success callback comes too early
    });
};