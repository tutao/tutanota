"use strict";

goog.provide('tutao.ctrl.UserController');

/**
 * Allows logging in an internal user.
 * @constructor
 */
tutao.ctrl.UserController = function() {
	this.reset();
};

/**
 * Resets all internal state, so nobody is logged in.
 */
tutao.ctrl.UserController.prototype.reset = function() {
	// internal and external
	this._userId = null;
	this._userGroupKey = null;
	this._authVerifier = null;
	this._userGroupId = null;
	this._user = null;

	// internal user
	this._userPassphraseKey = null;
	this._userClientKey = null;
	this._mailAddress = null;
	this._hexSalt = null;

	// external user
	this._authId = null;
	this._authToken = null; // the hash of the salt
};

/**
 * Provides the user group id of the logged in user.
 * @return {string} The user group id.
 */
tutao.ctrl.UserController.prototype.getUserGroupId = function() {
	return this._userGroupId;
};

/**
 * Provides the symmetric user group key of the logged in user.
 * @return {Object} The user group key.
 */
tutao.ctrl.UserController.prototype.getUserGroupKey = function() {
	return this._userGroupKey;
};

/**
 * Provides the authentication verifier of the logged in user.
 * @return {string} The auth verifier.
 */
tutao.ctrl.UserController.prototype.getAuthVerifier = function() {
	return this._authVerifier;
};

/**
 * Provides the user id of the logged in user.
 * @return {string} The user id.
 */
tutao.ctrl.UserController.prototype.getUserId = function() {
	return this._userId;
};

/**
 * Provides the currently logged-in user.
 * @return {tutao.entity.sys.User} The logged-in user.
 */
tutao.ctrl.UserController.prototype.getLoggedInUser = function() {
	return this._user;
};

tutao.ctrl.UserController.prototype.isLoggedInUserAdmin = function() {
	if (this._user) {
		var memberships = this._user.getMemberships();
		for (var i=0; i<memberships.length; i++) {
			if (memberships[i].getAdmin()) {
				return true;
			}
		}
	}
	return false;
};

// INTERNAL

/**
 * Provides the mail address of the logged in internal user.
 * @return {string} The user's mail address.
 */
tutao.ctrl.UserController.prototype.getMailAddress = function() {
	return this._mailAddress;
};

/**
 * Provides the domain of the logged in internal user.
 * @return {string} The user's domain.
 */
tutao.ctrl.UserController.prototype.getDomain = function() {
	return this._mailAddress.split("@")[1];
};

/**
 * Provides the client key of the logged in internal user.
 * @return {Object} The user's client key.
 */
tutao.ctrl.UserController.prototype.getUserClientKey = function() {
	return this._userClientKey;
};

/**
 * Provides the salt of the user verifier.
 * @return {Object} The salt.
 */
tutao.ctrl.UserController.prototype.getHexSalt = function() {
	return this._hexSalt;
};

/**
 * Sets the given user as logged-in user.
 * @param {string} mailAddress The mail address of the user.
 * @param {string} passphrase The passphrase of the user.
 * @param {function(tutao.rest.EntityRestException=)} callback Called when login is finished. Provides an exception if the login failed.
 */
tutao.ctrl.UserController.prototype.loginUser = function(mailAddress, passphrase, callback) {
	this.reset();
	var self = this;
	self._mailAddress = mailAddress;
	var params = [];
	params[tutao.rest.ResourceConstants.MAIL_ADDRESS] = mailAddress;
	tutao.entity.sys.SaltReturn.load(params, null, function(saltData, exception) {
		if (exception) {
			// execute kdf anyway to avoid that the user easily recognises that the mail address is existing
			var salt = "1234567890123456789012346789012";
			tutao.locator.kdfCrypter.generateKeyFromPassphrase(passphrase, salt, function(hexKey) {
				callback(exception);
			});
			return;
		}
		self._hexSalt = tutao.util.EncodingConverter.base64ToHex(saltData.getSalt());
		tutao.locator.kdfCrypter.generateKeyFromPassphrase(passphrase, self._hexSalt, function(hexKey) {
			// the verifier is always sent as url parameter, so it must be url encoded
			self._authVerifier = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.shaCrypter.hashHex(hexKey));
			var authHeaders = {};
			authHeaders[tutao.rest.ResourceConstants.AUTH_VERIFIER_PARAMETER_NAME] = self._authVerifier;
			tutao.entity.sys.UserIdReturn.load(params, authHeaders, function(userIdReturn, e1) {
				if (e1) {
					callback(e1);
					return;
				}
				self._userId = userIdReturn.getUserId();
				self._userPassphraseKey = tutao.locator.aesCrypter.hexToKey(hexKey);
				tutao.entity.sys.User.load(self._userId, function(user, e2) {
					if (e2) {
						callback(e2);
						return;
					}
					self._user = user;
					try {
						self._userGroupId = user.getUserGroup().getGroup();
						self._userGroupKey = tutao.locator.aesCrypter.decryptKey(self._userPassphraseKey, user.getUserGroup().getSymEncGKey());
						self._userClientKey = tutao.locator.aesCrypter.decryptKey(self._userPassphraseKey, user.getPwEncClientKey());
					} catch (e) {
						callback(new tutao.rest.EntityRestException(e));
						return;
					}
					callback();
				});
			});
		});
	});
};

/**
 * Updates the user login data after a password change.
 * @param {String} verifier The auth verifier.
 * @param {String} hexPassphraseKey The key generated from the users passphrase as hex string.
 */
tutao.ctrl.UserController.prototype.passwordChanged = function(hexPassphraseKey, hexSalt) {
	this._authVerifier = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.shaCrypter.hashHex(hexPassphraseKey));
	this._userPassphraseKey = tutao.locator.aesCrypter.hexToKey(hexPassphraseKey);
	this._hexSalt = hexSalt;
};

/**
 * Provides the information if an internal user is logged in.
 * @return {boolean} True if an internal user is logged in, false if no user or an external user is logged in.
 */
tutao.ctrl.UserController.prototype.isInternalUserLoggedIn = function() {
	return (this._userPassphraseKey != null);
};

// EXTERNAL

/**
 * Provides the authentication id that was used to log in the external user.
 * @return {string} The authentication id.
 */
tutao.ctrl.UserController.prototype.getAuthId = function() {
	return this._authId;
};

/**
 * Provides the authentication token that was used to log in the external user.
 * @return {string} The authentication token.
 */
tutao.ctrl.UserController.prototype.getAuthToken = function() {
	return this._authToken;
};

/**
 * Logs in an external user. Attention: the external user's user group key is not set here. Set it when the key is loaded via setExternalUserGroupKey().
 * @param {string} authId The authentication id that shall be used to log in the user.
 * @param {string} userId The user id of the user.
 * @param {string} password The password matching the authentication token.
 * @param {string} saltHex The salt that was used to salt the password, as hex string.
 * @param {function(tutao.rest.EntityRestException=)} callback Called when login is finished. Provides an exception if the login failed.
 */
tutao.ctrl.UserController.prototype.loginExternalUser = function(authId, userId, password, saltHex, callback) {
	var self = this;
	this.reset();
	tutao.locator.kdfCrypter.generateKeyFromPassphrase(password, saltHex, function(hexKey) {
		var passwordKey = tutao.locator.aesCrypter.hexToKey(hexKey);
		// the next three attributes must be set here because they are needed when loading the user
		self._authId = authId;
		self._userId = userId;
		// the verifier is always sent as url parameter, so it must be url encoded
		self._authVerifier = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.shaCrypter.hashHex(hexKey));
		self._authToken = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.shaCrypter.hashHex(saltHex));
		tutao.entity.sys.User.load(userId, function(user, e2) {
			if (e2) {
				callback(null, e2);
				return;
			}
			self._user = user;
			self._userGroupId = user.getUserGroup().getGroup();
			self._userClientKey = tutao.locator.aesCrypter.generateRandomKey(); // dummy key is needed in Indexer
			callback(passwordKey);
		});
	});
};

/**
 * Sets the user group key of an external user.
 * @param {Object} userGroupKey The user group's key. Call this after the login was successful.
 */
tutao.ctrl.UserController.prototype.setExternalUserGroupKey = function(userGroupKey) {
	this._userGroupKey = userGroupKey;
};

/**
 * Provides the information if an external user is logged in.
 * @return {boolean} True if an external user is logged in, false if no user or an internal user is logged in.
 */
tutao.ctrl.UserController.prototype.isExternalUserLoggedIn = function() {
	return (this._authId != null);
};
