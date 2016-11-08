var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    utils = require('cordova/utils');


var FileUtil = function () {};

/**
 * Open the file
 * @param {string} file The uri of the file
 * @param {string} mimeType The mimeType of the file
 * @return {Promise.<undefined, Error>}.
 */
FileUtil.prototype.open = function(file, mimeType) {
    return new Promise(function (resolve, reject) {
        exec(resolve, reject,"FileUtil", "open",[file, mimeType]);
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
 * @param {string} file The uri of the file
 * @param {Uint8Array} bytes
 * @returns {Promise}
 */
FileUtil.prototype.write = function(file, bytes) {
    return new Promise(function (resolve, reject) {
        exec(resolve,reject,"FileUtil", "write",[file, tutao.util.EncodingConverter.uint8ArrayToBase64(bytes)]);
    });
};

/**
 * ONLY FOR TESTING
 * Read a file
 * @param {tutao.native.AppFile} file The file to read.
 * @returns {Promise.<Uint8Array>}
 */
FileUtil.prototype.read = function(file) {
    return new Promise(function (resolve, reject) {
        exec(function(result) {
            resolve(tutao.util.EncodingConverter.base64ToUint8Array(result));
        },reject,"FileUtil", "read",[file]);
    });
};

/**
 * Deletes the file.
 * @param {string} file The uri of the file to delete.
 * @returns {Promise}
 */
FileUtil.prototype.deleteFile = function(file) {
    return new Promise(function (resolve, reject) {
        exec(resolve,reject,"FileUtil", "deleteFile",[file]);
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
 * @returns {Promise.<Number>}
 */
FileUtil.prototype.getSize = function(file) {
    return new Promise(function (resolve, reject) {
        exec(resolve, reject,"FileUtil", "getSize",[file]);
    }).then(function(sizeString) {
        return Number(sizeString);
    });
};

/**
 * Uploads the binary data of a file to tutadb
 * @param {tutao.native.AppFile} file
 * @param {string} targetUrl
 * @param {object} headers
 * @returns {Promise}
 */
FileUtil.prototype.upload = function(file, targetUrl, headers) {
    var self = this;
    return new Promise(function (resolve, reject) {
        exec(resolve, self._createConnectionErrorHandler(reject),"FileUtil", "upload",[file, targetUrl, headers]);
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
    var self = this;
    return new Promise(function (resolve, reject) {
        exec(resolve, self._createConnectionErrorHandler(reject),"FileUtil", "download",[sourceUrl, filename, headers]);
    });
};

FileUtil.prototype._createConnectionErrorHandler = function(rejectFunction) {
    return function(errorString) {
        if (errorString.indexOf("java.net.SocketTimeoutException") == 0 ||
            errorString.indexOf("javax.net.ssl.SSLException") == 0 ||
            errorString.indexOf("java.io.EOFException") == 0 ||
            errorString.indexOf("java.net.UnknownHostException") == 0) {
            rejectFunction(new tutao.ConnectionError(errorString));
        } else {
            rejectFunction(new Error(errorString));
        }
    }
};


FileUtil.prototype.clearFileData = function() {
    var self = this;
    return new Promise(function (resolve, reject) {
        exec(resolve, self._createConnectionErrorHandler(reject),"FileUtil", "clearFileData",[]);
    });
};

var fileUtil = FileUtil;
module.exports = fileUtil;

