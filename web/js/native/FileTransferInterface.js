"use strict";

tutao.provide('tutao.native.FileTransferInterface');

/**
 * Functions to transfer files in both directions
 * @interface
 */
tutao.native.FileTransferInterface = function(){};

/**
 * Downloads and opens a file
 * @param {tutao.entity.tutanota.File} file The file to download.
 * @return {Promise.<undefined, Error>}.
 */
tutao.native.FileTransferInterface.prototype.downloadAndOpen = function(file) {};


/**
 * Opens a file
 * @param {tutao.tutanota.util.DataFile} dataFile The file to open.
 * @return {Promise.<undefined, Error>}.
 */
tutao.native.FileTransferInterface.prototype.open = function(dataFile) {};