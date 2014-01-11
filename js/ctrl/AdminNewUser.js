"use strict";

goog.provide('tutao.tutanota.ctrl.AdminNewUser');

/**
 * A new user that should be added to an existing customer
 * @constructor
 */
tutao.tutanota.ctrl.AdminNewUser = function () {
    this.mailAddressPrefix = ko.observable("");
    this.mailAddressStatus = ko.observable({ type: "neutral", text: "mailAddressNeutral_msg"});
    this.mailAddressPrefix.subscribe(tutao.tutanota.ctrl.RegistrationViewModel.createMailAddressVerifier(this, 1));
    this.name = ko.observable("");
    this.password = ko.observable(tutao.tutanota.util.PasswordUtils.generatePassword(10));
    this.state = ko.observable(tutao.tutanota.ctrl.AdminNewUser.STATE_NONE);
    this.domain = ko.observable(tutao.locator.userController.getDomain());
};

/**
 * Provides the status of the password.
 * @return {Object} The status containing type and text id.
 */
tutao.tutanota.ctrl.AdminNewUser.prototype.getPasswordStatus = function () {
    if (this.password() == "") {
        return { type: "neutral", text: "password1Neutral_msg" };
    } else if (this.getPasswordStrength() >= 80) {
        return { type: "valid", text: "passwordValid_msg" };
    } else if (this.password().trim().lenght < 1) {
        return { type: "invalid", text: "password1InvalidTooShort_msg" };
    } else {
        return { type: "neutral", text: "password1InvalidUnsecure_msg" };
    }
};

tutao.tutanota.ctrl.AdminNewUser.prototype.getPasswordStrength = function () {
    return tutao.tutanota.util.PasswordUtils.getPasswordStrength(this.password())
};

tutao.tutanota.ctrl.AdminNewUser.prototype.isValidMailAddress = function () {
    return tutao.tutanota.util.Formatter.isMailAddress(this.mailAddressPrefix() + "@" + this.domain());
};

tutao.tutanota.ctrl.AdminNewUser.STATE_NONE = "";
tutao.tutanota.ctrl.AdminNewUser.STATE_IN_PROGRESS = "progress";
tutao.tutanota.ctrl.AdminNewUser.STATE_SUCCESS = "success";
tutao.tutanota.ctrl.AdminNewUser.STATE_FAILED = "failed";

tutao.tutanota.ctrl.AdminNewUser.prototype.isCreateAccountPossible = function() {
    return this.mailAddressStatus().type == "valid" &&
        this.getPasswordStatus().type != "invalid";
};

/**
 * Create the new user
 * @param {function(tutao.rest.EntityRestException=)} outerCallback Called when finished.
 */
tutao.tutanota.ctrl.AdminNewUser.prototype.create = function (outerCallback) {
    var self = this;
    var callback = function(exception) {
        if (exception) {
            self.state(tutao.tutanota.ctrl.AdminNewUser.STATE_FAILED);
        } else {
            self.state(tutao.tutanota.ctrl.AdminNewUser.STATE_SUCCESS);
        }
        outerCallback(exception);
    };
    this.state(tutao.tutanota.ctrl.AdminNewUser.STATE_IN_PROGRESS);
    var adminUser = tutao.locator.userController.getLoggedInUser();
    var memberships = adminUser.getMemberships();
    var adminUserKey = tutao.locator.userController.getUserGroupKey();

    adminUser.loadCustomer(function (customer, exception) {
        if (exception) {
            callback(exception);
        } else {
            // get the admin group and customer group keys via the group memberships of the admin user
            var adminGroupKey = null;
            var customerGroupKey = null;
            for (var i = 0; i < memberships.length; i++) {
                if (memberships[i].getAdmin()) {
                    adminGroupKey = tutao.locator.aesCrypter.decryptKey(adminUserKey, memberships[i].getSymEncGKey());
                } else if (memberships[i].getGroup() === customer.getCustomerGroup()) {
                    customerGroupKey = tutao.locator.aesCrypter.decryptKey(adminUserKey, memberships[i].getSymEncGKey());
                }
            }
            if (!adminGroupKey) {
                callback(new Error("could not create customer, the adminGroupKey is null!"));
                return;
            }
            if (!customerGroupKey) {
                callback(new Error("could not create customer, the customerGroupKey is null!"));
                return;
            }

            var hexSalt = tutao.locator.kdfCrypter.generateRandomSalt();
            tutao.locator.kdfCrypter.generateKeyFromPassphrase(self.password(), hexSalt, function (userPassphraseKeyHex) {
                var userPassphraseKey = tutao.locator.aesCrypter.hexToKey(userPassphraseKeyHex);

                var userGroupsListKey = null;
                tutao.entity.EntityHelper.getListKey(customer.getUserGroups(), function(userGroupsListKey, exception) {
                    if (exception) {
                        callback(exception);
                    } else {
                        tutao.tutanota.ctrl.GroupData.generateGroupKeys(self.name(), self.mailAddressPrefix() + "@" + self.domain(), userPassphraseKey, adminGroupKey, userGroupsListKey, function (userGroupData, userGroupKey, exception) {
                            if (exception != null) {
                                callback(exception);
                            } else {
                                var userService = new tutao.entity.sys.UserData()
                                    .setUserEncClientKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, tutao.locator.aesCrypter.generateRandomKey()))
                                    .setUserEncCustomerGroupKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, customerGroupKey))
                                    .setUserGroupData(userGroupData)
                                    .setSalt(tutao.util.EncodingConverter.hexToBase64(hexSalt))
                                    .setVerifier(tutao.locator.shaCrypter.hashHex(userPassphraseKeyHex))
                                    .setMobilePhoneNumber("");

                                userService.setup({}, null, function(userReturn, exception) {
                                	if (exception) {
                                		callback(exception);
                                		return;
                                	}
                                	tutao.tutanota.ctrl.AdminNewUser.initGroup(userReturn.getUserGroup(), userGroupKey, callback);
                                });
                            }
                        });
                    }
                });
            });
        }
    });
};

/**
 * Initializes the given user group for Tutanota (creates mail box etc.). The admin must be logged in.
 * @param {string} groupId The group to initialize.
 * @param {Object} groupKey the group key.
 * @param {function(tutao.rest.EntityRestException=)} callback Called when finished.
 */
tutao.tutanota.ctrl.AdminNewUser.initGroup = function(groupId, groupKey, callback) {
	var s = new tutao.entity.tutanota.InitGroupData();
	
	s.setGroupId(groupId);

	var mailShareBucketKey = tutao.locator.aesCrypter.generateRandomKey();
	var mailBoxSessionkey = tutao.locator.aesCrypter.generateRandomKey();
	s.setSymEncMailBoxSessionKey(tutao.locator.aesCrypter.encryptKey(groupKey, mailBoxSessionkey));
	s.setSymEncMailShareBucketKey(tutao.locator.aesCrypter.encryptKey(groupKey, mailShareBucketKey));
	s.setMailShareBucketEncMailBoxSessionKey(tutao.locator.aesCrypter.encryptKey(mailShareBucketKey, mailBoxSessionkey));

	var contactShareBucketKey = tutao.locator.aesCrypter.generateRandomKey();
	var contactListSessionkey = tutao.locator.aesCrypter.generateRandomKey();
	s.setSymEncContactListSessionKey(tutao.locator.aesCrypter.encryptKey(groupKey, contactListSessionkey));
	s.setSymEncContactShareBucketKey(tutao.locator.aesCrypter.encryptKey(groupKey, contactShareBucketKey));
	s.setContactShareBucketEncContactListSessionKey(tutao.locator.aesCrypter.encryptKey(contactShareBucketKey, contactListSessionkey));

	var fileShareBucketKey = tutao.locator.aesCrypter.generateRandomKey();
	var fileSystemSessionkey = tutao.locator.aesCrypter.generateRandomKey();
	s.setSymEncFileSystemSessionKey(tutao.locator.aesCrypter.encryptKey(groupKey, fileSystemSessionkey));
	s.setSymEncFileShareBucketKey(tutao.locator.aesCrypter.encryptKey(groupKey, fileShareBucketKey));
	s.setFileShareBucketEncFileSystemSessionKey(tutao.locator.aesCrypter.encryptKey(fileShareBucketKey, fileSystemSessionkey));

    var groupShareBucketKey = tutao.locator.aesCrypter.generateRandomKey();
    var externalGroupInfoListKey = tutao.locator.aesCrypter.generateRandomKey();
    s.setSymEncExternalGroupInfoListKey(tutao.locator.aesCrypter.encryptKey(groupKey, externalGroupInfoListKey));
    s.setSymEncGroupShareBucketKey(tutao.locator.aesCrypter.encryptKey(groupKey, groupShareBucketKey));
    s.setGroupShareBucketEncExternalGroupInfoListKey(tutao.locator.aesCrypter.encryptKey(groupShareBucketKey, externalGroupInfoListKey));

	s.setup({}, tutao.entity.EntityHelper.createAuthHeaders(), function(nothing, exception) {
		callback(exception);
	});
};
