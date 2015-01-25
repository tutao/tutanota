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
 * Provides the image class that shall be shown in the attachment.
 * @param {String} fileName The name of the file.
 * @param {boolean} busy True if the file is currently busy.
 * @return {String} The name of the image.
 * @see http://fileinfo.com/filetypes/common for a comprehensive listing
 */
tutao.tutanota.util.FileUtils.getFileTypeImage = function(fileName, busy) {
    if (busy) {
        return "spinner";
    } else {
        var extension = tutao.tutanota.util.FileUtils.getFileNameExtension(fileName);
        if (["7z", "bz", "bz2", "deb", "gz", "pgk", "rar", "rpm", "tar", "tgz", "zip"].indexOf(extension) != -1) {
            return "file-zip";
        } else if (["txt", "log", "ini", "cfg"].indexOf(extension) != -1) {
            return "file-text";
        } else if (["doc", "dot", "docx", "docm", "dotx", "dotm", "docb", "odt", "rtf"].indexOf(extension) != -1) {
            return "file-word";
        } else if (["xls", "xlt", "xlm", "xlsx", "xlsm", "xltx", "xltm", "ods"].indexOf(extension) != -1) {
            return "file-excel";
        } else if (["ppt", "pot", "pps", "pptx", "pptm", "potx", "potm", "ppam", "ppsx", "ppsm", "sldx", "sldm", "odp", "key"].indexOf(extension) != -1) {
            return "file-presentation";
        } else if (["eml", "mbox", "pst", "ost", "msg"].indexOf(extension) != -1) {
            return "file-email";
        } else if (["vcf"].indexOf(extension) != -1) {
            return "file-contact";
        } else if (["csv", "xml", "json", "dat"].indexOf(extension) != -1) {
            return "file-data";
        } else if (["aac","aif", "aiff", "ape", "dvf", "flac", "m3u", "m4a", "m4p", "mid", "mp3", "mpa", "mpc", "oga", "ogg", "pcm", "wav", "wma"].indexOf(extension) != -1) {
            return "file-music";
        } else if (["asf", "avi", "flv", "m4v", "mov", "mp4", "mpg", "rm", "swf", "vob", "wmv", "ogv", "mp4"].indexOf(extension) != -1) {
            return "file-video";
        } else if (["ai", "bmp", "eps", "gif", "jpg", "jpeg", "png", "ps", "psd", "svg", "tga", "tif", "tiff", "yuv"].indexOf(extension) != -1) {
            return "file-image";
        } else if (["pdf"].indexOf(extension) != -1) {
            return "file-pdf";
        } else if (["apk", "app", "bat", "com", "exe", "jar", "sh", "vb", "wsf"].indexOf(extension) != -1) {
            return "file-executable";
        } else if (["asp", "aspx", "css", "htm", "html", "js", "msi", "php", "rss", "xhtml"].indexOf(extension) != -1) {
            return "file-web";
        } else if (["ics", "ical"].indexOf(extension) != -1) {
            return "file-calendar";
        } else if (["fnt", "otf", "ttf", "woff"].indexOf(extension) != -1) {
            return "file-font";
        } else {
            return "file-undefined";
        }
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


