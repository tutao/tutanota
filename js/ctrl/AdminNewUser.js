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
    } else {
        return { type: "invalid", text: "password1InvalidUnsecure_msg" };
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

/**
 * Create the new user
 * {function(tutao.rest.EntityRestException=}
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

                tutao.tutanota.ctrl.GroupData.generateGroupKeys(self.name(), self.mailAddressPrefix() + "@" + self.domain(), userPassphraseKey, adminGroupKey, function (userGroupData, exception) {
                    if (exception != null) {
                        callback(exception);
                    } else {

                        var pwEncClientKey = tutao.locator.aesCrypter.encryptKey(userPassphraseKey, tutao.locator.aesCrypter.generateRandomKey());

                        // encrypt the session keys for the permissions
                        var customerEncUserGroupSessionKey = tutao.locator.aesCrypter.encryptKey(customerGroupKey, userGroupData.getSessionKey());
                        var adminEncUserSessionKey = tutao.locator.aesCrypter.encryptKey(adminGroupKey, userGroupData.getSessionKey());
                        var userEncCustomerKey = tutao.locator.aesCrypter.encryptKey(userGroupData.getSymGroupKey(), customerGroupKey);

                        var userService = new tutao.entity.sys.UserData();
                        userService.setAdminEncUserSessionKey(adminEncUserSessionKey);
                        userService.setAdminEncUserKey(userGroupData.getAdminEncGKey());
                        userService.setCustomerEncUserSessionKey(customerEncUserGroupSessionKey);
                        userService.setPwEncClientKey(pwEncClientKey);
                        userService.setPwEncUserKey(userGroupData.getSymEncGKey());
                        userService.setUserEncCustomerKey(userEncCustomerKey);
                        userService.setUserEncPrivKey(userGroupData.getSymEncPrivKey());
                        userService.setUserEncUserSessionKey(userGroupData.getSymEncSessionKey());
                        userService.setUserGroupMailAddress(userGroupData.getMailAddr());
                        userService.setUserGroupName(userGroupData.getEncryptedName());
                        userService.setUserPubKey(userGroupData.getPubKey());
                        userService.setMobilePhoneNumber("");

                        userService.setSalt(tutao.util.EncodingConverter.hexToBase64(hexSalt));
                        userService.setVerifier(tutao.locator.shaCrypter.hashHex(userPassphraseKeyHex));


                        return userService.setup({}, null, function(userReturn, exception) {
                            callback(exception);
                        });


                    }
                });

            });


        }
    });

};