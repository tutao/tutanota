"use strict";

goog.provide('tutao.tutanota.ctrl.ViewManager');

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
    this.windowWidthObservable = ko.observable(0);
    this.headerBarViewModel = null;

	// if the window width is small, just show the logo without "Tutanota" to save space
	tutao.tutanota.gui.addWindowResizeListener(function(width, height) {
		self._bigWindowWidth(tutao.tutanota.gui.getWindowWidth() >= 480);
        self.windowWidthObservable(width);
	});

};



tutao.tutanota.ctrl.ViewManager.prototype.getLoggedInUserAccountType = function(){
    if ( this._internalUserLoggedIn() || this._externalUserLoggedIn()){
        return tutao.locator.userController.getLoggedInUser().getAccountType();
    }
    return null;
};


/**
 * Initializes the ViewManager and all views.
 * @param {Array.<tutao.tutanota.ctrl.View>} views All the views this ViewManager shall handle.
 * @param {Boolean} external True if the views shall be loaded for an external user, false for an internal user.
 */
tutao.tutanota.ctrl.ViewManager.prototype.init = function(views, external) {
	for (var i = 0; i < views.length; i++) {
		views[i].init(external);
	}

    var self = this;

    // If these widths are changed, we have to update them in header.less, too.
    var menuItemWidth = 80;
    var menuItemWidthSmall= 45;
    var measureNavButton = function() {
        if (window.innerWidth >= 720) {
            return menuItemWidth;
        } else {
            return menuItemWidthSmall;
        }
    };
    var adminViewVisible = function() {
        return self.getActiveView() == tutao.locator.dbView || self.getActiveView() == tutao.locator.monitorView || self.getActiveView() == tutao.locator.logView  || self.getActiveView() == tutao.locator.configView  || self.getActiveView() == tutao.locator.customerView;
    };
    var nonStarterUser = function() {
        if (tutao.locator.userController.getLoggedInUser()) {
            return tutao.locator.userController.getLoggedInUser().getAccountType() != tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER;
        } else {
            return false;
        }
    }
    var feedbackSupported = function() {
        if (tutao.locator.userController.getLoggedInUser()) {
            return tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_SUPPORTED || tutao.tutanota.util.ClientDetector.getSupportedType() == tutao.tutanota.util.ClientDetector.SUPPORTED_TYPE_LEGACY_SAFARI;
        } else {
            return false;
        }
    }
    var buttons = [
        // admin
        new tutao.tutanota.ctrl.Button("logs_label", 40, tutao.locator.navigator.logs, adminViewVisible, false, "menu_logs", "search"),
        new tutao.tutanota.ctrl.Button("db_label", 41, tutao.locator.navigator.db, adminViewVisible, false, "menu_db", "search"),
        new tutao.tutanota.ctrl.Button("monitor_label", 42, tutao.locator.navigator.monitor, adminViewVisible, false, "menu_monitor", "search"),
        new tutao.tutanota.ctrl.Button("config_label", 43, tutao.locator.navigator.config, adminViewVisible, false, "menu_config", "search"),
        new tutao.tutanota.ctrl.Button("customers_label", 44, tutao.locator.navigator.customer, adminViewVisible, false, "menu_customers", "search"),

        // internalUsers
        new tutao.tutanota.ctrl.Button('new_label', 30, tutao.locator.navigator.newMail, function () {
            return nonStarterUser() && self.getActiveView() == tutao.locator.mailView;
        }, false, "menu_mail_new", "mail-new", 'newMail_alt'),
        new tutao.tutanota.ctrl.Button('emails_label', 30, tutao.locator.navigator.mail, function () {
            return nonStarterUser() && self.getActiveView() != tutao.locator.mailView;
        }, false, "menu_mail", "mail", 'emails_alt'),

        new tutao.tutanota.ctrl.Button('new_label', 29, tutao.locator.navigator.newContact, function () {
            return nonStarterUser() && self.getActiveView() == tutao.locator.contactView;
        }, false, "menu_contact_new", "contact-new", 'newContact_alt'),
        new tutao.tutanota.ctrl.Button('contacts_label', 29, tutao.locator.navigator.contact, function () {
            return nonStarterUser() && self.getActiveView() != tutao.locator.contactView;
        }, false, "menu_contact", "contact", 'contacts_alt'),

        new tutao.tutanota.ctrl.Button('settings_label', 28, tutao.locator.navigator.settings, self.isInternalUserLoggedIn, false, "menu_settings", "settings", 'settings_alt'),


        new tutao.tutanota.ctrl.Button('invite_label', 27, function() {
            tutao.tutanota.ctrl.Navigator.prototype.newMail();
            //
            var mail = tutao.locator.mailViewModel.getComposingMail();
            mail.secure(false);
            mail.composerSubject(tutao.locator.languageViewModel.get("invitationMailSubject_msg"));
            var username = tutao.locator.userController.getUserGroupInfo().getName();
            tutao.locator.mailView.setComposingBody(tutao.locator.htmlSanitizer.sanitize(tutao.locator.languageViewModel.get("invitationMailBody_msg", {'$': username})));
        }, self.isInternalUserLoggedIn, false, "menu_invite", "invite", 'invite_alt'),

        // external users
        new tutao.tutanota.ctrl.Button('register_label', 27, tutao.locator.navigator.register, self._externalUserLoggedIn, false, "menu_register", "register", 'register_alt'),

        // all supported
        new tutao.tutanota.ctrl.Button('feedback_label', 26, tutao.locator.feedbackViewModel.open, feedbackSupported, false, "menu_feedback", "feedback", 'feedback_alt'),

        // all logged in
        new tutao.tutanota.ctrl.Button('logout_label', 25, function () {
            tutao.locator.navigator.logout(false, true);
        }, self.isUserLoggedIn, false, "menu_logout", "logout", 'logout_alt'),
    ];
    this.headerBarViewModel = new tutao.tutanota.ctrl.ButtonBarViewModel(buttons, "more_label", measureNavButton);
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
		this._activeView().activate(params);
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
	return (this._internalUserLoggedIn() || this._externalUserLoggedIn());
};

/**
 * @return {boolean} true, if an internal user is already logged in, false otherwise.
 */
tutao.tutanota.ctrl.ViewManager.prototype.isInternalUserLoggedIn = function() {
	return this._internalUserLoggedIn();
};

/**
 * Shows the home view (which is currently the mail view).
 */
tutao.tutanota.ctrl.ViewManager.prototype.showHomeView = function() {
	if (this.isInternalUserLoggedIn() && this.getActiveView() != tutao.locator.mailView) {
		this.select(tutao.locator.mailView);
	}
};
