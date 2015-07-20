"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminEditUserViewModel');

/**
 * Allows the admin to edit an existing user
 * @constructor
 * @param {tutao.tutanota.ctrl.AdminUserListViewModel} adminUserListViewModel The list view model.
 * @param {tutao.entity.sys.GroupInfo} userGroupInfo The userGroupInfo of the user to edit
 */
tutao.tutanota.ctrl.AdminEditUserViewModel = function(adminUserListViewModel, userGroupInfo) {
    /**@type {tutao.tutanota.ctrl.AdminUserListViewModel}*/
    this.adminUserListViewModel = adminUserListViewModel;
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this.startId = ko.observable(tutao.rest.EntityRestInterface.GENERATED_MAX_ID);
    /**@type {tutao.entity.sys.GroupInfo}*/
	this.userGroupInfo = userGroupInfo;
	this.name = ko.observable(userGroupInfo.getName());
    var emptyPassword = "***";
    this.password = ko.observable(emptyPassword);
    this.passwordChanged = ko.computed(function() {
        return this.password() != emptyPassword;
    }, this);
    this.passwordFocused = ko.observable(false);
    this.passwordFocused.subscribe(function(newValue) {
        if (this.password() == emptyPassword && newValue) {
           this.password("");
        } else if (this.password() == "" && !newValue) {
            this.password(emptyPassword);
        }
    }, this);

    this.user = ko.observable();
    this.admin = ko.observable();

	this.busy = ko.observable(false);
    this.saveStatus = ko.observable({type: "neutral", text: "emptyString_msg" });

    this.passwordChangeAllowed = ko.observable(false);
    this.deleteUserAllowed = ko.observable(false);
    this.modifyAdminAllowed = ko.observable(false);
    var self = this;
    tutao.entity.sys.Group.load(userGroupInfo.getGroup()).then(function(userGroup) {
        if (userGroup.getType() == tutao.entity.tutanota.TutanotaConstants.GROUP_TYPE_USER) {
            tutao.entity.sys.User.load(userGroup.getUser()).then(function(user) {
                self.user(user);
                self.admin(self._isAdmin(self.user()));
                if (!self._isAdmin(user) && self.adminUserListViewModel.createAccountsPossible()) {
                    self.passwordChangeAllowed(true);
                    self.deleteUserAllowed(true);
                }
                self.modifyAdminAllowed(tutao.locator.userController.getLoggedInUser().getId() != user.getId());
            });
        }
    });
};

/**
 * Checks if the given user is an admin.
 * @param {tutao.entity.sys.User} user The user to check.
 * @returns {boolean} True if the given user is an admin.
 * @private
 */
tutao.tutanota.ctrl.AdminEditUserViewModel.prototype._isAdmin = function(user) {
    var memberships = user.getMemberships();
    for (var i=0; i<memberships.length; i++) {
        if (memberships[i].getAdmin()) {
            return true;
        }
    }
    return false;
};

/**
 * Provides the status of the first entered new password.
 * @return {Object} The status containing type and text id.
 */
tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.getPasswordStatus = function() {
    if (!this.passwordChanged()) {
        return { type: "neutral", text: "passwordNotChanged_msg" };
    } else if (this.getPasswordStrength() >= 80) {
        return { type: "valid", text: "passwordValid_msg" };
    } else {
        return { type: "neutral", text: "password1InvalidUnsecure_msg" };
    }
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.isChangeActionAllowed = function() {
    return (!this.passwordChanged() || this.isChangePasswordActionAllowed()) && !this.busy() && this.isActive();
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.isChangePasswordActionAllowed = function() {
    return (this.passwordChangeAllowed() && this.passwordChanged() && this.password() != "");
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.save = function() {
    if (!this.isChangeActionAllowed()) {
        return;
    }
    this.busy(true);
	this.userGroupInfo.setName(this.name());
	this.saveStatus({type: "neutral", text: "save_msg" });
    var self = this;
	this.userGroupInfo.update().then(function() {
        if (self.isChangePasswordActionAllowed()) {
            return self._resetPassword().then(function(exception) {
                self.saveStatus({type: "valid", text: "pwChangeValid_msg" });
                self.adminUserListViewModel.updateUserGroupInfo();
                tutao.locator.settingsView.showChangeSettingsColumn();
            }).caught(function(exception) {
                self.saveStatus({type: "invalid", text: "passwordResetFailed_msg" });

            })
        } else {
            self.adminUserListViewModel.updateUserGroupInfo();
            tutao.locator.settingsView.showChangeSettingsColumn();
        }
	}).then(function () {
        var adminGroupMembership = self._getGroupMembershipOfAdmin();
        if (self.admin() && !self._isAdmin(self.user())) {
            var adminGroupKey = tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), adminGroupMembership.getSymEncGKey());
            return tutao.entity.sys.Group.load(self.userGroupInfo.getGroup()).then(function(userGroup, exception) {
                var userGroupKey = tutao.locator.aesCrypter.decryptKey(adminGroupKey, userGroup.getAdminGroupEncGKey());

                return new tutao.entity.sys.MembershipAddData()
                    .setUser(self.user().getId())
                    .setGroup(adminGroupMembership.getGroup())
                    .setSymEncGKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, adminGroupKey))
                    .setup({}, null)
                    .then(function () {
                        return self.user().loadCustomer();
                    }).then(function (customer) {
                        return self._getMailAddressForAccountType(customer.getType());
                    }).then(function (mailAddress) {
                        return self._getGroupMembershipOfAdmin(mailAddress); // membership in starter@tutanota.de or premium@tutanota.de
                    }).then(function(groupMembership) {
                        return new tutao.entity.sys.MembershipAddData()
                            .setUser(self.user().getId())
                            .setGroup(groupMembership.getGroup())
                            .setSymEncGKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(),groupMembership.getSymEncGKey())))
                            .setup({}, null);
                    });
            });

        } else if (!self.admin() && self._isAdmin(self.user())) {
            return new tutao.entity.sys.MembershipRemoveData()
                .setUser(self.user().getId())
                .setGroup(adminGroupMembership.getGroup())
                .erase({}, null)
            .then(function () {
                return self.user().loadCustomer();
            }).then(function (customer) {
                return self._getMailAddressForAccountType(customer.getType());
            }).then(function (mailAddress) {
                return self._getGroupMembershipOfAdmin(mailAddress);
            }).then(function(groupMembership) {
                return new tutao.entity.sys.MembershipRemoveData()
                    .setUser(self.user().getId())
                    .setGroup(groupMembership.getGroup())
                    .erase({}, null);
            });
        }
    }).then(function() {
        self.saveStatus({type: "neutral", text: "saved_msg" });
    }).caught(function(e) {
        self.saveStatus({type: "neutral", text: "emptyString_msg" });
        throw e;
    }).lastly(function() {
        self.busy(false);
    });
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype._resetPassword = function() {
    try {
        var adminGroupMembership = this._getGroupMembershipOfAdmin();
        var adminGroupKey = tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), adminGroupMembership.getSymEncGKey());

        var self = this;
        return tutao.entity.sys.Group.load(self.userGroupInfo.getGroup()).then(function(userGroup, exception) {
            var userGroupKey = tutao.locator.aesCrypter.decryptKey(adminGroupKey, userGroup.getAdminGroupEncGKey());
            var hexSalt = tutao.locator.kdfCrypter.generateRandomSalt();
            return tutao.locator.crypto.generateKeyFromPassphrase(self.password(), hexSalt).then(function(userPassphraseKeyHex) {
                var userPassphraseKey = tutao.locator.aesCrypter.hexToKey(userPassphraseKeyHex);
                var pwEncUserGroupKey = tutao.locator.aesCrypter.encryptKey(userPassphraseKey, userGroupKey);
                var verifier = tutao.locator.shaCrypter.hashHex(userPassphraseKeyHex);

                var service = new tutao.entity.sys.ResetPasswordData();
                service.setUser(userGroup.getUser());
                service.setSalt(tutao.util.EncodingConverter.hexToBase64(hexSalt));
                service.setVerifier(verifier);
                service.setPwEncUserGroupKey(pwEncUserGroupKey);
                return service.setup({}, null);
            });
        });
    } catch(e) {
        return Promise.reject(new tutao.entity.EntityRestException(e));
    }
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype._getGroupMembershipOfAdmin = function () {
    var memberships = tutao.locator.userController.getLoggedInUser().getMemberships();
    for (var i = 0; i < memberships.length; i++) {
        if (memberships[i].getAdmin()) {
            return memberships[i];
        }
    }
    throw new Error("The currently logged in user is not an admin");
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype._getGroupMembershipOfAdmin = function (mailAddress) {
    var memberships = tutao.locator.userController.getLoggedInUser().getMemberships();
    var groupMembership = null;
    return Promise.each(memberships, function (membership) {
       return membership.loadGroupInfo().then(function(info) {
           if (info.getMailAddress() == mailAddress) {
               groupMembership = membership;
           }
       });
    }).then(function() {
        return groupMembership;
    });
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype._getMailAddressForAccountType = function(accountType) {
    if (accountType == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_PREMIUM) {
        return 'premium@tutanota.de';
    } else if (tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER)    {
        return 'starter@tutanota.de';
    }else {
        throw new Error("unsupported account type: " + customer.getType());
    }
}

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.deleteUser = function() {
    if (this.busy()) {
        return;
    }
    var self = this;
    this.userGroupInfo.loadGroup().then(function(group) {
        var restore = self.userGroupInfo.getDeleted() != null;
        var itemName = ((restore) ? tutao.lang('activateUser_label') : tutao.lang('deactivateUser_label'));
        tutao.locator.buyDialogViewModel.showDialog(tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_USERS, (restore) ? 1 : -1, itemName).then(function(confirmed) {
            if (confirmed) {
                new tutao.entity.sys.UserDataDelete()
                    .setUser(group.getUser())
                    .setRestore(restore)
                    .setDate(tutao.entity.tutanota.TutanotaConstants.CURRENT_DATE)
                    .erase({}, null).then(function(deleteUserReturn) {
                        self.adminUserListViewModel.updateUserGroupInfo();
                        tutao.locator.settingsView.showChangeSettingsColumn();
                    });
            }
        });
    });
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.getDeleteButtonText = function() {
    return this.userGroupInfo.getDeleted() == null ? 'deactivate_action': 'activate_action';
};

/**
 * Provides the password strength in %.
 * @return {Number} The strength of the password.
 */
tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.getPasswordStrength = function() {
    return tutao.tutanota.util.PasswordUtils.getPasswordStrength(this.password(), []);
};

tutao.tutanota.ctrl.AdminEditUserViewModel.prototype.isActive = function() {
    return (this.userGroupInfo.getDeleted() == null);
};
