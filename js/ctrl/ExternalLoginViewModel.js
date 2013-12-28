"use strict";

goog.provide('tutao.tutanota.ctrl.ExternalLoginViewModel');

/**
 * The ViewModel for the externalLogin-template.
 * @constructor
 */
tutao.tutanota.ctrl.ExternalLoginViewModel = function() {
	var self = this;
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.userId = null;
	this.mailListId = null;
	this.mailId = null;
	this.saltHex = null;

	// for authentication as long as verifier is not available
	this.saltHash = null;
	this.externalMailReference = null;

	this.phoneNumbers = ko.observableArray();
	this.phoneNumbers.subscribe(function() {
		this.resetPasswordStatus();
	}, this);

	this.sendPasswordStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });
	this.smsLocked = ko.observable(false);

	this.errorMessageId = ko.observable(null);

	this.password = ko.observable("");
	this.password.subscribe(function() {
		this.resetPasswordStatus();
	}, this);
	this.passphraseFieldFocused = ko.observable(false);
	this.symKeyForPasswordTransmission = null;
	this.autoAuthenticationId = ko.observable(null);
	this.autoAuthenticationId.subscribe(function(newAutoAuthenticationId) {
		this.retrievePassword();
	}, this);
	this._showingMail = false;
	

	// if the window width is small, just show the logo without "Tutanota" to save space
	this.muchSpace = ko.observable(tutao.tutanota.gui.getWindowWidth() >= 640);
	tutao.tutanota.gui.addWindowResizeListener(function(width, height) {
		self.muchSpace(tutao.tutanota.gui.getWindowWidth() >= 640);
	});

	// the device token is removed locally if it is not stored on the server (any more), see setup()
	this.deviceToken = null;
	this.storePassword = ko.observable(false);
	this.autoLoginActive = false;
	
	var s = new tutao.tutanota.util.StateMachine();
	this.state = s;
	s.addState("EnterPassword",         {});
	s.addState("SendingSms",            {});
	s.addState("CheckingPassword",      {});
	s.addState("FinishTooManyAttempts", {});
	s.addState("FinishShowMail",        {});

	s.addTransition("EnterPassword", "sendSms", "SendingSms");
	s.addTransition("SendingSms", "sendSmsFinished", "EnterPassword");
	s.addTransition("EnterPassword", "checkPassword", "CheckingPassword");
	s.addTransition("CheckingPassword", "passwordInvalid", "EnterPassword");
	s.addTransition("CheckingPassword", "passwordValid", "FinishShowMail");
	s.addTransition("CheckingPassword", "passwordTooManyAttempts", "FinishTooManyAttempts");

	this.sendSmsStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });
	this.sentSmsNumber = ko.observable(null); // the number to which the last SMS was sent
	this.showMailStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });
	this.passwordStatus = ko.observable();
	this.resetPasswordStatus();
};

tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.resetPasswordStatus = function() {
	if (this.phoneNumbers().length == 0) {
		this.passwordStatus({ type: "neutral", text: "enterPresharedPassword_msg" });
	} else {
		this.passwordStatus({ type: "neutral", text: "enterSmsPassword_msg" });
	}
};

/**
 * Initializes the view model with a set of provided parameters and retrieves the phone numbers from the server.
 * @param {bool} allowAutoLogin Indicates if auto login is allowed (not allowed if logout was clicked)
 * @param {String} mailRef The id of the external mail reference instance and the salt as base64Url concatenated.
 * @param {function} callback Called when finished.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.setup = function(allowAutoLogin, mailRef, callback) {
	var self = this;
	// split mailRef to get externalMailReferenceId and salt
	try {
		self.saltHex = tutao.util.EncodingConverter.base64ToHex(tutao.util.EncodingConverter.base64UrlToBase64(mailRef.substring(mailRef.length / 2)));
		self.saltHash = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.shaCrypter.hashHex(self.saltHex));
		self.externalMailReference = mailRef.substring(0, mailRef.length / 2);
	} catch (e) {
		this.errorMessageId("invalidLink_msg");
		callback();
		return;
	}
	
	var self = this;
	// TODO (before beta) extend with callback and show a spinner until now, switch to the view just after the data has been retrieved.
	// call PassworChannelService to get the user id and password channels
	tutao.entity.tutanota.PasswordChannelReturn.load({}, self._getAuthHeaders(), function(passwordChannelReturn, exception) {
		if (exception) {
			self._handleException(exception);
			callback();
			return;
		}
		self.userId = passwordChannelReturn.getUserId();
		if (allowAutoLogin) {			
			self.autoLoginActive = true;
			self._tryAutoLogin(function(exception) {
				self.autoLoginActive = false;
				if (exception) {
					self.phoneNumbers(passwordChannelReturn.getPhoneNumberChannels());
					if (self.phoneNumbers().length == 1) {
						self.sendPasswordStatus({ type: "neutral", text: "clickNumber_msg" });
					} else {
						self.sendPasswordStatus({ type: "neutral", text: "chooseNumber_msg" });
					}
				}
				callback();
			});
		} else {
			self.phoneNumbers(passwordChannelReturn.getPhoneNumberChannels());
			if (self.phoneNumbers().length == 1) {
				self.sendPasswordStatus({ type: "neutral", text: "clickNumber_msg" });
			} else {
				self.sendPasswordStatus({ type: "neutral", text: "chooseNumber_msg" });
			}
			callback();
		}
	});
};

tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._handleException = function(exception) {
	if (exception.getOriginal() instanceof tutao.rest.RestException && exception.getOriginal().getResponseCode() == 471) { // AccessExpiredException
		this.errorMessageId("expiredLink_msg");
	} else {
		this.errorMessageId("invalidLink_msg");
	}
};

/**
 * Loads the device key.
 * @param {?Object, function(tutao.rest.EntityRestException=)} callback Called when finished. Receives the device key or an exception if loading the device key failed.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._loadDeviceKey = function(callback) {
	var params = {};
	tutao.entity.sys.AutoLoginDataReturn.load(tutao.entity.sys.AutoLoginDataGet()
        .setUserId(this.userId)
        .setDeviceToken(this.deviceToken), params, null, function(autoLoginDataReturn, exception) {
		if (exception) {
			callback(null, exception);
		} else {
			var deviceKey = tutao.locator.aesCrypter.hexToKey(tutao.util.EncodingConverter.base64ToHex(autoLoginDataReturn.getDeviceKey()));
			callback(deviceKey);
		}
	});
};

/**
 * Tries to login the user automatically.
 * @param {function(tutao.rest.EntityRestException=)} callback Called when finished. Receives exception if auto login failed.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._tryAutoLogin = function(callback) {
	var self = this;
	this.deviceToken = tutao.tutanota.util.LocalStore.load('deviceToken_' + this.userId);
	var deviceEncPassword = tutao.tutanota.util.LocalStore.load('deviceEncPassword_' + this.userId);
	if (this.deviceToken == null || deviceEncPassword == null) {
		callback(new tutao.rest.EntityRestException(new Error("no device token or password available")));
		return;
	}
	this._loadDeviceKey(function(deviceKey, exception) {		
		if (exception) {
			if (exception.getOriginal() instanceof tutao.rest.RestException && exception.getOriginal().getResponseCode() == 401) { // not authenticated
				// device is not authenticated by server, so delete the device token locally
				tutao.tutanota.util.LocalStore.remove('deviceToken_' + this.userId);
				self.deviceToken = null;
			}
			callback(exception);
			return;
		}
		var password = null;
		try {
			password = tutao.locator.aesCrypter.decryptUtf8(deviceKey, deviceEncPassword);
		} catch (e) { //tutao.tutadb.crypto.CryptoException
			callback(new tutao.rest.EntityRestException(e));
			return;
		}
		self.state.event("checkPassword");
		tutao.locator.userController.loginExternalUser(self.externalMailReference, self.userId, password, self.saltHex, function(passwordKey, exception) {
			if (exception) {
				self.state.event("passwordInvalid");
				callback(exception);
				return;
			}
			self.state.event("passwordValid");
			callback();
			self._showMail(passwordKey);
		});
	});
};

/**
 * Unlocks the send SMS button after 60s.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._allowSmsAfterDelay = function() {
	var self = this;
	setTimeout(function() {
		self.smsLocked(false);
		self.sendSmsStatus({ type: "neutral", text: "emptyString_msg" });
		self.sendPasswordStatus({ type: "neutral", text: "smsResent_msg" });
	}, 60000);
};

/**
 * Provides the status for sending an SMS for a given mobile phone number.
 * @param {string} The number.
 * @return {Object} Status object with type and text.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.getSendSmsStatus = function(number) {
	if (this.sentSmsNumber() == number) {
		return this.sendSmsStatus();
	} else {
		return { type: "neutral", text: "emptyString_msg" };
	}
};

/**
 * Provides the information if sending an SMS is allowed (button is enabled).
 * @return {boolean} True if allowed, false otherweise.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.sendSmsAllowed = function() {
	return (!this.smsLocked() && this.state.getState() == "EnterPassword");
};

/**
 * Sends the password message to the provided phone number.
 * @param phoneNumber
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.sendSms = function(phoneNumber) {
	if (!this.sendSmsAllowed()) {
		return;
	}
	// reuse the transmission password to allow receiving the key if the SMS was requested a second time, but the SMS link of the first SMS was clicked
	if (this.symKeyForPasswordTransmission == null) {
		this.symKeyForPasswordTransmission = tutao.locator.aesCrypter.generateRandomKey();
	}
	
	var self = this;
	var service = new tutao.entity.tutanota.PasswordMessagingData()
        .setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
	    .setNumber(phoneNumber.getNumber())
	    .setSymKeyForPasswordTransmission(tutao.locator.aesCrypter.keyToBase64(this.symKeyForPasswordTransmission));
	var map = {};
	this.sentSmsNumber(phoneNumber.getNumber());
	this.state.event("sendSms");
	this.sendSmsStatus({ type: "neutral", text: "sendingSms_msg" });
	service.setup(map, this._getAuthHeaders(), function(passwordMessagingReturn, exception) {
		if (exception) {
			if ((exception.getOriginal() instanceof tutao.rest.RestException) && (exception.getOriginal().getResponseCode() == 429)) { // TooManyRequestsException
				self.sendSmsStatus({ type: "invalid", text: "smsSentOften_msg" });
				self.smsLocked(true);
			} else if (exception.getOriginal() instanceof tutao.rest.RestException && exception.getOriginal().getResponseCode() == 471) { // AccessExpiredException
				self.errorMessageId("expiredLink_msg");
			} else {
				self.sendSmsStatus({ type: "invalid", text: "smsError_msg" });
			}
		} else {
			self.autoAuthenticationId(passwordMessagingReturn.getAutoAuthenticationId());
			self.sendSmsStatus({ type: "valid", text: "smsSent_msg" });
			self.passphraseFieldFocused(true);
			self.smsLocked(true);
			self._allowSmsAfterDelay();
		}
		self.state.event("sendSmsFinished");
	});
};

/**
 * Verifies that the password length is valid
 * @return {boolean} true, if the password is valid.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.isPasswordLengthValid = function() {
	return this.phoneNumbers().length == 0 || this.password().length === tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_LENGTH;
};

/**
 * Provides the information if showing the email is allowed (button is enabled).
 * @return {boolean} True if allowed, false otherweise.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.showMailAllowed = function() {
	return (this.isPasswordLengthValid() && this.state.getState() == "EnterPassword");
};

/**
 * Switches to the mailView and displays the mail if the provided password is correct.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.checkEnteredPassword = function() {
	var self = this;
	if (!this.showMailAllowed()) {
		return;
	}
	this.state.event("checkPassword");
	self.passwordStatus({ type: "neutral", text: "emptyString_msg" });
	self.showMailStatus({ type: "neutral", text: "loadingMail_msg" });
	tutao.locator.userController.loginExternalUser(this.externalMailReference, this.userId, this.password(), this.saltHex, function(passwordKey, exception) {
		if (exception) {
			if (exception.getOriginal() instanceof tutao.rest.RestException && exception.getOriginal().getResponseCode() == 471) { // AccessExpiredException
				self.errorMessageId("expiredLink_msg");
			} else {
				self.state.event("passwordInvalid");
				self.passwordStatus({ type: "invalid", text: "invalidPassword_msg" });
				self.showMailStatus({ type: "neutral", text: "emptyString_msg" });
				return;
			}
		}
		self.state.event("passwordValid");
		self._showMail(passwordKey);
	});
};

/**
 * Must be called after successful login. Loads the communication key via ExternalMailReference, initializes the users mailbox and shows the mails.
 * @param {Object} passwordKey The passwordKey that will be used to decrypt the communication key.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._showMail = function(passwordKey) {
	var self = this;
	tutao.entity.tutanota.ExternalMailReference.load(self.externalMailReference, function(info, exception) {
		if (exception) {
			self._handleException(exception);
			return;
		}
		var communicationKey = tutao.locator.aesCrypter.decryptKey(passwordKey, info.getPwEncCommunicationKey());
		tutao.locator.userController.setExternalUserGroupKey(communicationKey);
		self.mailListId = info.getMail()[0];
		self.mailId = info.getMail()[1];
		
		tutao.locator.mailBoxController.initForUser(function(exception) {
			if (exception) {
				self._handleException(exception);
				return;
			}
			self._storePasswordIfPossible(function() {
				// no indexing for external users
				tutao.locator.replace('dao', new tutao.db.DummyDb);
				self._showingMail = true;
				tutao.locator.mailListViewModel.mailToShow = [self.mailListId, self.mailId];
				tutao.locator.navigator.mail();
			});
		});
	});
};

/**
 * Stores the password locally if chosen by user.
 * @param {function(tutao.rest.EntityRestException=)} callback Called when finished. Callback receives an exception if one occurred.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._storePasswordIfPossible = function(callback) {
	var self = this;
	// if auto login is active, the password is already stored and valid
	if (!self.autoLoginActive && self.storePassword()) {
		if (!self.deviceToken) {
			// register the device and store the encrypted password
			var deviceService = new tutao.entity.sys.AutoLoginDataReturn();
			var deviceKey = tutao.locator.aesCrypter.generateRandomKey();
			deviceService.setDeviceKey(tutao.util.EncodingConverter.hexToBase64(tutao.locator.aesCrypter.keyToHex(deviceKey)));
			deviceService.setup({}, tutao.entity.EntityHelper.createAuthHeaders(), function(autoLoginPostReturn, exception) {
				if (exception) {
					callback();
					return;
				}
				if (tutao.tutanota.util.LocalStore.store('deviceToken_' + self.userId, autoLoginPostReturn.getDeviceToken())) {
					var deviceEncPassword = tutao.locator.aesCrypter.encryptUtf8(deviceKey, self.password());
					tutao.tutanota.util.LocalStore.store('deviceEncPassword_' + self.userId, deviceEncPassword);
				}
				callback();
			});
		} else {
			// the device is already registered, so only store the encrypted password
			self._loadDeviceKey(function(deviceKey, exception) {
				if (exception) {
					callback();
					return;
				}
				var deviceEncPassword = tutao.locator.aesCrypter.encryptUtf8(deviceKey, self.password());
				tutao.tutanota.util.LocalStore.store('deviceEncPassword_' + self.userId, deviceEncPassword);
				callback();
			});
		}
	} else if (!self.storePassword()) {
		// delete any stored password
		if (tutao.tutanota.util.LocalStore.contains('deviceToken_' + self.userId)) {			
			tutao.tutanota.util.LocalStore.remove('deviceToken_' + self.userId);
			tutao.tutanota.util.LocalStore.remove('deviceEncPassword_' + self.userId);
		}
		callback();
	} else {
		callback();
	}
};

tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.retrievePassword = function() {
    if (this._showingMail) {
		return;
	}
	var params = {};
	params[tutao.rest.ResourceConstants.ID_PARAMETER_NAME] = this.autoAuthenticationId();
	var self = this;
	tutao.entity.tutanota.PasswordRetrievalReturn.load(params, null, function(passwordRetrievalReturn, exception) {
		if (exception) {
			self.sendPasswordStatus({ type: "invalid", text: "smsError_msg" });
		} else if (passwordRetrievalReturn.getTransmissionKeyEncryptedPassword() == "") {
			self.retrievePassword(); // timeout, retry to get the password immediately
		} else if (!self._showingMail){
			self.state.event("checkPassword");
			var password;
			try {
				password = tutao.locator.aesCrypter.decryptUtf8(self.symKeyForPasswordTransmission, passwordRetrievalReturn.getTransmissionKeyEncryptedPassword());
			} catch (e) {
				self.state.event("passwordInvalid");
				self.passwordStatus({ type: "invalid", text: "invalidPassword_msg" });
				self.showMailStatus({ type: "neutral", text: "emptyString_msg" });
				return;
			}
			tutao.locator.userController.loginExternalUser(self.externalMailReference, self.userId, password, self.saltHex, function(passwordKey, exception) {
				if (exception) {
					self.state.event("passwordInvalid");
					self.passwordStatus({ type: "invalid", text: "invalidPassword_msg" });
					self.showMailStatus({ type: "neutral", text: "emptyString_msg" });
					return;
				}
				self.state.event("passwordValid");
				self._showMail(passwordKey);
			});
		}
	});
};

/**
 * Creates the parameter map for authenticating with the remote services.
 * @return {Object.<String, String>} the parameters.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._getAuthHeaders = function() {
	var headers = {};
	headers[tutao.rest.ResourceConstants.AUTH_ID_PARAMETER_NAME] = this.externalMailReference;
	headers[tutao.rest.ResourceConstants.AUTH_TOKEN_PARAMETER_NAME] = this.saltHash;
	return headers;
};
