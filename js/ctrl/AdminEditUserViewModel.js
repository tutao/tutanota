"use strict";

goog.provide('tutao.tutanota.ctrl.AdminEditUserViewModel');

/**
 * Allows the admin to edit an existing user
 * @constructor
 * @param {tutao.entity.sys.Group} userGroup The userGroup of the user to edit
 */
tutao.tutanota.ctrl.AdminEditUserViewModel = function(userGroup) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.startId = ko.observable(tutao.rest.EntityRestInterface.GENERATED_MAX_ID);
	this.userGroup = userGroup;
	this.name = ko.observable(userGroup.getName());
	
	this.isEditable = ko.observable(true);
	
	this.saveStatus = ko.observable({type: "neutral", text: "emptyString_msg" });
};

/**
 * @param {function()} callback The callback is invoked after the update has been successfully completed
 */
tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.save = function(callback) {
	this.userGroup.setName(this.name());
	this.saveStatus({type: "neutral", text: "saving_msg" })
	this.userGroup.update(function(exception) {
		if (exception) {
			console.log(exception);
		} else {
			callback();
		}
	});
};