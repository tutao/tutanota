"use strict";

tutao.provide('tutao.locator');
tutao.provide("tutao.tutanota.Bootstrap");

/**
 * Executes all initializations needed for the unit tests to run.
 */
tutao.tutanota.Bootstrap.init = function() {
    if (typeof tutao.env.type == 'undefined') {
        // test distribution already sets the environment (see gulpfile -> concatTest
        tutao.env = new tutao.Environment(tutao.Env.LOCAL, location.protocol == 'https:' ? true : false, location.hostname, location.port === '' ? '' : location.port);
    }

    if (typeof cordova != 'undefined') {
        tutao.env.mode = tutao.Mode.App;
    }

    Promise.longStackTraces();
    if (typeof window.parent.karma != 'undefined') {
        // karma
        tutao.native.CryptoBrowser.initWorkerFileNames("/base/");
    } else {
        // mocha standalone
        tutao.native.CryptoBrowser.initWorkerFileNames("../");
    }

    var cryptoImpl = tutao.native.CryptoBrowser;
    var notificationImpl = tutao.native.NotificationBrowser;
    if (tutao.env.mode == tutao.Mode.App) {
        console.log("overriding native interfaces");
        cryptoImpl = tutao.native.device.Crypto;
        notificationImpl = tutao.native.NotificationApp;
    }

	var singletons = {
        crypto: cryptoImpl,
        notification: notificationImpl,

		randomizer: tutao.crypto.SjclRandomizer,
		entropyCollector: tutao.crypto.EntropyCollector,
		aesCrypter: tutao.crypto.SjclAes,
		rsaUtil: tutao.native.RsaUtils,
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
        mailFolderListViewModel: tutao.tutanota.ctrl.MailFolderListViewModel,
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
    eval("tutao.locator = new tutao.Locator(singletons, initializer);");
    // shortcuts
    tutao.lang = tutao.locator.languageViewModel.get;

};

/**
 * Only returns false if the browser is Safari.
 */
tutao.supportsRsaKeyGeneration = function() {
	var chromeIndex = navigator.userAgent.indexOf("Chrome/");
	var safariIndex = navigator.userAgent.indexOf("Safari/");
	return (safariIndex == -1 || chromeIndex != -1);
};
