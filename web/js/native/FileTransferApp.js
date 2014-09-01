"use strict";

tutao.provide('tutao.native.FileTransferApp');

/**
 * @constructor
 * @implements {tutao.native.FileTransferInterface}
 */
tutao.native.FileTransferApp = function(){
    this.fileUtil = new tutao.native.device.FileUtil();
};

tutao.native.FileTransferApp.prototype.downloadAndOpen = function(url) {
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
                self.fileUtil.open(entry.toURL()).then(function() {
                    resolve();
                });
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
};