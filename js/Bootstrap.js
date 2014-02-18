"use strict";

goog.provide('tutao.locator');
goog.provide("tutao.tutanota.Bootstrap");

/**
 * Executes all initializations needed for the live one-and-only tutanota website.
 * This binding is located in gui, so that it is not used for unit or integration tests.
 */
// TODO (timely) use promises instead of callbacks: Switch js code to make use of promises in order to increase the code maintainability. See http://www.html5rocks.com/en/tutorials/es6/promises/?redirect_from_locale=de
tutao.tutanota.Bootstrap.init = function () {
    if (window.applicationCache) {
        window.applicationCache.addEventListener('updateready', function (e) {
            if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                // Browser downloaded a new app cache: We have to reload the page in order to get the new contents
                window.applicationCache.swapCache();
                // TODO (story: Show info for version update and offline mode) handle application cache reload and show a notice to the user (Updating application... => The application has been updated and will be reloaded)
                // event description: http://www.html5rocks.com/de/tutorials/appcache/beginner/
                window.location.reload();
                console.log("updated to current release");
            }
        }, false);
    }

    // disable all registered event handlers on the document and the window
    $(document).off();
    $(window).off();

    if (tutao.tutanota.util.ClientDetector.isSupported()) {
        $(window).unload(function () {
            tutao.locator.eventBus.close(); // close the socket in non legacy-mode
        });
    }

    if (tutao.locator && tutao.locator.eventBus) {
        tutao.locator.eventBus.close();
    }

    tutao.tutanota.Bootstrap.initControllers();
    if (!tutao.tutanota.app) {
        tutao.tutanota.app = ko.observable(true);
    } else {
        tutao.tutanota.app(!tutao.tutanota.app());
    }
    tutao.locator.viewManager.select(tutao.locator.fastMessageView);
    setTimeout(function () {
        tutao.locator.navigator.setup();
        tutao.locator.entropyCollector.start();

    });

    // only for testing
//		tutao.locator.loginViewModel.mailAddress("premium-admin@tutanota.de");
//		tutao.locator.loginViewModel.passphrase("premiumAdminPw");
//		tutao.locator.loginViewModel.login(function() {
//			tutao.locator.navigator.settings();
//			tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_USER_LIST);
//			tutao.locator.navigator.customer();
//			tutao.locator.viewManager.select(tutao.locator.contactView);
//			tutao.locator.contactListViewModel.contactsInitializedCallback.push(function() {
//				tutao.locator.contactViewModel.showContact(tutao.locator.contactListViewModel.contacts()[2]());
//				tutao.locator.contactViewModel.editContact();
//			});
//		});
//		tutao.locator.registrationViewModel.gender("Mr");
//		tutao.locator.registrationViewModel.firstName("arne");
//		tutao.locator.registrationViewModel.lastName("moehle");
//		tutao.locator.registrationViewModel.mailAddress("arne.moehle");
//		tutao.locator.registrationViewModel.phoneNumber("01739508502");
//		tutao.locator.registrationViewModel.password1("asdfasdfasdfasdf");
//		tutao.locator.registrationViewModel.password2("asdfasdfasdfasdf");
//		tutao.locator.registrationViewModel.termsAccepted(true);
};

/**
 * @export
 */
tutao.tutanota.Bootstrap.initControllers = function () {
    tutao.crypto.ClientWorkerProxy.initWorkerFileNames('/libs/internal/', '/libs/external/');
    var singletons = {
        // @type {tutao.crypto.SjclRandomizer}
        randomizer: tutao.crypto.SjclRandomizer,
        // @type {tutao.crypto.AesWorkerProxy}
        aesCrypter: tutao.crypto.AesWorkerProxy,
        // @type {tutao.crypto.RsaWorkerProxy}
        rsaCrypter: tutao.crypto.RsaWorkerProxy,
        // @type {tutao.crypto.JBCryptAdapter}
        kdfCrypter: tutao.crypto.JBCryptAdapter,
        // @type {tutao.crypto.SjclSha256}
        shaCrypter: tutao.crypto.SjclSha256,
        // @type {tutao.ctrl.UserController}
        userController: tutao.ctrl.UserController,
        // @type {tutao.crypto.ClientWorkerProxy}
        clientWorkerProxy: tutao.crypto.ClientWorkerProxy,
        // @type {tutao.db.WebSqlDb}
        dao: tutao.db.WebSqlDb,
        // @type {tutao.rest.RestClient}
        restClient: tutao.rest.RestClient,
        // @type {tutao.rest.EntityRestClient}
        entityRestClient: tutao.rest.EntityRestClient,
        // @type {tutao.tutanota.index.Indexer}
        indexer: tutao.tutanota.index.Indexer,
        // @type {tutao.tutanota.ctrl.MailBoxController}
        mailBoxController: tutao.tutanota.ctrl.MailBoxController,
        // @type {tutao.tutanota.ctrl.ViewManager}
        viewManager: tutao.tutanota.ctrl.ViewManager,
        // @type {tutao.tutanota.ctrl.LoginViewModel}
        loginViewModel: tutao.tutanota.ctrl.LoginViewModel,
        // @type {tutao.tutanota.ctrl.ExternalLoginViewModel}
        externalLoginViewModel: tutao.tutanota.ctrl.ExternalLoginViewModel,
        // @type {tutao.tutanota.ctrl.TagListViewModel}
        tagListViewModel: tutao.tutanota.ctrl.TagListViewModel,
        // @type {tutao.tutanota.ctrl.MailListViewModel}
        mailListViewModel: tutao.tutanota.ctrl.MailListViewModel,
        // @type {tutao.tutanota.ctrl.MailViewModel}
        mailViewModel: tutao.tutanota.ctrl.MailViewModel,
        // @type {tutao.tutanota.ctrl.PasswordChannelViewModel}
        passwordChannelViewModel: tutao.tutanota.ctrl.PasswordChannelViewModel,
        // @type {tutao.tutanota.ctrl.ContactListViewModel}
        contactListViewModel: tutao.tutanota.ctrl.ContactListViewModel,
        // @type {tutao.tutanota.ctrl.ContactViewModel}
        contactViewModel: tutao.tutanota.ctrl.ContactViewModel,
        // @type {tutao.tutanota.ctrl.FeedbackViewModel}
        feedbackViewModel: tutao.tutanota.ctrl.FeedbackViewModel,
        // @type {tutao.tutanota.ctrl.FontViewModel}
        fontViewModel: tutao.tutanota.ctrl.FontViewModel,
        // @type {tutao.tutanota.ctrl.ThemeViewModel}
        themeViewModel: tutao.tutanota.ctrl.ThemeViewModel,
        // @type {tutao.tutanota.gui.LoginView}
        loginView: tutao.tutanota.gui.LoginView,
        // @type {tutao.tutanota.gui.ExternalLoginView}
        externalLoginView: tutao.tutanota.gui.ExternalLoginView,
        // @type {tutao.tutanota.gui.LoginView}
        notFoundView: tutao.tutanota.gui.LoginView,
        // @type {tutao.tutanota.gui.MailView}
        mailView: tutao.tutanota.gui.MailView,
        // @type {tutao.tutanota.gui.ContactView}
        contactView: tutao.tutanota.gui.ContactView,
        // @type {tutao.tutanota.gui.FastMessageView}
        fastMessageView: tutao.tutanota.gui.FastMessageView,
        // @type {tutao.tutanota.gui.NotSupportedView}
        notSupportedView: tutao.tutanota.gui.NotSupportedView,
        // @type {tutao.tutanota.gui.RegistrationVerifyDomainView}
        registrationVerifyDomainView: tutao.tutanota.gui.RegistrationVerifyDomainView,
        // @type {tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel}
        registrationVerifyDomainViewModel: tutao.tutanota.ctrl.RegistrationVerifyDomainViewModel,
        // @type {tutao.tutanota.gui.RegistrationView}
        registrationView: tutao.tutanota.gui.RegistrationView,
        // @type {tutao.tutanota.ctrl.RegistrationViewModel}
        registrationViewModel: tutao.tutanota.ctrl.RegistrationViewModel,
        // @type {tutao.tutanota.gui.LogView}
        logView: tutao.tutanota.gui.LogView,
        // @type {tutao.tutanota.ctrl.LogViewModel}
        logViewModel: tutao.tutanota.ctrl.LogViewModel,
        // @type {tutao.tutanota.gui.DbView}
        dbView: tutao.tutanota.gui.DbView,
        // @type {tutao.tutanota.ctrl.DbViewModel}
        dbViewModel: tutao.tutanota.ctrl.DbViewModel,
        // @type {tutao.tutanota.gui.MonitorView}
        monitorView: tutao.tutanota.gui.MonitorView,
        // @type {tutao.tutanota.ctrl.MonitorViewModel}
        monitorViewModel: tutao.tutanota.ctrl.MonitorViewModel,
        // @type {tutao.tutanota.gui.ConfigView}
        configView: tutao.tutanota.gui.ConfigView,
        // @type {tutao.tutanota.ctrl.ConfigViewModel}
        configViewModel: tutao.tutanota.ctrl.ConfigViewModel,
        // @type {tutao.tutanota.gui.CustomerView}
        customerView: tutao.tutanota.gui.CustomerView,
        // @type {tutao.tutanota.ctrl.CustomerViewModel}
        customerViewModel: tutao.tutanota.ctrl.CustomerViewModel,
        // @type {tutao.tutanota.gui.SettingsView}
        settingsView: tutao.tutanota.gui.SettingsView,
        // @type {tutao.tutanota.ctrl.SettingsViewModel}
        settingsViewModel: tutao.tutanota.ctrl.SettingsViewModel,
        // @type {tutao.crypto.EntropyCollector}
        entropyCollector: tutao.crypto.EntropyCollector,
        // @type {tutao.tutanota.security.CajaSanitizer}
        htmlSanitizer: tutao.tutanota.security.CajaSanitizer,
        // @type {tutao.tutanota.ctrl.LanguageViewModel}
        languageViewModel: tutao.tutanota.ctrl.LanguageViewModel,
        // @type {tutao.event.EventBusClient}
        eventBus: tutao.event.EventBusClient,
        // @type {tutao.tutanota.ctrl.FileViewModel}
        fileViewModel: tutao.tutanota.ctrl.FileViewModel,
        // @type {tutao.tutanota.gui.FileView}
        fileView: tutao.tutanota.gui.FileView,
        // @type {tutao.tutanota.ctrl.Navigator}
        navigator: tutao.tutanota.ctrl.Navigator,
        // @type {tutao.tutanota.ctrl.LegacyDownloadViewModel}
        legacyDownloadViewModel: tutao.tutanota.ctrl.LegacyDownloadViewModel
    };

    if (tutao.tutanota.util.ClientDetector.isTouchSupported()) {
        singletons['swipeRecognizer'] = tutao.tutanota.ctrl.SwipeRecognizer;
    }
    tutao.tutanota.legacy.Legacy.setup(singletons);

    tutao.locator = new tutao.Locator(singletons);

    // shortcuts
    tutao.lang = tutao.locator.languageViewModel.get;

    if (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE) {
        var viewport = document.querySelector("meta[name=viewport]");
        viewport.setAttribute('content', 'initial-scale=0.85, maximum-scale=0.85, user-scalable=no');
    }

    if (!tutao.locator.dao.isSupported() || tutao.tutanota.util.ClientDetector.isTouchSupported()) {
        tutao.locator.replace('dao', new tutao.db.DummyDb);
    }

    // add a cache to the rest entity chain
    var cache = new tutao.rest.EntityRestCache();
    cache.setTarget(tutao.locator.entityRestClient);
    tutao.locator.replace('entityRestClient', cache);

    if (tutao.locator.swipeRecognizer) {
        tutao.locator.swipeRecognizer.setScreenSize(tutao.tutanota.gui.getWindowWidth(), tutao.tutanota.gui.getWindowHeight());
        tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_IN, function () {
            tutao.locator.viewManager.getActiveView().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_IN);
        });
        tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_OUT, function () {
            tutao.locator.viewManager.getActiveView().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_OUT);
        });
        tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_IN, function () {
            tutao.locator.viewManager.getActiveView().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_IN);
        });
        tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_OUT, function () {
            tutao.locator.viewManager.getActiveView().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_OUT);
        });
    }

    tutao.tutanota.gui.initEvents();

    var external = tutao.util.StringUtils.startsWith(location.hash, "#mail");
    tutao.locator.viewManager.init([tutao.locator.registrationView, tutao.locator.loginView, tutao.locator.mailView, tutao.locator.contactView, tutao.locator.fileView, tutao.locator.externalLoginView, tutao.locator.notSupportedView, tutao.locator.logView, tutao.locator.dbView, tutao.locator.monitorView, tutao.locator.configView, tutao.locator.settingsView, tutao.locator.customerView], external);

    tutao.tutanota.gui.addWindowResizeListener(function (width, height) {
        // notify the active view and the swipe recognizer
        if (tutao.locator.viewManager.getActiveView() != null) {
            tutao.locator.viewManager.getActiveView().windowSizeChanged(width, height);
        }
        if (tutao.locator.swipeRecognizer) {
            tutao.locator.swipeRecognizer.setScreenSize(width, height);
        }
    });
};

/* html code for file menu icon
 <li>
 <div class="menu_link" data-bind="fastClick: function(data, event) { setTimeout(function() { select(tutao.locator.fileView); }, 0); }">
 <!-- ko if: getActiveView() == tutao.locator.fileView -->
 <div class="menu_image"><div class="file-new" data-bind="attr: {title: tutao.lang('newFolder_alt')}"></div></div>
 <div class="menu_text" data-bind="lang: 'new_label'"></div>
 <!-- /ko -->
 <!-- ko ifnot: getActiveView() == tutao.locator.fileView -->
 <div class="menu_image"><div class="file" data-bind="attr: {title: tutao.lang('files_alt')}"></div></div>
 <div class="menu_text" data-bind="lang: 'files_label'"></div>
 <!-- /ko -->
 </div>
 </li>*/
