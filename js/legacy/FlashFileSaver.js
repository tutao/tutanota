"use strict";

goog.provide('tutao.tutanota.legacy.FlashFileSaver');

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
 * @param {function} callback Called when finished.
 * @constructor
 */
tutao.tutanota.legacy.FlashFileSaver = function(id, parentDomElement, width, height, downloadedData, filename, callback) {
	var placeholder = document.createElement('div');
	placeholder.id = id;
	$(parentDomElement).append(placeholder);
    var params = { allowScriptAccess: 'always', wmode: 'transparent'};
	swfobject.embedSWF('js/legacy/FlashFileSaver.swf', id, width, height, "10", null, null, params, null, function(e) {
		tutao.tutanota.legacy.FlashFileSaver.wait(downloadedData, filename, e.ref, callback);
	});
};

tutao.tutanota.legacy.FlashFileSaver.wait = function(downloadedData, filename, reference, callback) {
	if (reference.provideDownload) {
		reference.provideDownload(downloadedData, filename);
		callback();
	} else {
		setTimeout(function() {
			tutao.tutanota.legacy.FlashFileSaver.wait(downloadedData, filename, reference, callback);
		}, 50);
	}
};
