"use strict";

tutao.provide('tutao.tutanota.util.FileUtils');

/**
 * Shows a file chooser and lets the user select multiple files.
 * @return {Promise.<FileList>} Resolves to the FileList.
 */
tutao.tutanota.util.FileUtils.showFileChooser = function() {
    if (tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_IE_MOBILE) {
        tutao.tutanota.gui.alert(tutao.lang("addAttachmentNotPossibleIe_msg"));
        return Promise.resolve([]);
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
            resolve(e.originalEvent.target.files);
        });
    });

    // the file input must be put into the dom, otherwise it does not work in IE
    $("body").get(0).appendChild(fileInput);
    if (!tutao.tutanota.util.FileUtils.WATIR_MODE) {
        fileInput.click();
    }

    return promise
};

// this flag disables showing the file chooser when running with watir as watir handles file uploads in another way
tutao.tutanota.util.FileUtils.WATIR_MODE = false;

/**
 * Loads the content of the given file into an ArrayBuffer.
 * @param {File} file The file to load.
 * @return {Promise.<tutao.tutanota.util.DataFile, Error>} Resolves to the loaded DataFile, rejects if the loading fails.
 */
tutao.tutanota.util.FileUtils.readLocalFile = function(file) {
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
 * Provides a link for the user to download the given data file. Using the given file name only works on some browsers.
 * @param {tutao.tutanota.util.DataFile} dataFile The data file.
 * @return {Promise.<Error>} Resolves when finished, rejects if the dowload fails.
 */
tutao.tutanota.util.FileUtils.provideDownload = function(dataFile) {
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
        } catch (e) {
            tutao.tutanota.gui.alert(tutao.lang("saveDownloadNotPossibleIe_msg"));
        }
		return Promise.resolve();
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
            this.simulatedClick(link, {});

            // the blob must be deleted after usage. delete it after 1 ms in case some save operation is done async
            setTimeout(function() {
                URL.revokeObjectURL(url);
            }, 1);
            return Promise.resolve();
        }
	}
};

// see http://stackoverflow.com/a/6158160
tutao.tutanota.util.FileUtils.simulatedClick = function (target, options) {

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
