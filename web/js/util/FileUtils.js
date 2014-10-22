"use strict";

tutao.provide('tutao.tutanota.util.FileUtils');


/**
 * Reads the content of the given file as a UTF8 string.
 * @param {File} file The file to load.
 * @return {Promise.<string, Error>} Resolves to the loaded file content as string, rejects if the loading fails.
 */
tutao.tutanota.util.FileUtils.readLocalFileContentAsUtf8 = function(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                resolve(evt.target.result);
            } else {
                reject(new Error("could not load file"));
            }
        };
        reader.readAsText(file, "UTF-8");
    });
};

/**
 * Provides the extension of the given filename in lowercase letters.
 * @param {string} fileName The filename.
 * @return {string} The extension of the filename.
 */
tutao.tutanota.util.FileUtils.getFileNameExtension = function(fileName) {
	var index = fileName.lastIndexOf(".");
	if (index != -1 && index != (fileName.length - 1)) {
		return fileName.substring(index + 1).toLowerCase();
	} else {
		return "";
	}
};

/**
 * Provides the image that shall be shown in the attachment.
 * @param {String} fileName The name of the file.
 * @param {boolean} busy True if the file is currently busy.
 * @return {String} The name of the image.
 */
tutao.tutanota.util.FileUtils.getFileTypeImage = function(fileName, busy) {
	if (busy) {
		return "graphics/busy.gif";
	} else {
		return 'graphics/mime/' + tutao.tutanota.util.FileUtils.getFileNameExtension(fileName) + '.png';
	}
};

/**
 * Provides the image that shall be shown in the attachment.
 * @param {String} fileName The name of the file.
 * @param {boolean} busy True if the file is currently busy.
 * @return {String} The name of the image.
 */
tutao.tutanota.util.FileUtils.getFileTypeImage = function(fileName, busy) {
    if (busy) {
        return "graphics/busy.gif";
    } else {
        return 'graphics/mime/' + tutao.tutanota.util.FileUtils.getFileNameExtension(fileName) + '.png';
    }
};

/**
 * Converts a FileList into an array of files (native js types)
 * @param {FileList} fileList
 * @return {Array.<File>}
 */
tutao.tutanota.util.FileUtils.fileListToArray = function (fileList) {
    // @type {Array.<File>}
    var files = [];
    for(var i = 0; i < fileList.length; i++) {
        files.push(fileList[i]);
    }
    return files;
};


