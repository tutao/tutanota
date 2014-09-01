"use strict";

tutao.provide('tutao.native.FileTransferInterface');

/**
 * Functions to transfer files in both directions
 * @interface
 */
tutao.native.FileTransferInterface = function(){};

/**
 * Downloads and opens a file
 * @return {Promise.<undefined, Error>}.
 */
tutao.native.FileTransferInterface.prototype.downloadAndOpen = function(url) {};