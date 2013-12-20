"use strict";

goog.provide('tutao.tutanota.ctrl.AdminEditUserViewModel');

/**
 * Allows the admin to edit an existing user
 * @constructor
 * @param {tutao.tutanota.ctrl.AdminUserListViewModel, tutao.entity.sys.GroupInfo} userGroup The userGroup of the user to edit
 */
tutao.tutanota.ctrl.AdminEditUserViewModel = function(adminUserListViewModel, userGroup) {
    /*@type {tutao.tutanota.ctrl.AdminUserListViewModel}*/
    this.adminUserListViewModel = adminUserListViewModel;
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.startId = ko.observable(tutao.rest.EntityRestInterface.GENERATED_MAX_ID);
    /*@type {tutao.entity.sys.GroupInfo}*/
	this.userGroup = userGroup;
	this.name = ko.observable(userGroup.getName());
	
	this.isEditable = ko.observable(true);
	
	this.saveStatus = ko.observable({type: "neutral", text: "emptyString_msg" });
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.save = function() {
	this.userGroup.setName(this.name());
	this.saveStatus({type: "neutral", text: "saving_msg" });
    var self = this;
	this.userGroup.update(function(exception) {
		if (exception) {
			console.log(exception);
		} else {
            self.adminUserListViewModel.updateUserGroupInfo();
		}
	});
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.cancel = function() {
    this.adminUserListViewModel.removeSelection();
};


tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.deleteUser = function() {
    var self = this;
    this.userGroup.loadGroup(function(group, exception) {
        if (exception) {
            console.log(exception);
        } else {
            var restore = self.userGroup.getDeleted() != null;
            new tutao.entity.sys.UserDataDelete()
                .setUser(group.getUser())
                .setRestore(restore)
                .erase({}, null, function(deleteUserReturn, exception) {
                    if (exception) {
                        console.log(exception);
                    } else {
                        self.adminUserListViewModel.updateUserGroupInfo();
                    }
                });
        }
    });
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.getDeleteButtonText = function() {
    return this.userGroup.getDeleted() == null ? 'delete_action': 'undelete_action';
};
