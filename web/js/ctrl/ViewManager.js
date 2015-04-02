"use strict";

tutao.provide('tutao.tutanota.ctrl.ViewManager');

/**
 * The ViewManager is responsible for activating and deactivating views.
 *
 * @constructor
 */
tutao.tutanota.ctrl.ViewManager = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	var self = this;

	// tutao.tutanota.ctrl.View
	this._activeView = ko.observable(new tutao.tutanota.gui.NotFoundView()); // just a dummy view because null must be avoided
	this._internalUserLoggedIn = ko.observable(false);
	this._externalUserLoggedIn = ko.observable(false);
	this._bigWindowWidth = ko.observable(tutao.tutanota.gui.getWindowWidth() >= 480);
    this.windowWidthObservable = ko.observable(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
    this.headerBarViewModel = null;

	// if the window width is small, just show the logo without "Tutanota" to save space
	tutao.tutanota.gui.addWindowResizeListener(function(width, height) {
		self._bigWindowWidth(tutao.tutanota.gui.getWindowWidth() >= 480);
        self.windowWidthObservable(width);
	});
	this._buttons = [];
    this.currentColumnTitle = ko.observable("");
    this.previousColumnTitle = ko.observable("");

    this.externalUserWelcomeMessage = ko.observable("");

    this.buttonWithSubButtons = ko.observable(); // is set by the button whose sub-buttons shall be shown
};



tutao.tutanota.ctrl.ViewManager.prototype.getLoggedInUserAccountType = function(){
    if ( this._internalUserLoggedIn() || this._externalUserLoggedIn()){
        return tutao.locator.userController.getLoggedInUser().getAccountType();
    }
    return null;
};

/**
 * @return {Array.<tutao.tutanota.ctrl.View>} views All the views of this ViewManager.
 */
tutao.tutanota.ctrl.ViewManager.prototype.getViews = function() {
    return [tutao.locator.registrationView, tutao.locator.loginView, tutao.locator.mailView, tutao.locator.contactView, tutao.locator.fileView, tutao.locator.externalLoginView, tutao.locator.notSupportedView, tutao.locator.settingsView,tutao.locator.registrationVerifyDomainView];
};

/**
 * @return {Array.<tutao.tutanota.ctrl.Button>} views The buttons of the navigation bar.
 */
tutao.tutanota.ctrl.ViewManager.prototype._createButtons = function() {
    var self = this;
    var buttons = [
        // internalUsers
        new tutao.tutanota.ctrl.Button('emails_label', 30, tutao.locator.navigator.mail, self.isInternalUserLoggedIn, false, "menu_mail", "mail", 'emails_alt', function () {
            return tutao.locator.navigator.hash() == '#box';
        }),
        new tutao.tutanota.ctrl.Button('contacts_label', 29, tutao.locator.navigator.contact, self.isInternalUserLoggedIn, false, "menu_contact", "contact", 'contacts_alt', function () {
            return tutao.locator.navigator.hash() == '#contact';
        }),

        new tutao.tutanota.ctrl.Button('invite_label', 28, function() {
            tutao.locator.navigator.newMail().then(function (success) {
                if (success) {
                    var mail = tutao.locator.mailViewModel.getComposingMail();
                    mail.composerSubject(tutao.locator.languageViewModel.get("invitationMailSubject_msg"));
                    mail.confidentialButtonSecure(false);
                    var username = tutao.locator.userController.getUserGroupInfo().getName();
                    tutao.locator.mailView.setComposingBody(tutao.locator.htmlSanitizer.sanitize(tutao.locator.languageViewModel.get("invitationMailBody_msg", {'{1}': username}), true).text);
                }
            });

        }, self.isInternalUserLoggedIn, false, "menu_invite", "invite", 'invite_alt'),

        new tutao.tutanota.ctrl.Button('settings_label', 27, tutao.locator.navigator.settings, self.isInternalUserLoggedIn, false, "menu_settings", "settings", 'settings_alt', function () {
            return tutao.locator.navigator.hash() == '#settings';
        }),

        // external users
        new tutao.tutanota.ctrl.Button('register_label', 27, function () {
            tutao.tutanota.gui.openLink("https://app.tutanota.de/#register");
        }, self._externalUserLoggedIn, true, "menu_register", "register", 'register_alt'), // Execute this action direct to avoid pop up blockers

        // all supported
        new tutao.tutanota.ctrl.Button('community_label', 26, function () {
            tutao.tutanota.gui.openLink("https://tutanota.com/community");
        }, this.feedbackSupported, true, "menu_community", "heart", 'community_label'), // Execute this action direct to avoid pop up blockers

        // all logged in
        new tutao.tutanota.ctrl.Button('logout_label', 25, function () {
            tutao.locator.navigator.logout(false, true);
        }, self.isUserLoggedIn, false, "menu_logout", "logout", 'logout_alt')

        // all logged in
        // Just for local testing on mobile devices
        /*new tutao.tutanota.ctrl.Button('dev_label', 25, function () {
            tutao.locator.developerViewModel.open();
        }, function() {
            return tutao.env.type == tutao.Env.LOCAL || tutao.env.type == tutao.Env.LOCAL_COMPILED;
        }, false, "menu_dev", "star", 'dev_label'),*/
    ];

    return buttons;
};

/**
 * Initializes the ViewManager and all views.
 * @param {Boolean} external True if the views shall be loaded for an external user, false for an internal user.
 */
tutao.tutanota.ctrl.ViewManager.prototype.init = function(external) {
    var views = this.getViews();
	for (var i = 0; i < views.length; i++) {
		views[i].init(external, this._updateColumnTitle);
	}

    var self = this;


    this._buttons = this._createButtons();
    var getRightNavbarSize = function () {
        return $(document.getElementById("right-navbar")).innerWidth();
    };
    this.headerBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(this._buttons, "more_label", tutao.tutanota.gui.measureNavBarEntry);
    setTimeout(function () {
        self.headerBarViewModel.setButtonBarWidth(getRightNavbarSize());
    }, 0);
    this.windowWidthObservable.subscribe(function () {
        self.headerBarViewModel.setButtonBarWidth(getRightNavbarSize());
    });
};

tutao.tutanota.ctrl.ViewManager.prototype.getButtons = function() {
    return this._buttons;
};

tutao.tutanota.ctrl.ViewManager.prototype.feedbackSupported = function() {
    if (this.isUserLoggedIn()) {
        return tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED || tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_SAFARI ;
    } else {
        return false;
    }
};

/**
 * Switches to another view
 * @param {tutao.tutanota.ctrl.View} view The view to display.
 * @param {Object=} params The parameters to provide to the view.
 */
tutao.tutanota.ctrl.ViewManager.prototype.select = function(view, params) {
	if (view.isForInternalUserOnly() && !tutao.locator.userController.isInternalUserLoggedIn()) {
		return;
	}
	if (this._activeView() !== view) { // only switch, if another view should be shown
		if (this._activeView() != null) {
			this._activeView().deactivate();
		}
		if (tutao.locator.userController.isInternalUserLoggedIn()) {
			this._internalUserLoggedIn(true);
		} else if (tutao.locator.userController.isExternalUserLoggedIn()) {
			this._externalUserLoggedIn(true);
		}
        this._activeView(view);
        view.activate(params);
        tutao.tutanota.gui.adjustPanelHeight();
	}
};

/**
 * @return {tutao.tutanota.ctrl.View} the currently active view.
 */
tutao.tutanota.ctrl.ViewManager.prototype.getActiveView = function() {
	return this._activeView();
};

/**
 * @return {boolean} true, if the user is already logged in, false otherwise.
 */
tutao.tutanota.ctrl.ViewManager.prototype.isUserLoggedIn = function() {
	return (this._internalUserLoggedIn() || this._externalUserLoggedIn() || tutao.locator.loginViewModel.loginFinished());
};

/**
 * @return {boolean} true, if an internal user is already logged in, false otherwise.
 */
tutao.tutanota.ctrl.ViewManager.prototype.isInternalUserLoggedIn = function() {
	return this._internalUserLoggedIn() || tutao.locator.loginViewModel.loginFinished();
};

/**
 * Shows the home view (which is currently the mail view).
 */
tutao.tutanota.ctrl.ViewManager.prototype.showHomeView = function() {
	if (this.isInternalUserLoggedIn() && this.getActiveView() != tutao.locator.mailView) {
		this.select(tutao.locator.mailView);
	}
};


tutao.tutanota.ctrl.ViewManager.prototype.windowSizeChanged = function(width, height) {
    if (this.getActiveView() != null) {
        this.getActiveView().getSwipeSlider().windowSizeChanged(width, height);
    }
};

tutao.tutanota.ctrl.ViewManager.prototype._updateColumnTitle = function(currentTitle, previousTitle) {

    if (!currentTitle) {
        currentTitle = "";
    }
    if (!previousTitle) {
        previousTitle = tutao.lang("back_action");
    }

    if (!this.getActiveView().isShowLeftNeighbourColumnPossible()) {
        previousTitle = "";
    }

    this.currentColumnTitle(currentTitle);
    this.previousColumnTitle(previousTitle);
};
