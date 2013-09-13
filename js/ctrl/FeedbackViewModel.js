"use strict";

goog.provide('tutao.tutanota.ctrl.FeedbackViewModel');

/**
 * The ViewModel for the feedback wizard.
 * @constructor
 */
tutao.tutanota.ctrl.FeedbackViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.message = ko.observable("");
	this.image = null;

	this.showDialog = ko.observable(false);

};

tutao.tutanota.ctrl.FeedbackViewModel.prototype.open = function() {
	var self = this;
	html2canvas($('body'), {
		onrendered: function(canvas) {
			var img = canvas.toDataURL();
			self.image = img.split(',')[1];
			self.showDialog(true);
		},
		allowTaint: true
	});
};

tutao.tutanota.ctrl.FeedbackViewModel.prototype.close = function() {
	this.showDialog(false);
	this.message("");
	this.image = null;
};

tutao.tutanota.ctrl.FeedbackViewModel.prototype.sendFeedback = function() {
	var self = this;
	var feedback = new tutao.entity.tutanota.FeedbackData();
	feedback.setMsg(this.message());
	feedback.setUseragent(navigator.userAgent);
	feedback.setImage(this.image);
	var headers = {};
	if (tutao.locator.userController.getLoggedInUser() != null) {
		headers = tutao.entity.EntityHelper.createAuthHeaders();
	}
	feedback.setup({}, headers, function(noData, exception) {
		if (exception) {
			tutao.tutanota.gui.alert(tutao.locator.languageViewModel.get("sendFeedbackFailed_msg"));
		}
		self.close();
	});
};
