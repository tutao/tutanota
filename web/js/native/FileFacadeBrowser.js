"use strict";

tutao.provide('tutao.native.FileFacadeBrowser');


/**
 * @implements {tutao.native.FileFacade}
 * @constructor
 */
tutao.native.FileFacadeBrowser = function() {

};

// this flag disables showing the file chooser when running with watir as watir handles file uploads in another way
tutao.native.FileFacadeBrowser.WATIR_MODE = false;

/**
 * @inheritDoc
 */
tutao.native.FileFacadeBrowser.prototype.createFile = function(dataFile, sessionKey) {
	return this.uploadFileData(dataFile, sessionKey).then(function(fileDataId) {
        // create file
        var fileService = new tutao.entity.tutanota.CreateFileData();
        fileService._entityHelper.setSessionKey(sessionKey);
        fileService.setFileName(dataFile.getName())
            .setMimeType(dataFile.getMimeType())
            .setParentFolder(null)
            .setFileData(fileDataId);

        var fileListId = tutao.locator.mailBoxController.getUserFileSystem().getFiles();
        return fileService._entityHelper.createListEncSessionKey(fileListId).then(function(listEncSessionKey) {
            return fileService.setGroup(tutao.locator.userController.getUserGroupId())
                .setListEncSessionKey(listEncSessionKey)
                .setup({}, null)
                .then(function(createFileReturn) {
                var fileId = createFileReturn.getFile();
                return fileId;
            });
        });
	});
};

/**
 * @inheritDoc
 */
tutao.native.FileFacadeBrowser.prototype.showFileChooser = function() {
    var self = this;

    if (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE_MOBILE) {
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
    var byteSessionKey = new Uint8Array(sjcl.codec.bytes.fromBits(sessionKey));
    return tutao.locator.crypto.aesEncrypt(byteSessionKey, new Uint8Array(dataFile.getData())).then(function(encryptedData) {
        // create file data
        fileData.setSize(dataFile.getSize().toString())
            .setGroup(tutao.locator.userController.getUserGroupId());

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
        .setBase64(tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE);
	var params = {};
	params[tutao.rest.ResourceConstants.GET_BODY_PARAM] = encodeURIComponent(JSON.stringify(fileParams.toJsonData()));
	var headers = tutao.entity.EntityHelper.createAuthHeaders();
	return tutao.locator.restClient.getBinary(tutao.rest.EntityRestClient.createUrl(tutao.entity.tutanota.FileDataDataReturn.PATH, null, null, params), headers).then(function(data) {
        if (typeof data === "string") {
            // LEGACY variant for IE8/9 which uses an Array instead of ArrayBuffer
            return tutao.locator.aesCrypter.decryptBase64(file._entityHelper._sessionKey, data, file.getSize()).then(function(decryptedData) {
                return new tutao.tutanota.util.DataFile(decryptedData, file);
            });
        } else {
            var byteSessionKey = new Uint8Array(sjcl.codec.bytes.fromBits(file._entityHelper._sessionKey));
            return tutao.locator.crypto.aesDecrypt(byteSessionKey, new Uint8Array(data), file.getSize()).then(function(decryptedData) {
                return new tutao.tutanota.util.DataFile(decryptedData, file);
            });
        }
	});
};


/**
 * @inheritDoc
 */
tutao.native.FileFacadeBrowser.prototype.open = function(dataFile) {
    if (typeof cordova != 'undefined' && cordova.platformId == 'ios') {
        return new Promise(function(resolve, reject) {
            window.requestFileSystem(LocalFileSystem.TEMPORARY, dataFile.getSize(), function(fs) {
                var fileName = dataFile.getName().replace(/[ :\	\\/§$%&\*\=\?#°\^\|<>]/g, "_");
                fs.root.getFile(fileName, {create: true}, function(fileEntry) {
                    // Create a FileWriter object for our FileEntry (log.txt).
                    fileEntry.createWriter(function(fileWriter) {
                        fileWriter.onwriteend = function(e) {
							cordova.plugins.bridge.open(fileEntry.toURL(), resolve, reject);
                        };

                        fileWriter.onerror = function(e) {
                            reject(e);
                        };
                        var blob = new Blob([new DataView(dataFile.getData().buffer)], {type: dataFile.getMimeType()});
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
            // LEGACY mode
            var downloadButton = $("#downloadButton_" + dataFile.getId()[1]);
            return new tutao.tutanota.legacy.FlashFileSaver("flashDownloader_" + dataFile.getId()[1], downloadButton, downloadButton.outerWidth() + 2, downloadButton.outerHeight() + 2, dataFile.getData(), dataFile.getName()).then(function() {
                downloadButton.find("> span.legacyDownloadText").show().css("visibility", "visible");
            });
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
            // safari mobile < v7 can not open blob urls. unfortunately we can not generally check if this is supported, so we need to check the browser type
            if (tutao.tutanota.util.ClientDetector.getBrowserType() == tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI && tutao.tutanota.util.ClientDetector.isMobileDevice() && tutao.tutanota.util.ClientDetector.getBrowserVersion() < 7) {
                var base64 = tutao.util.EncodingConverter.bytesToBase64(new Uint8Array(dataFile.getData()));
                url = "data:" + mimeType + ";base64," + base64;
            } else {
                var blob = new Blob([dataFile.getData()], { "type" : mimeType });
                url = URL.createObjectURL(blob);
            }
            // safari on OS X and >= v7 on iOS do not support opening links with simulated clicks, so show a download dialog. Safari < v7 and Android browser may only open some file types in the browser, so we show the dialog to display the info text
            if (tutao.tutanota.util.ClientDetector.getBrowserType() == tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI || tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_ANDROID) {
                var textId = 'saveDownloadNotPossibleSafariDesktop_msg';
                if (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_ANDROID) {
                    textId = 'saveDownloadNotPossibleAndroid_msg';
                } else if (tutao.tutanota.util.ClientDetector.isMobileDevice()) {
                    textId = 'saveDownloadNotPossibleSafariMobile_msg';
                }
                return tutao.locator.legacyDownloadViewModel.showDialog(dataFile.getName(), url, textId).then(function() {
                    // the blob must be deleted after usage. delete it after 1 ms in case some save operation is done async
                    setTimeout(function() {
                        URL.revokeObjectURL(url);
                    }, 1);
                });
            } else {
                var link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", dataFile.getName()); // only chrome currently supports the download link, but it does not cause problems in other browsers
                link.setAttribute("target", "_blank"); // makes sure that data urls are opened in a new tab instead of replacing the tutanota window on mobile safari
                /*
                 var event = document.createEvent('MouseEvents');
                 event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
                 link.dispatchEvent(event);
                 */
                this._simulatedClick(link, {});

                // the blob must be deleted after usage. delete it after 1 ms in case some save operation is done async
                setTimeout(function() {
                    URL.revokeObjectURL(url);
                }, 1);
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

// see http://stackoverflow.com/a/6158160
tutao.native.FileFacadeBrowser.prototype._simulatedClick = function (target, options) {

    var event = target.ownerDocument.createEvent('MouseEvents');
    var options = options || {};

    //Set your default options to the right of ||
    var opts = {
        type: options.type                  || 'click',
        canBubble:options.canBubble             || true,
        cancelable:options.cancelable           || true,
        view:options.view                       || target.ownerDocument.defaultView,
        detail:options.detail                   || 1,
        screenX:options.screenX                 || 0, //The coordinates within the entire page
        screenY:options.screenY                 || 0,
        clientX:options.clientX                 || 0, //The coordinates within the viewport
        clientY:options.clientY                 || 0,
        ctrlKey:options.ctrlKey                 || false,
        altKey:options.altKey                   || false,
        shiftKey:options.shiftKey               || false,
        metaKey:options.metaKey                 || false, //I *think* 'meta' is 'Cmd/Apple' on Mac, and 'Windows key' on Win. Not sure, though!
        button:options.button                   || 0, //0 = left, 1 = middle, 2 = right
        relatedTarget:options.relatedTarget     || null
    };

    //Pass in the options
    event.initMouseEvent(
        opts.type,
        opts.canBubble,
        opts.cancelable,
        opts.view,
        opts.detail,
        opts.screenX,
        opts.screenY,
        opts.clientX,
        opts.clientY,
        opts.ctrlKey,
        opts.altKey,
        opts.shiftKey,
        opts.metaKey,
        opts.button,
        opts.relatedTarget
    );

    //Fire the event
    target.dispatchEvent(event);
};