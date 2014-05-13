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
 * @return {boolean} true if the big logo should be shown.
 */
tutao.tutanota.ctrl.ViewManager.prototype.showFullLogo = function() {
	return (this._bigWindowWidth() || !this.isUserLoggedIn());
};

/**
 * Shows the home view (which is currently the mail view).
 */
tutao.tutanota.ctrl.ViewManager.prototype.showHomeView = function() {
	if (this.isInternalUserLoggedIn() && this.getActiveView() != tutao.locator.mailView) {
		this.select(tutao.locator.mailView);
	}
};
