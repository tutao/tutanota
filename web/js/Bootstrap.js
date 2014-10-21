"use strict";

tutao.provide('tutao.locator');
tutao.provide("tutao.tutanota.Bootstrap");

/**
 * Executes all initializations needed for the live one-and-only tutanota website.
 * This binding is located in gui, so that it is not used for unit or integration tests.
 */
tutao.tutanota.Bootstrap.init = function () {
    var launch = function () {

        // disable all registered event handlers on the document and the window
        $(document).off();
        $(window).off();
		
        if (typeof StatusBar != 'undefined') {
			StatusBar.overlaysWebView(false);
			StatusBar.backgroundColorByHexString('#f8f8f8');
			StatusBar.styleDefault();
        }
		
        if (tutao.tutanota.util.ClientDetector.isSupported()) {
            $(window).unload(function () {
                tutao.locator.eventBus.close(); // close the socket in non legacy-mode
            });
        }

        if (tutao.locator && tutao.locator.eventBus) {
            tutao.locator.eventBus.close();
        }

        tutao.tutanota.Bootstrap.initControllers();
        Promise.longStackTraces();
        Promise.onPossiblyUnhandledRejection(function (e) {
            if (e instanceof tutao.ConnectionError) {
                tutao.tutanota.gui.alert(tutao.lang("serverNotReachable_msg"));
            } else if (e instanceof  tutao.InvalidSoftwareVersionError) {
                tutao.tutanota.gui.alert(tutao.lang("outdatedClient_msg"));
            } else {
                if (tutao.locator.viewManager.feedbackSupported()) {
                    // only logged in users can report errors
                    tutao.locator.feedbackViewModel.open(e.stack);
                } else {
                    tutao.tutanota.gui.alert(tutao.lang("unknownError_msg"));
                }
            }
            console.log(e.stack);
        });

        if (!tutao.tutanota.app) {
            tutao.tutanota.app = ko.observable(true);
        } else {
            tutao.tutanota.app(!tutao.tutanota.app());
        }
        tutao.locator.viewManager.select(tutao.locator.fastMessageView);
        setTimeout(function () {
            tutao.locator.navigator.setup();
            tutao.locator.entropyCollector.start();
            if (tutao.env.mode == tutao.Mode.App) {
                tutao.locator.crypto.seed();
            }
        }, 0);

        if (window.applicationCache) {
            var listener = new tutao.tutanota.ctrl.AppCacheListener();
        }


		// open links in default browser on mobile devices. Requires cordova plugin org.apache.cordova.inappbrowser
		$(document).on("click", "a", function(e){
			tutao.tutanota.gui.openLink(this.href);
            return false;
		});

        if (tutao.env.mode == tutao.Mode.App && cordova.platformId == "android") {
            var util = new tutao.native.device.Util();
            document.addEventListener("backbutton", function () {
                var view = tutao.locator.viewManager.getActiveView();
                if (view && view.isShowLeftNeighbourColumnPossible()) {
                    view.getSwipeSlider().showLeftNeighbourColumn();
                } else {
                    util.switchToHomescreen();
                }
            }, false);
        }

        // only for testing
		//tutao.locator.developerViewModel.open();
		//tutao.locator.loginViewModel.mailAddress("matthias@tutanota.de");
		//tutao.locator.loginViewModel.passphrase("map");
		//tutao.locator.loginViewModel.login();
        //setTimeout(function() {        tutao.locator.navigator.customer();}, 1000);
        tutao.tutanota.gui.initKnockout();
    };

    if (typeof cordova != 'undefined') {
        tutao.env.mode = tutao.Mode.App;
    }

    if (tutao.env.mode == tutao.Mode.App) {
        document.addEventListener("deviceready", function () {
            launch();
            // hide the splashscreen after a short delay, as slower android phones would show the loading screen otherwise
            setTimeout(function () {
                navigator.splashscreen.hide();
            }, 200);
        }, false);
    } else {
        $(document).ready(launch);
    }
};

tutao.tutanota.Bootstrap.getSingletons = function() {
    operative.setSelfURL("operative-0.3.1.js");

    //override native implementation with device specific one, if available
    var cryptoImpl = tutao.native.CryptoBrowser;
    var phoneImpl = tutao.native.Phone;
    var notificationImpl = tutao.native.NotificationBrowser;
    var contactImpl = tutao.native.ContactBrowser;
    var fileFacadeImpl = tutao.native.FileFacadeBrowser;
    var configFacadeImpl = tutao.native.ConfigBrowser;
    if (tutao.env.mode == tutao.Mode.App) {
        console.log("overriding native interfaces");
        cryptoImpl = tutao.native.device.Crypto;
        phoneImpl = tutao.native.device.Phone;
        notificationImpl = tutao.native.NotificationApp;
        contactImpl = tutao.native.ContactApp;
        if (cordova.platformId == "android") {
            fileFacadeImpl = tutao.native.FileFacadeAndroidApp;
            configFacadeImpl = tutao.native.ConfigApp;
        }
    }

    var singletons = {
        crypto: cryptoImpl,
        phone: phoneImpl,
        notification: notificationImpl,
        contacts: contactImpl,
        fileFacade: fileFacadeImpl,
        configFacade: configFacadeImpl,

        randomizer: tutao.crypto.SjclRandomizer,
        aesCrypter: tutao.crypto.SjclAes,
        rsaUtil: tutao.native.RsaUtils,
        kdfCrypter: tutao.crypto.JBCryptAdapter,
        shaCrypter: tutao.crypto.SjclSha256,
        userController: tutao.ctrl.UserController,
        dao: tutao.db.WebSqlDb,
        restClient: tutao.rest.RestClient,
        entityRestClient: tutao.rest.EntityRestClient,
        mailBoxController: tutao.tutanota.ctrl.MailBoxController,
        viewManager: tutao.tutanota.ctrl.ViewManager,
        loginViewModel: tutao.tutanota.ctrl.LoginViewModel,
        externalLoginViewModel: tutao.tutanota.ctrl.ExternalLoginViewModel,
        tagListViewModel: tutao.tutanota.ctrl.TagListViewModel,
        mailListViewModel: tutao.tutanota.ctrl.MailListViewModel,
        mailViewModel: tutao.tutanota.ctrl.MailViewModel,
        passwordChannelViewModel: tutao.tutanota.ctrl.PasswordChannelViewModel,
        contactListViewModel: tutao.tutanota.ctrl.ContactListViewModel,
        contactViewModel: tutao.tutanota.ctrl.ContactViewModel,
        feedbackViewModel: tutao.tutanota.ctrl.FeedbackViewModel,
        developerViewModel: tutao.tutanota.ctrl.DeveloperViewModel,
        fontViewModel: tutao.tutanota.ctrl.FontViewModel,
        themeViewModel: tutao.tutanota.ctrl.ThemeViewModel,
        loginView: tutao.tutanota.gui.LoginView,
        externalLoginView: tutao.tutanota.gui.ExternalLoginView,
        notFoundView: tutao.tutanota.gui.LoginView,
        mailView: tutao.tutanota.gui.MailView,
        contactView: tutao.tutanota.gui.ContactView,
        fastMessageView: tutao.tutanota.gui.FastMessageView,
        notSupportedView: tutao.tutanota.gui.NotSupportedView,
        registrationVerifyDomainView: tutao.tutanota.gui.RegistrationVerifyDomainView,
        registrationVerifyDomainViewModel: tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel,
        registrationView: tutao.tutanota.gui.RegistrationView,
        registrationViewModel: tutao.tutanota.ctrl.RegistrationViewModel,
        settingsView: tutao.tutanota.gui.SettingsView,
        settingsViewModel: tutao.tutanota.ctrl.SettingsViewModel,
        entropyCollector: tutao.crypto.EntropyCollector,
        htmlSanitizer: tutao.tutanota.security.CajaSanitizer,
        languageViewModel: tutao.tutanota.ctrl.LanguageViewModel,
        eventBus: tutao.event.EventBusClient,
        fileViewModel: tutao.tutanota.ctrl.FileViewModel,
        fileView: tutao.tutanota.gui.FileView,
        navigator: tutao.tutanota.ctrl.Navigator,
        legacyDownloadViewModel: tutao.tutanota.ctrl.LegacyDownloadViewModel,
        progressDialogModel: tutao.tutanota.ctrl.ProgressDialogModel,
        modalPageBackgroundViewModel: tutao.tutanota.ctrl.ModalPageBackgroundViewModel
    };

    if (tutao.tutanota.util.ClientDetector.isMobileDevice()) {
        singletons['swipeRecognizer'] = tutao.tutanota.ctrl.SwipeRecognizer;
    }
    tutao.tutanota.legacy.Legacy.setup(singletons);

    return singletons;
};

tutao.tutanota.Bootstrap.initControllers = function () {
    tutao.native.CryptoBrowser.initWorkerFileNames("");

    // @type {tutao.Locator}
    tutao.locator = new tutao.Locator(tutao.tutanota.Bootstrap.getSingletons());

    var external = tutao.util.StringUtils.startsWith(location.hash, "#mail");
    tutao.locator.viewManager.init(external);

    // shortcuts
    tutao.lang = tutao.locator.languageViewModel.get;

    if (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE) {
        var viewport = document.querySelector("meta[name=viewport]");
        //viewport.setAttribute('content', 'initial-scale=0.85, maximum-scale=0.85, user-scalable=no');
    }

    // indexing is disabled currently
    // if (!tutao.locator.dao.isSupported() || tutao.tutanota.util.ClientDetector.isMobileDevice()) {
    tutao.locator.replace('dao', new tutao.db.DummyDb);
    // }

    // add a cache to the rest entity chain
    var cache = new tutao.rest.EntityRestCache();
    cache.setTarget(tutao.locator.entityRestClient);
    tutao.locator.replace('entityRestClient', cache);

    if (tutao.locator.swipeRecognizer) {
        tutao.locator.swipeRecognizer.setScreenSize(tutao.tutanota.gui.getWindowWidth(), tutao.tutanota.gui.getWindowHeight());
        tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT, function () {
            tutao.locator.viewManager.getActiveView().getSwipeSlider().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT);
        });
        tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT, function () {
            tutao.locator.viewManager.getActiveView().getSwipeSlider().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT);
        });
    }

    tutao.tutanota.gui.initEvents();

    tutao.tutanota.gui.addWindowResizeListener(function (width, height) {
        // notify the active view and the swipe recognizer
        if (tutao.locator.viewManager.getActiveView() != null) {
            tutao.locator.viewManager.getActiveView().getSwipeSlider().windowSizeChanged(width, height);
        }
        if (tutao.locator.swipeRecognizer) {
            tutao.locator.swipeRecognizer.setScreenSize(width, height);
        }
    });
};