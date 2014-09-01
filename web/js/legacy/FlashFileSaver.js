"use strict";

tutao.provide('tutao.tutanota.legacy.FlashFileSaver');

/**
 * The FlashFileSaver is a fallback for older browsers (IE < 10) and is used in order to save data on the client.
 *
 * In order to compile the action script code (FlasFileSaver.as) you have to invoke <code>mxmlc FlashFileSaver.as</code>.
 * Before you are able to compile:
 * <ul>
 *   <li>The compiler must be downloaded and installed from http://www.apache.org/dyn/closer.cgi/flex/4.9.0/binaries/apache-flex-sdk-4.9.0-bin.tar.gz.
 *   <li>Download the flash player (http://fpdownload.macromedia.com/get/flashplayer/updaters/11/playerglobal11_1.swc) and put it to <code>FLEX_HOME/playerglobalHome/11.1/playerglobal.swc</code>
 *   <li>Set the following environment variables
 *   <ul>
 *     <li>FLEX_HOME=/opt/apache-flex-sdk-4.9.0-bin/
 *     <li>PLAYERGLOBAL_HOME=/opt/apache-flex-sdk-4.9.0-bin/playerglobalHome/
 *   </ul>
 * </ul>
 *
 * @param {String} id A unique id for this flashDownloader.
 * @param {Object} parentDomElement The parent DOM element of the flash button.
 * @param {String} width The width.
 * @param {String} height The height.
 * @param {String} downloadedData Base64 coded binary data.
 * @param {String} filename The filename.
 * @return {Promise.<Error>} Resolves when finished.
 * @constructor
 */
tutao.tutanota.legacy.FlashFileSaver = function(id, parentDomElement, width, height, downloadedData, filename) {
	var placeholder = document.createElement('div');
	placeholder.id = id;
	$(parentDomElement).append(placeholder);
    var params = { allowScriptAccess: 'always', wmode: 'transparent'};
    return new Promise(function(resolve, reject) {
        swfobject.embedSWF('legacy/FlashFileSaver.swf', id, width, height, "10", null, null, params, null, function(e) {
            tutao.tutanota.legacy.FlashFileSaver.wait(downloadedData, filename, e.ref, resolve);
        });
    });
};

/**
 *
 * @param {string} downloadedData
 * @param {string} filename
 * @param {FlashFileSaver} reference The reference to the ActionScript flash file saver
 * @param {function()} resolve The promise resolve function that should be called after the download is ready.
 */
tutao.tutanota.legacy.FlashFileSaver.wait = function(downloadedData, filename, reference, resolve) {
	if (reference.provideDownload) {
		reference.provideDownload(downloadedData, filename);
		resolve();
	} else {
		setTimeout(function() {
			tutao.tutanota.legacy.FlashFileSaver.wait(downloadedData, filename, reference, resolve);
		}, 50);
	}
};
