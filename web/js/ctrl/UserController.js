"use strict";

tutao.provide('tutao.ctrl.UserController');

/**
 * Allows logging in an internal user.
 * @constructor
 */
tutao.ctrl.UserController = function () {
    this._user = ko.observable(null);
    this._userGroupInfo = ko.observable(null);
    this.reset();
};

/**
 * Resets all internal state, so nobody is logged in.
 */
tutao.ctrl.UserController.prototype.reset = function () {
    // internal and external user
    this._userId = null;
    this._userGroupKey = null;
    this._authVerifier = null;
    this._userGroupId = null;
    this._user(null);
    this._userPassphraseKey = null;
    this._userClientKey = null;
    this._mailAddress = null;
    this._hexSalt = null;
    this._userGroupInfo(null); // indicates that a user is logged in because this is set in the last login step

    // only set for external user
    this._authToken = null; // the hash of the salt
};

/**
 * Provides the user group id of the logged in user.
 * @return {string} The user group id.
 */
tutao.ctrl.UserController.prototype.getUserGroupId = function () {
    return this._userGroupId;
};

/**
 * Provides the symmetric user group key of the logged in user.
 * @return {Object} The user group key.
 */
tutao.ctrl.UserController.prototype.getUserGroupKey = function () {
    return this._userGroupKey;
};

/**
 * Provides the authentication verifier of the logged in user.
 * @return {string} The auth verifier.
 */
tutao.ctrl.UserController.prototype.getAuthVerifier = function () {
    return this._authVerifier;
};

/**
 * Provides the user id of the logged in user.
 * @return {string} The user id.
 */
tutao.ctrl.UserController.prototype.getUserId = function () {
    return this._userId;
};

/**
 * Provides the currently logged-in user.
 * @return {tutao.entity.sys.User} The logged-in user.
 */
tutao.ctrl.UserController.prototype.getLoggedInUser = function () {
    return this._user();
};

tutao.ctrl.UserController.prototype.isLoggedInUserAdmin = function () {
    if (this.isInternalUserLoggedIn()) {
        var memberships = this._user().getMemberships();
        for (var i = 0; i < memberships.length; i++) {
            if (memberships[i].getAdmin()) {
                return true;
            }
        }
    }
    return false;
};

/**
 * Checks if the account type of the logged in user is FREE.
 * @returns {boolean} True if the account type is FREE otherwise false
 */
tutao.ctrl.UserController.prototype.isLoggedInUserFreeAccount = function () {
    if (this.isInternalUserLoggedIn()) {
        var localAccountType = this.getLoggedInUser().getAccountType();
        return localAccountType === tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE;
    }
    return false;
};

// INTERNAL

/**
 * Provides the mail address of the logged in internal user.
 * @return {string} The user's mail address.
 */
tutao.ctrl.UserController.prototype.getMailAddress = function () {
    return this._mailAddress;
};

/**
 * Provides the domain of the logged in internal user.
 * @return {string} The user's domain.
 */
tutao.ctrl.UserController.prototype.getDomain = function () {
    return this._mailAddress.split("@")[1];
};

/**
 * Provides the client key of the logged in internal user.
 * @return {Object} The user's client key.
 */
tutao.ctrl.UserController.prototype.getUserClientKey = function () {
    return this._userClientKey;
};

/**
 * Provides the salt of the user verifier.
 * @return {string} The salt.
 */
tutao.ctrl.UserController.prototype.getHexSalt = function () {
    return this._hexSalt;
};

/**
 * Provides the user group info
 * @return {tutao.entity.sys.GroupInfo} the user group info
 */
tutao.ctrl.UserController.prototype.getUserGroupInfo = function () {
    return this._userGroupInfo();
};

/**
 * Sets the user group info
 * @param {tutao.entity.sys.GroupInfo} groupInfo The new group info to set
 */
tutao.ctrl.UserController.prototype.setUserGroupInfo = function (groupInfo) {
    this._userGroupInfo(groupInfo);
};



/**
 * Sets the given user as logged-in user.
 * @param {string} mailAddress The mail address of the user.
 * @param {string} passphrase The passphrase of the user.
 * @return {Promise.<>} Resolved when finished, rejected if the login failed.
 */
tutao.ctrl.UserController.prototype.loginUser = function (mailAddress, passphrase) {
    this.reset();
    var self = this;
    self._mailAddress = mailAddress.toLowerCase().trim();
    return tutao.entity.sys.SaltReturn.load(new tutao.entity.sys.SaltData().setMailAddress(self.getMailAddress()), {}, null).then(function (saltData) {
        self._hexSalt = tutao.util.EncodingConverter.base64ToHex(saltData.getSalt());
        return tutao.locator.crypto.generateKeyFromPassphrase(passphrase, self._hexSalt);
    }).then(function (hexKey) {
        // the verifier is always sent as url parameter, so it must be url encoded
        self._authVerifier = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.shaCrypter.hashHex(hexKey));
        var authHeaders = {};
        authHeaders[tutao.rest.ResourceConstants.AUTH_VERIFIER_PARAMETER_NAME] = self._authVerifier;
        return tutao.entity.sys.UserIdReturn.load(new tutao.entity.sys.UserIdData().setMailAddress(self.getMailAddress()), {}, authHeaders).then(function (userIdReturn) {
            self._userId = userIdReturn.getUserId();
            self._userPassphraseKey = tutao.locator.aesCrypter.hexToKey(hexKey);
            return tutao.entity.sys.User.load(self._userId);
        });
    }).then(function (user) {
        self._user(user);
        self._userGroupId = user.getUserGroup().getGroup();
        self._userGroupKey = tutao.locator.aesCrypter.decryptKey(self._userPassphraseKey, user.getUserGroup().getSymEncGKey());
        self._userClientKey = tutao.locator.aesCrypter.decryptKey(self._userGroupKey, user.getUserEncClientKey());
        return tutao.entity.sys.GroupInfo.load(tutao.locator.userController.getLoggedInUser().getUserGroup().getGroupInfo())
    }).then(function (groupInfo) {
        self._userGroupInfo(groupInfo);
    }).caught(function (e) {
        self.reset();
        throw e;
    });
};

/**
 * Updates the user login data after a password change.
 * @param {String} hexPassphraseKey The key generated from the users passphrase as hex string.
 * @param {String} hexSalt hex value of the salt.
 */
tutao.ctrl.UserController.prototype.passwordChanged = function (hexPassphraseKey, hexSalt) {
    this._authVerifier = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.shaCrypter.hashHex(hexPassphraseKey));
    this._userPassphraseKey = tutao.locator.aesCrypter.hexToKey(hexPassphraseKey);
    this._hexSalt = hexSalt;
};

/**
 * Provides the information if an internal user is logged in.
 * @return {boolean} True if an internal user is logged in, false if no user or an external user is logged in.
 */
tutao.ctrl.UserController.prototype.isInternalUserLoggedIn = function () {
    return (this._userGroupInfo() && this._authToken == null);
};

// EXTERNAL

/**
 * Provides the authentication token that was used to log in the external user.
 * @return {string} The authentication token.
 */
tutao.ctrl.UserController.prototype.getAuthToken = function () {
    return this._authToken;
};

/**
 * Logs in an external user. Attention: the external user's user group key is not set here. Set it when the key is loaded via setExternalUserGroupKey().
 * @param {string} userId The user id of the user.
 * @param {string} password The password matching the authentication token.
 * @param {string} saltHex The salt that was used to salt the password, as hex string.
 * @return {Promise.<>} Resolved when finished, rejected if the login failed.
 */
tutao.ctrl.UserController.prototype.loginExternalUser = function (userId, password, saltHex) {
    var self = this;
    this.reset();

    return tutao.locator.crypto.generateKeyFromPassphrase(password, saltHex).then(function (hexKey) {
        // the verifier is always sent as url parameter, so it must be url encoded
        self._authVerifier = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.shaCrypter.hashHex(hexKey));
        self._authToken = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.shaCrypter.hashHex(saltHex));
        self._userId = userId;
        self._hexSalt = saltHex;

        var authHeaders = {};
        authHeaders[tutao.rest.ResourceConstants.AUTH_VERIFIER_PARAMETER_NAME] = self._authVerifier;
        self._userPassphraseKey = tutao.locator.aesCrypter.hexToKey(hexKey);
        return tutao.entity.sys.User.load(self._userId).then(function (user) {
            self._user(user);
            self._userGroupId = user.getUserGroup().getGroup();
            self._userGroupKey = tutao.locator.aesCrypter.decryptKey(self._userPassphraseKey, user.getUserGroup().getSymEncGKey());
            self._userClientKey = tutao.locator.aesCrypter.decryptKey(self._userGroupKey, user.getUserEncClientKey());
            return tutao.entity.sys.GroupInfo.load(tutao.locator.userController.getLoggedInUser().getUserGroup().getGroupInfo()).then(function (groupInfo) {
                self._userGroupInfo(groupInfo);
                self._mailAddress = groupInfo.getMailAddress();
            });
        });
    }).caught(function(e) {
        self.reset();
        throw e;
    });
};

/**
 * Provides the information if an external user is logged in.
 * @return {boolean} True if an external user is logged in, false if no user or an internal user is logged in.
 */
tutao.ctrl.UserController.prototype.isExternalUserLoggedIn = function () {
    return (this._authToken != null); // only check auth token because this is already called when loading the user in loginExternalUser()
};