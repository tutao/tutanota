"use strict";

tutao.provide('tutao.native.FileFacadeBrowser');


/**
 * @implements {tutao.native.FileFacade}
 * @constructor
 */
tutao.native.FileFacadeBrowser = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

// this flag disables showing the file chooser when running with watir as watir handles file uploads in another way
tutao.native.FileFacadeBrowser.WATIR_MODE = false;

/**
 * @inheritDoc
 */
tutao.native.FileFacadeBrowser.prototype.createFile = function(dataFile, sessionKey) {
	return this.uploadFileData(dataFile, sessionKey).then(function(fileDataId) {
        var fileGroupId = tutao.locator.userController.getGroupId(tutao.entity.tutanota.TutanotaConstants.GROUP_TYPE_FILE);
        var fileEncSessionKey = tutao.locator.aesCrypter.encryptKey(tutao.locator.userController.getGroupKey(fileGroupId), sessionKey);

        // create file
        var fileService = new tutao.entity.tutanota.CreateFileData();
        fileService.getEntityHelper().setSessionKey(sessionKey);
        fileService.setFileName(dataFile.getName())
            .setMimeType(dataFile.getMimeType())
            .setParentFolder(null)
            .setFileData(fileDataId)
            .setGroup(fileGroupId)
            .setOwnerEncSessionKey(fileEncSessionKey);

        return fileService.setup({}, null).then(function(createFileReturn) {
            return createFileReturn.getFile();
        });
	});
};

/**
 * @inheritDoc
 */
tutao.native.FileFacadeBrowser.prototype.showFileChooser = function() {
    var self = this;

    if (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_WINDOWS_PHONE) {
        return tutao.tutanota.gui.alert(tutao.lang("addAttachmentNotPossibleIe_msg")).then(function() {
            return [];
        });
    }
    // each time when called create a new file chooser to make sure that the same file can be selected twice directly after another
    // remove the last file input
    var lastFileInput = document.getElementById("hiddenFileChooser");
    if (lastFileInput) {
        $("body").get(0).removeChild(lastFileInput);
    }

    var fileInput = document.createElement("input");
    fileInput.setAttribute("type", "file");
    fileInput.setAttribute("multiple", "multiple");
    fileInput.setAttribute("id", "hiddenFileChooser");

    var promise = new Promise(function(resolve, reject) {
        $(fileInput).bind("change", function(e) {
            var files = tutao.tutanota.util.FileUtils.fileListToArray(e.originalEvent.target.files);
            resolve(Promise.map(files, self.readLocalFile));
        });
    });

    // the file input must be put into the dom, otherwise it does not work in IE
    $("body").get(0).appendChild(fileInput);
    if (!tutao.native.FileFacadeBrowser.WATIR_MODE) {
        fileInput.click();
    }

    return promise;
};

/**
 * Loads the content of the given file into an ArrayBuffer.
 * @param {File} file The file to load.
 * @return {Promise.<tutao.tutanota.util.DataFile, Error>} Resolves to the loaded DataFile, rejects if the loading fails.
 */
tutao.native.FileFacadeBrowser.prototype.readLocalFile = function(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            if (evt.target.readyState == FileReader.DONE && evt.target.result) { // DONE == 2
                resolve(new tutao.tutanota.util.DataFile(evt.target.result, file));
            } else {
                reject(new Error("could not load file"));
            }
        };
        reader.readAsArrayBuffer(file);
    });
};

/**
 * @inheritDoc
 */
tutao.native.FileFacadeBrowser.prototype.uploadFileData = function(dataFile, sessionKey) {
	var fileData = new tutao.entity.tutanota.FileDataDataPost();
    return tutao.locator.crypto.aesEncrypt(sessionKey, new Uint8Array(dataFile.getData())).then(function(encryptedData) {
        // create file data
        fileData.setSize(dataFile.getSize().toString())
            .setGroup(tutao.locator.userController.getGroupId(tutao.entity.tutanota.TutanotaConstants.GROUP_TYPE_MAIL)); // currently only used for attachments

        return fileData.setup({}, null).then(function(fileDataPostReturn) {
            // upload file data
            var fileDataId = fileDataPostReturn.getFileData();
            var putParams = { fileDataId: fileDataId };
            putParams[tutao.rest.ResourceConstants.SW_VERSION_PARAMETER] = tutao.entity.tutanota.FileDataDataReturn.MODEL_VERSION;
            return tutao.locator.restClient.putBinary(tutao.rest.EntityRestClient.createUrl(tutao.entity.tutanota.FileDataDataReturn.PATH, null, null, putParams), tutao.entity.EntityHelper.createAuthHeaders(), encryptedData).then(function() {
                return fileDataId;
            });
        });
    });
};

/**
 * @inheritDoc
 */
tutao.native.FileFacadeBrowser.prototype.readFileData = function(file) {
    var fileParams = new tutao.entity.tutanota.FileDataDataGet()
        .setFile(file.getId())
        .setBase64(false);
	var params = {};
	params[tutao.rest.ResourceConstants.GET_BODY_PARAM] = encodeURIComponent(JSON.stringify(fileParams.toJsonData()));
	var headers = tutao.entity.EntityHelper.createAuthHeaders();
	return tutao.locator.restClient.getBinary(tutao.rest.EntityRestClient.createUrl(tutao.entity.tutanota.FileDataDataReturn.PATH, null, null, params), headers).then(function(data) {
        if (typeof data === "string") {
            throw new Error("datatype string not supported");
        } else {
            return tutao.locator.crypto.aesDecrypt(file.getEntityHelper().getSessionKey(), new Uint8Array(data), Number(file.getSize())).then(function(decryptedData) {
                return new tutao.tutanota.util.DataFile(decryptedData.buffer, file);
            });
        }
	});
};

/**
 * @inheritDoc
 */
tutao.native.FileFacadeBrowser.prototype.bytesToFile = function(bytes, file) {
    return Promise.resolve(new tutao.tutanota.util.DataFile(bytes.buffer, file));
};

/**
 * @inheritDoc
 */
tutao.native.FileFacadeBrowser.prototype.open = function(dataFile) {
    if (tutao.env.mode == tutao.Mode.App && cordova.platformId == 'ios') {
        return new Promise(function(resolve, reject) {
            window.requestFileSystem(LocalFileSystem.TEMPORARY, dataFile.getSize(), function(fs) {
                //var fileName = dataFile.getName().replace(/[ :\	\\/§$%&\*\=\?#°\^\|<>]/g, "_");
				var fileName = window.encodeURIComponent(dataFile.getName()).replace(/[ :\	\\/§$%&\*\=\?#°\^\|<>]/g, "_");
                fs.root.getFile(fileName, {create: true}, function(fileEntry) {
                    // Create a FileWriter object for our FileEntry (log.txt).
                    fileEntry.createWriter(function(fileWriter) {
                        fileWriter.onwriteend = function(e) {
                            cordova.plugins.disusered.open(fileEntry.toURL(), resolve, reject);
                        };

                        fileWriter.onerror = function(e) {
                            reject(e);
                        };
						var blob = new Blob([dataFile.getData()], {type: dataFile.getMimeType()});
                        fileWriter.write(blob);
                    }, function(e) {
                        reject(e);
                    });
                }, function(e) {
                    reject(e);
                });
            });
        });
    } else {
        // all other browsers
        navigator.saveBlob = navigator.saveBlob || navigator.msSaveBlob || navigator.mozSaveBlob || navigator.webkitSaveBlob;
        window.saveAs = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs;
        var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
        var mimeType = "application/octet-stream"; // default mime type should only be overridden if a valid (non empty) mime type is provided
        if (dataFile.getMimeType().trim().length > 0) {
            mimeType = dataFile.getMimeType();
        }

        if (typeof dataFile.getData() === "string") {
            throw new Error("datatype string not supported");
        } else if (window.saveAs || navigator.saveBlob) {
            var blob = new Blob([dataFile.getData()], { "type" : mimeType });
            try {
                if (window.saveAs) {
                    window.saveAs(blob, dataFile.getName());
                } else {
                    navigator.saveBlob(blob, dataFile.getName());
                }
                return Promise.resolve();
            } catch (e) {
                return tutao.tutanota.gui.alert(tutao.lang("saveDownloadNotPossibleIe_msg"));
            }
        } else {
            var url;
            // android browser and safari mobile < v7 can not open blob urls. unfortunately we can not generally check if this is supported, so we need to check the browser type
            if ((tutao.tutanota.util.ClientDetector.getBrowserType() == tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI && tutao.tutanota.util.ClientDetector.isMobileDevice() && tutao.tutanota.util.ClientDetector.getBrowserVersion() < 7)) {
                var base64 = tutao.util.EncodingConverter.bytesToBase64(new Uint8Array(dataFile.getData()));
                url = "data:" + mimeType + ";base64," + base64;
            } else {
                var blob = new Blob([dataFile.getData()], { "type" : mimeType });
                url = URL.createObjectURL(blob);
            }
            // firefox on android, safari on OS X and >= v7 on iOS do not support opening links with simulated clicks, so show a download dialog. Safari < v7 and Android browser may only open some file types in the browser, so we show the dialog to display the info text
            if (tutao.tutanota.util.ClientDetector.getBrowserType() == tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI) {
                var textId = 'saveDownloadNotPossibleSafariDesktop_msg';
                if (tutao.tutanota.util.ClientDetector.isMobileDevice()) {
                    textId = 'saveDownloadNotPossibleSafariMobile_msg';
                }
                return tutao.locator.legacyDownloadViewModel.showDialog(dataFile.getName(), url, textId).then(function() {
                    // the blob must be deleted after usage. delete it after 1 ms in case some save operation is done async
                    setTimeout(function() {
                        URL.revokeObjectURL(url);
                    }, 1);
                });
            } else {
                fileSaverSaveAs(new Blob([dataFile.getData()], {type: mimeType}), dataFile.getName());
                return Promise.resolve();
            }
        }
    }
};

/**
 * Provides a link for the user to download the given data file. Using the given file name only works on some browsers.
 * @param {tutao.tutanota.util.DataFile} dataFile The data file.
 * @return {Promise.<Error>} Resolves when finished, rejects if the dowload fails.
 */
tutao.native.FileFacadeBrowser.prototype.provideDownload = function(dataFile) {

};


tutao.native.FileFacadeBrowser.prototype.clearFileData = function() {
	return Promise.resolve();
};


