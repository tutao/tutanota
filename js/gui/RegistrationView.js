"use strict";

goog.provide('tutao.tutanota.gui.RegistrationView');

/**
 * @constructor
 * @implements {tutao.tutanota.ctrl.View}
 */
tutao.tutanota.gui.RegistrationView = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.init = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.isForInternalUserOnly = function() {
	return false;
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.activate = function(parameters) {
	if (parameters.authToken) {
		var params = {};
		params[tutao.rest.ResourceConstants.AUTH_TOKEN_PARAMETER_NAME] = parameters.authToken;
		tutao.entity.sys.RegistrationDataService.load(params, null, function(data, exception) {
			if (exception) {
				return;
			}
			if (data.getState() == tutao.entity.tutanota.TutanotaConstants.REGISTRATION_STATE_INITIAL) {
				tutao.locator.registrationViewModel.authToken = parameters.authToken;
				tutao.locator.registrationViewModel.name(data.getGroupName());
				tutao.locator.registrationViewModel.mailAddress(data.getMailAddress().substring(0, data.getMailAddress().indexOf("@")));
				tutao.locator.registrationViewModel.phoneNumber(data.getMobilePhoneNumber());
			}
		});
	}
	tutao.locator.registrationViewModel.activate();
};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.deactivate = function() {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.windowSizeChanged = function(width, height) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.swipeRecognized = function(type) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.showNeighbourColumn = function(left) {

};

/**
 * @inherit
 */
tutao.tutanota.gui.RegistrationView.prototype.isShowNeighbourColumnPossible = function(left) {
	return false;
};
