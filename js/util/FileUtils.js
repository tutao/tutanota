"use strict";

goog.provide('tutao.tutanota.util.FileUtils');

/**
 * Shows a file chooser and lets the user select multiple files.
 * @param {function(FileList)} callback Called if files are chosen receiving the file list as argument.
 */
tutao.tutanota.util.FileUtils.showFileChooser = function(callback) {
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

	$(fileInput).bind("change", function(e) {
		callback(e.originalEvent.target.files);
	});
	// the file input must be put into the dom, otherwise it does not work in IE
	$("body").get(0).appendChild(fileInput);
	fileInput.click();
};

/**
 * Loads the content of the given file into an ArrayBuffer.
 * @param {File} file The file to load.
 * @param {function(?tutao.tutanota.util.DataFile, Error=)} callback Called when finished receiving the file data. Passes an error if the loading fails.
 */
tutao.tutanota.util.FileUtils.readLocalFile = function(file, callback) {
	var reader = new FileReader();
	reader.onloadend = function(evt) {
		if (evt.target.readyState == FileReader.DONE) { // DONE == 2
			callback(new tutao.tutanota.util.DataFile(evt.target.result, file));
		} else {
			callback(null, new Error("could not load file"));
		}
	};
	reader.readAsArrayBuffer(file);
};

/**
 * Provides a link for the user to download the given data file. Using the given file name only works on some browsers.
 * @param {tutao.tutanota.util.DataFile} dataFile The data file.
 * @param {function(Error=)} callback Called when finished. Passes an error if the download fails.
 */
tutao.tutanota.util.FileUtils.provideDownload = function(dataFile, callback) {
	// TODO check encoding: open text file in browser, encoding is wrong
	navigator.saveBlob = navigator.saveBlob || navigator.msSaveBlob || navigator.mozSaveBlob || navigator.webkitSaveBlob;
	window.saveAs = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs;
	var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

	if (typeof dataFile.getData() === "string") {
		// LEGACY mode
		var downloadButton = $("#downloadButton_" + dataFile.getId()[1]);
		new tutao.tutanota.legacy.FlashFileSaver("flashDownloader_" + dataFile.getId()[1], downloadButton, downloadButton.outerWidth() + 2, downloadButton.outerHeight() + 2, dataFile.getData(), dataFile.getName(), function() {
			downloadButton.find("> span.legacyDownloadText").css("visibility", "visible");
			callback();
		});
	} else if (window.saveAs || navigator.saveBlob) {
		var blob = new Blob([dataFile.getData()], { "type" : dataFile.getMimeType() });
		if (window.saveAs) {
			window.saveAs(blob, dataFile.getName());
		} else {
			navigator.saveBlob(blob, dataFile.getName());
		}
		callback();
	} else {
		var url;
		// safari can not open blob urls. unfortunately we can not generally check if this is supported, so we need to check the browser type
		if (tutao.tutanota.util.ClientDetector.getBrowserType() == tutao.tutanota.util.ClientDetector.BROWSER_TYPE_SAFARI) {
			var base64 = tutao.util.EncodingConverter.bytesToBase64(new Uint8Array(dataFile.getData()));
			url = "data:" + dataFile.getMimeType() + ";base64," + base64;
		} else {
			// the blob builder is not used because it is not supported by all browsers
			var blob = new Blob([dataFile.getData()], { "type" : dataFile.getMimeType() });
			url = URL.createObjectURL(blob);
		}
		var link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", dataFile.getName()); // only chrome currently supports the download link, but it does not cause problems in other browsers
		link.setAttribute("target", "_blank"); // makes sure that data urls are opened in a new tab instead of replacing the tutanota window on mobile safari
		var event = document.createEvent('MouseEvents');
		event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
		link.dispatchEvent(event);

		// the blob must be deleted after usage. delete it after 1 ms in case some save operation is done async
		setTimeout(function() {
			URL.revokeObjectURL(url);
		}, 1);
		callback();
	}
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
