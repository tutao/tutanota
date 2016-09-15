"use strict";

tutao.provide('tutao.tutanota.util.DataFile');

/**
 * A data file contains the file name, the content of the file (unencrypted) and the session key.
 * @param {ArrayBuffer|String} data The content of the file as ArrayBuffer or as base64 string in LEGACY mode.
 * @param {File|tutao.entity.tutanota.File} file The file.
 * @constructor
 */
tutao.tutanota.util.DataFile = function(data, file) {
	if (file instanceof tutao.entity.tutanota.File) {
		this._name = file.getName();
		this._mimeType =  tutao.tutanota.util.Formatter.getCleanedMimeType(file.getMimeType());
		this._id = file.getId();
	} else { // instanceof File, must be in else block as IE 8/9 do not support the type File (and they use only tutao.entity.tutanota.File)
		this._name = file.name;
		if (file.type && file.type !== "") {
			this._mimeType = tutao.tutanota.util.Formatter.getCleanedMimeType(file.type);
		} else {
			this._mimeType = "application/octet-stream";
		}
		this._id = null; // file read from filesystem, does not have an id because it has not been stored in tutanota.
	}
	this._data = data;
};

/**
 * Provides the name of the file.
 * @return {string} The name of the file.
 */
tutao.tutanota.util.DataFile.prototype.getName = function() {
	return this._name;
};

/**
 * Provides the content of the file as ArrayBuffer.
 * @return {ArrayBuffer|String} The content of the file as ArrayBuffer or base64 string in LEGACY mode.
 */
tutao.tutanota.util.DataFile.prototype.getData = function() {
	return this._data;
};

/**
 * Provides the mime type of the file. If the mime type is not known, by default "application/octet-stream" is used.
 * @return {string} The mime type of the file.
 */
tutao.tutanota.util.DataFile.prototype.getMimeType = function() {
	return this._mimeType;
};

/**
 * Provides the size of the file.
 * @return {number} The size of the file in bytes.
 */
tutao.tutanota.util.DataFile.prototype.getSize = function() {
	return this._data.byteLength;
};

/**
 * Provides the id of the file, if it has been store in Tutanota.
 * @return {string} The id of the file.
 */
tutao.tutanota.util.DataFile.prototype.getId = function() {
	return this._id;
};
