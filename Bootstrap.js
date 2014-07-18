"use strict";

goog.provide("tutao.locator");

var setupLocator = function() {
    if (typeof window.parent.karma != 'undefined') {
        // karma
        tutao.crypto.ClientWorkerProxy.initWorkerFileNames('/base/src/main/html/js/', '/base/src/main/html/libs/external/');
    } else {
        // jstestdriver
        tutao.crypto.ClientWorkerProxy.initWorkerFileNames('/test/src/main/html/js/', '/test/src/main/html/libs/external/');
    }

    tutao.locator = new tutao.Locator({
        randomizer: tutao.crypto.SjclRandomizer,
        entropyCollector: tutao.crypto.EntropyCollector,
        clientWorkerProxy: tutao.crypto.ClientWorkerProxy,
        aesCrypter: tutao.crypto.AesWorkerProxy,
        rsaCrypter: tutao.crypto.RsaWorkerProxy,
        kdfCrypter: tutao.crypto.JBCryptAdapter,
        shaCrypter: tutao.crypto.SjclSha256,
        userController: tutao.ctrl.UserController,
        // @type {tutao.rest.RestClient}
        restClient: tutao.rest.RestClient,
        // @type {tutao.rest.EntityRestClient}
        entityRestClient: tutao.rest.EntityRestClient
    }, function() {
        this.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE)
    });
};

/**
 * Executes all initializations needed for the unit tests to run.
 */
//$(document).ready(setupLocator);
setupLocator();

/**
 * Only returns false if the browser is Safari.
 */
tutao.supportsRsaKeyGeneration = function() {
	var chromeIndex = navigator.userAgent.indexOf("Chrome/");
	var safariIndex = navigator.userAgent.indexOf("Safari/");
	return (safariIndex == -1 || chromeIndex != -1);
};
