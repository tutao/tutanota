"use strict";

/**
 * Executes all initializations needed for the unit tests to run.
 */
var setupLocator = function() {
    // karma
    tutao.crypto.ClientWorkerProxy.initWorkerFileNames('/base/js/', '/base/lib/');

	var singletons = {
		randomizer: tutao.crypto.SjclRandomizer,
		entropyCollector: tutao.crypto.EntropyCollector,
		clientWorkerProxy: tutao.crypto.ClientWorkerProxy,
		aesCrypter: tutao.crypto.AesWorkerProxy,
		rsaCrypter: tutao.crypto.RsaWorkerProxy,
		kdfCrypter: tutao.crypto.JBCryptAdapter,
		shaCrypter: tutao.crypto.SjclSha256,
		userController: tutao.ctrl.UserController,
		dao: tutao.db.WebSqlDb,
		restClient: tutao.rest.RestClient,
		entityRestClient: tutao.rest.EntityRestClient,
		mailBoxController: tutao.tutanota.ctrl.MailBoxController,
		loginViewModel: tutao.tutanota.ctrl.LoginViewModel,
		mailListViewModel: tutao.tutanota.ctrl.MailListViewModel,
		mailViewModel: tutao.tutanota.ctrl.MailViewModel,
        mailView: tutao.tutanota.gui.MailView,
		passwordChannelViewModel: tutao.tutanota.ctrl.PasswordChannelViewModel,
		externalLoginViewModel: tutao.tutanota.ctrl.ExternalLoginViewModel,
		tagListViewModel: tutao.tutanota.ctrl.TagListViewModel,
		viewManager: tutao.tutanota.ctrl.ViewManager,
		indexer: tutao.tutanota.index.Indexer,
		viewSlider: tutao.tutanota.ctrl.ViewSlider,
		swipeRecognizer: tutao.tutanota.ctrl.SwipeRecognizer,
		htmlSanitizer: tutao.tutanota.security.CajaSanitizer,
		languageViewModel: tutao.tutanota.ctrl.LanguageViewModel,
		eventBus: tutao.event.EventBusClient,
		navigator: tutao.tutanota.ctrl.Navigator,
        feedbackViewModel: tutao.tutanota.ctrl.FeedbackViewModel
	};
    var initializer = function () {
        this.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
    };
    eval("tutao.locator = new tutao.Locator(singletons, initializer);")

};

setupLocator();

/**
 * Only returns false if the browser is Safari.
 */
tutao.supportsRsaKeyGeneration = function() {
	var chromeIndex = navigator.userAgent.indexOf("Chrome/");
	var safariIndex = navigator.userAgent.indexOf("Safari/");
	return (safariIndex == -1 || chromeIndex != -1);
};
