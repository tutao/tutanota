"use strict";

goog.provide('tutao.locator');
goog.provide("tutao.tutanota.Bootstrap");

/**
 * Executes all initializations needed for the live one-and-only tutanota website.
 * This binding is located in gui, so that it is not used for unit or integration tests.
 */
tutao.tutanota.Bootstrap.init = function() {
	if (window.applicationCache) {
	    window.applicationCache.addEventListener('updateready', function(e) {
		    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
		        // Browser downloaded a new app cache: We have to reload the page in order to get the new contents
		        window.applicationCache.swapCache();
		        window.location.reload();
		        console.log("updated to current release");
		    }
	    }, false);
	}
	
	// disable all registered event handlers on the document and the window
	$(document).off();
	$(window).off();

	if (tutao.tutanota.util.ClientDetector.isSupported()) {
		$(window).unload(function() {
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
	setTimeout(function() {
		tutao.locator.navigator.setup();
		tutao.locator.entropyCollector.start();
		
	});

		// only for testing
		tutao.locator.loginViewModel.mailAddress("premium-admin@tutanota.de");
		tutao.locator.loginViewModel.passphrase("premiumAdminPw");
		tutao.locator.loginViewModel.login(function() {
			tutao.locator.navigator.settings();
			//tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_USER_LIST);
//			tutao.locator.navigator.customer();
//			tutao.locator.viewManager.select(tutao.locator.contactView);
//			tutao.locator.contactListViewModel.contactsInitializedCallback.push(function() {
//				tutao.locator.contactViewModel.showContact(tutao.locator.contactListViewModel.contacts()[2]());
//				tutao.locator.contactViewModel.editContact();
//			});
		});
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
tutao.tutanota.Bootstrap.initControllers = function() {
	tutao.crypto.ClientWorkerProxy.initWorkerFileNames('/libs/internal/', '/libs/external/');
	var singletons = {
			randomizer: tutao.crypto.SjclRandomizer,
			aesCrypter: tutao.crypto.AesWorkerProxy,
			rsaCrypter: tutao.crypto.RsaWorkerProxy,
			kdfCrypter: tutao.crypto.JBCryptAdapter,
			shaCrypter: tutao.crypto.SjclSha256,
			userController: tutao.ctrl.UserController,
			clientWorkerProxy: tutao.crypto.ClientWorkerProxy,
			dao: tutao.db.WebSqlDb,
			restClient: tutao.rest.RestClient,
			entityRestClient: tutao.rest.EntityRestClient,
			indexer: tutao.tutanota.index.Indexer,
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
			fontViewModel: tutao.tutanota.ctrl.FontViewModel,
			themeViewModel: tutao.tutanota.ctrl.ThemeViewModel,
			loginView: tutao.tutanota.gui.LoginView,
			externalLoginView: tutao.tutanota.gui.ExternalLoginView,
			notFoundView: tutao.tutanota.gui.LoginView,
			mailView: tutao.tutanota.gui.MailView,
			contactView: tutao.tutanota.gui.ContactView,
			fastMessageView: tutao.tutanota.gui.FastMessageView,
			notSupportedView: tutao.tutanota.gui.NotSupportedView,
			registrationView: tutao.tutanota.gui.RegistrationView,
			registrationViewModel: tutao.tutanota.ctrl.RegistrationViewModel,
			logView: tutao.tutanota.gui.LogView,
			logViewModel: tutao.tutanota.ctrl.LogViewModel,
			dbView: tutao.tutanota.gui.DbView,
			dbViewModel: tutao.tutanota.ctrl.DbViewModel,
			monitorView: tutao.tutanota.gui.MonitorView,
			monitorViewModel: tutao.tutanota.ctrl.MonitorViewModel,
			configView: tutao.tutanota.gui.ConfigView,
			configViewModel: tutao.tutanota.ctrl.ConfigViewModel,
			customerView: tutao.tutanota.gui.CustomerView,
			customerViewModel: tutao.tutanota.ctrl.CustomerViewModel,
			settingsView: tutao.tutanota.gui.SettingsView,
            // @type {tutao.tutanota.ctrl.SettingsViewModel}
			settingsViewModel: tutao.tutanota.ctrl.SettingsViewModel,
			entropyCollector: tutao.crypto.EntropyCollector,
			htmlSanitizer: tutao.tutanota.security.CajaSanitizer,
			languageViewModel: tutao.tutanota.ctrl.LanguageViewModel,
			eventBus: tutao.event.EventBusClient,
			fileViewModel: tutao.tutanota.ctrl.FileViewModel,
			fileView: tutao.tutanota.gui.FileView,
			navigator: tutao.tutanota.ctrl.Navigator
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
		tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_IN, function() {
			tutao.locator.viewManager.getActiveView().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_IN);
		});
		tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_OUT, function() {
			tutao.locator.viewManager.getActiveView().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_LEFT_OUT);
		});
		tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_IN, function() {
			tutao.locator.viewManager.getActiveView().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_IN);
		});
		tutao.locator.swipeRecognizer.addSwipeListener(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_OUT, function() {
			tutao.locator.viewManager.getActiveView().swipeRecognized(tutao.tutanota.ctrl.SwipeRecognizer.TYPE_RIGHT_OUT);
		});
	}

	tutao.tutanota.gui.initEvents();

	var external = tutao.util.StringUtils.startsWith(location.hash, "#mail");
	tutao.locator.viewManager.init([tutao.locator.registrationView, tutao.locator.loginView, tutao.locator.mailView, tutao.locator.contactView, tutao.locator.fileView, tutao.locator.externalLoginView, tutao.locator.notSupportedView, tutao.locator.logView, tutao.locator.dbView, tutao.locator.monitorView, tutao.locator.configView, tutao.locator.settingsView, tutao.locator.customerView], external);

	tutao.tutanota.gui.addWindowResizeListener(function(width, height) {
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
