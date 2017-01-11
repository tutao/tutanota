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
		
		
		
        if (tutao.tutanota.util.ClientDetector.isSupported()) {
            $(window).unload(function () {
                tutao.locator.eventBus.close(); // close the socket in non legacy-mode
            });
        }

        if (tutao.locator && tutao.locator.eventBus) {
            tutao.locator.eventBus.close();
        }

        tutao.tutanota.Bootstrap.initControllers();
        try {
            Promise.longStackTraces();
        } catch (e) {
            console.log("error calling Promise.longStackTraces()", e);
        }
        Promise.onPossiblyUnhandledRejection(function (e) {
            if (e instanceof tutao.ConnectionError) {
                var checkForMaintenance = function () {
                    var img = document.createElement("img");
                    img.onload = function() {
                        tutao.tutanota.gui.alert(tutao.lang("serverDownForMaintenance_msg"));
                    };
                    img.onerror = function() {
                        tutao.tutanota.gui.alert(tutao.lang("serverNotReachable_msg"));
                    };
                    img.src = "https://tutanota.com/images/maintenancecheck.png";
                };
                checkForMaintenance();
            } else if (e instanceof  tutao.InvalidSoftwareVersionError) {
                tutao.tutanota.gui.alert(tutao.lang("outdatedClient_msg"));
            } else if (e instanceof  tutao.InsufficientStorageError) {
                if (tutao.locator.userController.isLoggedInUserAdmin()) {
                    tutao.tutanota.gui.alert(tutao.lang("insufficientStorageAdmin_msg")).then(function(){
                        tutao.locator.navigator.settings();
                        tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_STORAGE);

                    });
                } else {
                    tutao.tutanota.gui.alert(tutao.lang("insufficientStorageUser_msg"));
                }
            } else {
                if (tutao.locator.viewManager.feedbackSupported()) {
                    // only logged in users can report errors
                    tutao.locator.feedbackViewModel.open(e);
                } else {
                    tutao.tutanota.gui.alert(tutao.lang("unknownError_msg"));
                }
            }
            if (e.stack) {
                console.log("error:" + e.stack);
            } else {
                console.log("error: " + e);
            }

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

        if (tutao.env.mode == tutao.Mode.App) {
            // open links in default browser on mobile devices. Requires cordova plugin org.apache.cordova.inappbrowser
            // do not register the click event for Tutanota in normal browsers, because it can not add "noopener" to the "rel" tag and setting it in the new opened window with JS does not work in Safari. See https://dev.to/ben/the-targetblank-vulnerability-by-example
            $(document).on("click", "a", function (e) {
                tutao.tutanota.gui.openLink(this.href);
                return false;
            });

			if (cordova.platformId == "android") {
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
            // listener to get notified when the app returns to foreground.
            document.addEventListener("resume", function(){
                tutao.locator.eventBus.tryReconnect();
            }, false);
			
			
			if (cordova.platformId == "ios") {
				// Workaround for making the cursor position always visible for text editing.
				// Ensure that the html navigation bar is always enabled. otherwise it is not clear how to close the keyboard.
				cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
				
				// To be able to set an absolute body height
				cordova.plugins.Keyboard.disableScroll(true);
				
				var keyBoardOpenEvent = false;
				var keyBoardOpenBodyHeight = 0;
				var buttonBars = null;
				var disabledButtonBarHeight = 0; 
				
				
				// remove the keyboard handlers before adding them again. otherwise the handlers are registered twice during log out.
				if (tutao.tutanota.Bootstrap.keyboardShowHandler){
					window.removeEventListener('native.keyboardshow', tutao.tutanota.Bootstrap.keyboardShowHandler);
				}
				
				if (tutao.tutanota.Bootstrap.keyboardHideHandler){
					window.removeEventListener('native.keyboardhide', tutao.tutanota.Bootstrap.keyboardHideHandler);
				}
				
				tutao.tutanota.Bootstrap.keyboardShowHandler = function (event){
					keyBoardOpenEvent = true;
					var element = $("body");
					var windowHeight = $(window).height();				
					if (!buttonBars){
						var visibleButtonBars = $(".buttonBar:visible");
						// on mobile devices add the size of the button bar to the body size. this hides the button bar under the html navigation bar to save space.
						// if it is not a mobile device the button bar is not at the bottom so there is no need to hide it.
						if (visibleButtonBars.length > 0 && !tutao.tutanota.gui.isDesktopLayout()){
							buttonBars = visibleButtonBars;			
							disabledButtonBarHeight = buttonBars.outerHeight(); // outer height includes 1px border
							buttonBars.hide();
						} else {
							disabledButtonBarHeight = 0;
						}				
					}	
					
					// By default the new body size is window height - keyboad height.
					keyBoardOpenBodyHeight = windowHeight - event.keyboardHeight + disabledButtonBarHeight;
					// Set an absolute body height to make the body end at the keyboard top.								
					setTimeout(function(){
						if ( element.height() != keyBoardOpenBodyHeight){
							//element.velocity({height: keyBoardOpenBodyHeight + "px"}, { duration: 0 });
							element.css({height: keyBoardOpenBodyHeight + "px"});
						}	
					}, 200);
					
				};

				tutao.tutanota.Bootstrap.keyboardHideHandler  = function (event){
					var element = $("body");
					keyBoardOpenEvent = false;
					// avoid clipping of the button bar when switching between input fields. restore the original height first.
					//element.velocity({height: "100%"}, { duration: 0 });
					element.css({height: "100%"});
					// when switching between input fields the keyboard does not hide, but the event native.keyboardehide fires.
					// check this case in a setTimeout call and restore the keyBoardOpenBodyHeight.
					setTimeout(function(){
						if (keyBoardOpenEvent){
							//element.velocity({height: keyBoardOpenBodyHeight + "px"}, { duration: 0 });
							element.css({height: keyBoardOpenBodyHeight + "px"});
					    } else {
					    	if (buttonBars != null){					    	
					 			buttonBars.show();
					 			buttonBars = null;
					    	}
					    }
					}, 200);
				}
		
				window.addEventListener('native.keyboardshow', tutao.tutanota.Bootstrap.keyboardShowHandler);				
				window.addEventListener('native.keyboardhide', tutao.tutanota.Bootstrap.keyboardHideHandler);
				
				
				StatusBar.styleDefault();
				StatusBar.backgroundColorByHexString('#f8f8f8');				
				StatusBar.overlaysWebView(false);
			}
        }

        // try reconnect the websocket as soon as the network state is online
        window.addEventListener('online',  function(event) {
            console.log("network online");
            tutao.locator.eventBus.tryReconnect();
        });

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
        }, false);
    } else {
        $(document).ready(launch);
    }
};

/**
 * May be overwritten by other clients.
 */
tutao.tutanota.Bootstrap.initLocator = function() {
    tutao.native.CryptoBrowser.initWorkerFileNames("");

    operative.setSelfURL("operative-0.3.1.js");

    //override native implementation with device specific one, if available
    var cryptoImpl = tutao.native.CryptoBrowser;
    var phoneImpl = tutao.native.Phone;
    var notificationImpl = tutao.native.NotificationBrowser;
    var contactImpl = tutao.native.ContactBrowser;
    var fileFacadeImpl = tutao.native.FileFacadeBrowser;
    var configFacadeImpl = tutao.native.ConfigBrowser;
    var pushServiceFacadeImpl = tutao.native.PushServiceBrowser;

    if (tutao.env.mode == tutao.Mode.App) {
        console.log("overriding native interfaces");
        cryptoImpl = tutao.native.device.Crypto;
        phoneImpl = tutao.native.device.Phone;
        notificationImpl = tutao.native.NotificationApp;
        contactImpl = tutao.native.ContactApp;
		fileFacadeImpl = tutao.native.FileFacadeApp;
		if (cordova.platformId == "android") {
            configFacadeImpl = tutao.native.ConfigApp;
        }
        pushServiceFacadeImpl = tutao.native.PushServiceApp;
    }

    var singletons = {
        crypto: cryptoImpl,
        phone: phoneImpl,
        notification: notificationImpl,
        contacts: contactImpl,
        fileFacade: fileFacadeImpl,
        configFacade: configFacadeImpl,
        pushService: pushServiceFacadeImpl,

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
        mailFolderListViewModel: tutao.tutanota.ctrl.MailFolderListViewModel,
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
        modalDialogViewModel: tutao.tutanota.ctrl.ModalDialogViewModel,
        folderNameDialogViewModel: tutao.tutanota.ctrl.FolderNameDialogViewModel,
        eventListenerManager: tutao.util.EventListenerManager,
        buyDialogViewModel: tutao.tutanota.ctrl.BuyDialogViewModel,
        termsAndConditionsDialogViewModel: tutao.tutanota.ctrl.TermsAndConditionsDialogViewModel,
        inboxRulesViewModel: tutao.tutanota.ctrl.InboxRulesSettingsViewModel,
        keyManager: tutao.tutanota.util.KeyManager
    };

    tutao.tutanota.legacy.Legacy.setup(singletons);

    // @type {tutao.Locator}
    tutao.locator = new tutao.Locator(singletons);

    // add a cache to the rest entity chain
    var cache = new tutao.rest.EntityRestCache();
    cache.setTarget(tutao.locator.entityRestClient);
    tutao.locator.replace('entityRestClient', cache);

    var external = tutao.util.StringUtils.startsWith(location.hash, "#mail");
    tutao.locator.viewManager.init(external);

    tutao.locator.mailFolderListViewModel.init();
    tutao.locator.mailListViewModel.init();
    tutao.locator.mailViewModel.init();
    tutao.locator.contactListViewModel.initButtonBar();
    tutao.locator.contactViewModel.initButtonBar();
    tutao.locator.keyManager.init();
};

tutao.tutanota.Bootstrap.initControllers = function () {
    tutao.tutanota.Bootstrap.initLocator();

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

    tutao.tutanota.gui.initEvents();

    tutao.tutanota.gui.addWindowResizeListener(function (width, height) {
        // notify the view manager and the swipe recognizer
        if (tutao.locator.viewManager.getActiveView() != null) {
            tutao.locator.viewManager.getActiveView().getSwipeSlider().windowSizeChanged(width, height);
        }
    });
};
