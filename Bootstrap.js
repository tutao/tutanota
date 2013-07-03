"use strict";

goog.provide("tutao.locator");

/**
 * Executes all initializations needed for the unit tests to run.
 */
$(document).ready(function() {
	tutao.crypto.ClientWorkerProxy.initWorkerFileNames('/test/src/main/html/js/', '/test/src/main/html/libs/external/');

	tutao.locator = new tutao.Locator({
		randomizer: tutao.crypto.SjclRandomizer,
		entropyCollector: tutao.crypto.EntropyCollector,
		clientWorkerProxy: tutao.crypto.ClientWorkerProxy,
		aesCrypter: tutao.crypto.AesWorkerProxy,
		rsaCrypter: tutao.crypto.RsaWorkerProxy,
		kdfCrypter: tutao.crypto.JBCryptAdapter,
		shaCrypter: tutao.crypto.SjclSha256,
		userController: tutao.ctrl.UserController,
		restClient: tutao.rest.RestClient,
		entityRestClient: tutao.rest.EntityRestClient
		}, function() {
			this.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE)
		});

});

/**
 * Only returns false if the browser is Safari.
 */
tutao.supportsRsaKeyGeneration = function() {
	var chromeIndex = navigator.userAgent.indexOf("Chrome/");
	var safariIndex = navigator.userAgent.indexOf("Safari/");
	return (safariIndex == -1 || chromeIndex != -1);
};
