"use strict";

tutao.provide('tutao.native.FileFacade');

/**
 * Facade to encrypt and upload and to download and decrypt files.
 * @interface
 */
tutao.native.FileFacade = function() {};

/**
 * Shows a file chooser and lets the user select multiple files.
 * @return {Promise.<Array.<tutao.tutanota.util.DataFile|tutao.tutanota.native.AndroidFile>>} Resolves to the FileList.
 */
tutao.native.FileFacade.prototype.showFileChooser = function() {};

/**
 * Creates a new file on the server in the user file system.
 * @param {tutao.tutanota.util.DataFile|tutao.native.AndroidFile} dataFile The file.
 * @param {Object} sessionKey The session key used to encrypt the file.
 * @return {Promise.<Array.<String>>} Resolves to the id of the created File, rejected if failed.
 */
tutao.native.FileFacade.prototype.createFile = function(file, sessionKey) {};

/**
 * Creates a new file data instance on the server and uploads the data from the given DataFile to it.
 * @param {tutao.tutanota.util.DataFile|tutao.native.AndroidFile} file The file.
 * @param {Object} sessionKey The session key used to encrypt the file.
 * @return {Promise.<String>} Resolves to the id of the created FileData, rejected if failed.
 */
tutao.native.FileFacade.prototype.uploadFileData = function(file, sessionKey) {};

/**
 * Loads the content of a file from the server and provides it as DataFile.
 * @param {tutao.entity.tutanota.File} file The File.
 * @return {Promise.<tutao.tutanota.util.DataFile|tutao.native.AndroidFile>} Resolves to the read file, rejected if loading failed.
 */
tutao.native.FileFacade.prototype.readFileData = function(file) {};

/**
 * Opens the file.
 * @param {tutao.tutanota.util.DataFile|tutao.native.AndroidFile|tutao.entity.tutanota.File} file The File.
 * @return {Promise.<>} Resolves after the file has been opened, rejected if failed.
 */
tutao.native.FileFacade.prototype.open = function(file) {};
