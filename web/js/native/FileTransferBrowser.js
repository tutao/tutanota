"use strict";

tutao.provide('tutao.native.FileTransferBrowser');

/**
 * @constructor
 * @implements {tutao.native.FileTransferInterface}
 */
tutao.native.FileTransferBrowser = function(){};

tutao.native.FileTransferBrowser.prototype.downloadAndOpen = function(url) {
    return new Promise(function (resolve, reject) {
        var filename = url.split('/')[url.split('/').length - 1];
        var xhr = new XMLHttpRequest();
        // use the same trick to avoid caching (actually only needed for IE) like jquery: append a unique timestamp
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onreadystatechange = function(e) { // XMLHttpRequestProgressEvent, but not needed
            if (this.readyState == 4) { // DONE
                if (this.status == 200) {
                    var blob = new Blob([this.response]); //, { "type" : "image/jpeg" });
                    saveAs(blob, filename);
                    resolve();
                } else {
                    reject(this.status);
                }
            }
        };
        xhr.send();
    });
};