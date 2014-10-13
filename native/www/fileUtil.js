var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    utils = require('cordova/utils');


var FileUtil = function () {};

/**
 * Open the file
 * @param {tutao.native.AndroidFile} file The file to open.
 * @return {Promise.<undefined, Error>}.
 */
FileUtil.prototype.open = function(file) {
    return new Promise(function (resolve, reject) {
        exec(function () {
            console.log("opened");
            resolve();
        }, function (reason) {
            console.log("rejected" , reason);
            reject(reason);
        },"FileUtil", "open",[file]);
    });
};

/**
 * Opens a file chooser to select a file
 * @return {Promise.<undefined, Error>}.
 */
FileUtil.prototype.openFileChooser = function() {
    return new Promise(function (resolve, reject) {
        exec(resolve,reject,"FileUtil", "openFileChooser",[]);
    });
};

/**
 * ONLY FOR TESTING
 * Write a file.
 * @param {tutao.native.AndroidFile} file The file to write.
 * @param {Uint8Array} bytes
 * @returns {Promise}
 */
FileUtil.prototype.write = function(file, bytes) {
    return new Promise(function (resolve, reject) {
        exec(resolve,reject,"FileUtil", "write",[file, tutao.util.EncodingConverter.bytesToBase64(bytes)]);
    });
};

/**
 * ONLY FOR TESTING
 * Read a file
 * @param {tutao.native.AndroidFile} file The file to read.
 * @returns {Promise.<Uint8Array>}
 */
FileUtil.prototype.read = function(file) {
    return new Promise(function (resolve, reject) {
        exec(function(result) {
            resolve(tutao.util.EncodingConverter.base64ToArray(result));
        },reject,"FileUtil", "read",[file]);
    });
};

/**
 * Deletes the file.
 * @param {string} file The uri of the file to delete.
 * @returns {Promise}
 */
FileUtil.prototype.delete = function(file) {
    return new Promise(function (resolve, reject) {
        exec(resolve,reject,"FileUtil", "delete",[file]);
    });
};

/**
 * Returns the name of the file
 * @param {string} file The uri of the file
 * @returns {Promise.<string>}
 */
FileUtil.prototype.getName = function(file) {
    return new Promise(function (resolve, reject) {
        exec(resolve, reject,"FileUtil", "getName",[file]);
    });
};

/**
 * Returns the mime type of the file
 * @param {string} file The uri of the file
 * @returns {Promise.<string>}
 */
FileUtil.prototype.getMimeType = function(file) {
    return new Promise(function (resolve, reject) {
        exec(resolve, reject,"FileUtil", "getMimeType",[file]);
    });
};

/**
 * Returns the byte size of a file
 * @param {string} file The uri of the file
 * @returns {Promise.<string>}
 */
FileUtil.prototype.getSize = function(file) {
    return new Promise(function (resolve, reject) {
        exec(resolve, reject,"FileUtil", "getSize",[file]);
    });
};

/**
 * Uploads the binary data of a file to tutadb
 * @param {tutao.native.AndroidFile} file
 * @param {string} targetUrl
 * @param {object} headers
 * @returns {Promise}
 */
FileUtil.prototype.upload = function(file, targetUrl, headers) {
    return new Promise(function (resolve, reject) {
        exec(resolve, reject,"FileUtil", "upload",[file, targetUrl, headers]);
    });
};

/**
 * Downloads the binary data of a file from tutadb and stores it in the internal memory.
 * @param {string} sourceUrl
 * @param {string} filename
 * @param {object} headers
 * @returns {Promise.<string>} Resolves to the URI of the downloaded file
 */
FileUtil.prototype.download = function(sourceUrl, filename, headers) {
    return new Promise(function (resolve, reject) {
        exec(resolve, reject,"FileUtil", "download",[sourceUrl, filename, headers]);
    });
};

var fileUtil = FileUtil;
module.exports = fileUtil;

