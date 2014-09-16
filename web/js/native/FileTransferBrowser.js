"use strict";

tutao.provide('tutao.native.FileTransferBrowser');

/**
 * @constructor
 * @implements {tutao.native.FileTransferInterface}
 */
tutao.native.FileTransferBrowser = function() {};

tutao.native.FileTransferBrowser.prototype.downloadAndOpen = function(file) {
    return tutao.tutanota.ctrl.FileFacade.readFileData(file).then(function (dataFile, exception) {
             return tutao.tutanota.util.FileUtils.provideDownload(dataFile);
    });
};