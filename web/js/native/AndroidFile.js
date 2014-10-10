"use strict";

tutao.provide('tutao.native.AndroidFile');

/**
 * An android file contains the file name, the URI to the unencrypted file and the session key.
 * @param {String} location The URI of the unencrypted file
 * @param {String} mimeType The mimeType of the file
 * @param {String} size The size of the file
 * @constructor
 */
tutao.native.AndroidFile = function(location, mimeType, size) {
    this._name = location.split("/").slice(-1)[0];
    this._location = location;
    if (mimeType && mimeType !== "") {
        this._mimeType = mimeType
    } else {
        this._mimeType = "application/octet-stream";
    }
    this._size = size;
};

/**
 * Provides the name of the file.
 * @return {string} The name of the file.
 */
tutao.native.AndroidFile.prototype.getName = function() {
	return this._name;
};

/**
 * Provides the URI to the content of the file
 * @return {ArrayBuffer|String} The content of the file as ArrayBuffer or base64 string in LEGACY mode.
 */
tutao.native.AndroidFile.prototype.getLocation = function() {
	return this._location;
};

/**
 * Provides the mime type of the file. If the mime type is not known, by default "application/octet-stream" is used.
 * @return {string} The mime type of the file.
 */
tutao.native.AndroidFile.prototype.getMimeType = function() {
	return this._mimeType;
};

/**
 * Provides the size of the file.
 * @return {number} The size of the file in bytes.
 */
tutao.native.AndroidFile.prototype.getSize = function() {
	return this._size;
};