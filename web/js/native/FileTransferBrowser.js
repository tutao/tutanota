"use strict";

tutao.provide('tutao.native.FileTransferBrowser');

/**
 * @constructor
 * @implements {tutao.native.FileTransferInterface}
 */
tutao.native.FileTransferBrowser = function() {};

tutao.native.FileTransferBrowser.prototype.downloadAndOpen = function(file) {
    var self = this;
    return tutao.tutanota.ctrl.FileFacade.readFileData(file).then(function (dataFile) {
           return self.open(dataFile);
    });
};


tutao.native.FileTransferBrowser.prototype.open = function(dataFile) {
    return tutao.tutanota.util.FileUtils.provideDownload(dataFile);
};