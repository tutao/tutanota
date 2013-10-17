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
	this.authToken = null;
	this.mailListId = null;
	this.mailId = null;
	this.salt = null;

	this.phoneNumbers = ko.observableArray();

	this.userMessageId = ko.observable("emptyString_msg");
	this.smsLocked = ko.observable(false);

	this.errorMessageId = ko.observable(null);

	this.password = ko.observable("");
	this.password.subscribe(function() {
		this.passwordStatus({ type: "neutral", text: "enterPassword_msg" });
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
	this.storePassword = ko.observable(true);
	
	var s = new tutao.tutanota.util.StateMachine();
	this.state = s;
	s.addState("EnterPassword",         {});
	s.addState("SendingSms",            {});
	s.addState("CheckingPassword",       {});
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
	this.passwordStatus = ko.observable({ type: "neutral", text: "enterPassword_msg" });
	this.showMailStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });
};

/**
 * Initializes the view model with a set of provided parameters and retrieves the phone numbers from the server.
 * @param {String} mailRef The id of the external mail reference instance
 * @param {function} callback Called when finished.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.setup = function(mailRef, callback) {
	var self = this;
	var params = {};
	params[tutao.rest.ResourceConstants.ID_PARAMETER_NAME] = mailRef;
	tutao.entity.tutanota.ExternalMailReferenceReturn.load(params, null, function(refData, exception) {
		if (exception) {
			self.errorMessageId("invalidLink_msg");
			console.log("error");
			return;
		}
		self.userId = refData.getUserId();
		self.mailListId = refData.getMail()[0];
		self.mailId = refData.getMail()[1];
		self.authToken = refData.getAuthToken();
		self.salt = refData.getSalt();
		
		self._tryAutoLogin(function(exception) {
			if (exception) {
				self._showPhoneNumberSelection(callback);
			} else {
				callback();
			}
		});
	});
};

/**
 * Loads the device key.
 * @param {?Object, function(tutao.rest.EntityRestException=)} callback Called when finished. Receives the device key or an exception if loading the device key failed.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._loadDeviceKey = function(callback) {
	var params = {};
	params[tutao.rest.ResourceConstants.USER_ID_PARAMETER_NAME] = this.userId;
	params[tutao.rest.ResourceConstants.DEVICE_TOKEN_PARAMETER_NAME] = this.deviceToken;
	tutao.entity.sys.AutoLoginDataReturn.load(params, null, function(autoLoginDataReturn, exception) {
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
	var deviceEncPassword = tutao.tutanota.util.LocalStore.load('deviceEncPassword_' + this.authToken);
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
		var saltHex = tutao.util.EncodingConverter.base64ToHex(self.salt);
		tutao.locator.userController.loginExternalUser(self.userId, password, saltHex, self.authToken, function(exception) {
			if (exception) {
				callback(exception);
				return;
			}
			self._showMail(function(exception) {
				if (exception) {
					callback(exception);
				} else {
					callback();
				}
			});
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
		self.userMessageId("smsResent_msg");
	}, 60000);
};
	
/**
 * Shows the available phone numbers.
 * @param {function} callback Called when finished.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._showPhoneNumberSelection = function(callback) {
	var self = this;
	// TODO (before beta) extend with callback and show a spinner until now, switch to the view just after the data has been retrieved.
	tutao.entity.tutanota.PasswordChannelReturn.load({}, self._getAuthHeaders(), function(passwordChannelReturn, exception) {
		if (exception) {
			self.errorMessageId("invalidLink_msg");
			callback();
			return;
		}
		self.phoneNumbers(passwordChannelReturn.getPhoneNumberChannels());
		if (self.phoneNumbers().length == 0) {
			self.userMessageId("enterPresharedPassword_msg");
		} else {
			self.userMessageId("chooseNumber_msg");
		}
		callback();
	});
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
	this.symKeyForPasswordTransmission = tutao.locator.aesCrypter.generateRandomKey();
	
	var self = this;
	var service = new tutao.entity.tutanota.PasswordMessagingData();
	service.setNumber(phoneNumber.getNumber());
	service.setSymKeyForPasswordTransmission(tutao.locator.aesCrypter.keyToBase64(this.symKeyForPasswordTransmission));
	var map = {};
	map[tutao.rest.ResourceConstants.LANGUAGE_PARAMETER_NAME] = tutao.locator.languageViewModel.getCurrentLanguage();
	this.sentSmsNumber(phoneNumber.getNumber());
	this.state.event("sendSms");
	this.sendSmsStatus({ type: "neutral", text: "sendingSms_msg" });
	service.setup(map, this._getAuthHeaders(), function(passwordMessagingReturn, exception) {
		if (exception) {
			if ((exception.getOriginal() instanceof tutao.rest.RestException) && (exception.getOriginal().getResponseCode() == 429)) {
				self.sendSmsStatus({ type: "invalid", text: "smsSentOften_msg" });
				self.smsLocked(true);
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
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.showMail = function() {
	var self = this;
	if (!this.showMailAllowed()) {
		return;
	}
	var saltHex = tutao.util.EncodingConverter.base64ToHex(this.salt);
	this.state.event("checkPassword");
	self.passwordStatus({ type: "neutral", text: "emptyString_msg" });
	self.showMailStatus({ type: "neutral", text: "loadingMail_msg" });
	tutao.locator.userController.loginExternalUser(this.userId, this.password(), saltHex, this.authToken, function(exception) {
		if (exception) {
			self.state.event("passwordInvalid");
			self.passwordStatus({ type: "invalid", text: "invalidPassword_msg" });
			self.showMailStatus({ type: "neutral", text: "emptyString_msg" });
			console.log("handle technical exceptions (depending on HTTP response code)");
			return;
		}
		
		self._storePasswordIfPossible(function() {
			self._showMail(function(exception) {
				if (exception) {
					self.state.event("passwordInvalid");
					self.passwordStatus({ type: "invalid", text: "invalidPassword_msg" });
					self.showMailStatus({ type: "neutral", text: "emptyString_msg" });
					console.log("handle technical exceptions (depending on HTTP response code)");
				} else {
					self.state.event("passwordValid");
				}
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
	if (self.storePassword()) {
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
					tutao.tutanota.util.LocalStore.store('deviceEncPassword_' + self.authToken, deviceEncPassword);
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
				tutao.tutanota.util.LocalStore.store('deviceEncPassword_' + self.authToken, deviceEncPassword);
				callback();
			});
		}
	} else {
		callback();
	}
};


/**
 * Switches to the mailView and displays the mail if the provided password is correct.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._showMail = function(callback) {
	var self = this;
	tutao.entity.tutanota.Mail.load([self.mailListId, self.mailId], function(mail, exception) {
		if (exception) {
			callback(exception);
		} else {
			self._showingMail = true;
			tutao.locator.navigator.mail(mail);
			callback();
		}
	});
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
			self.userMessageId("smsError_msg");
		} else if (passwordRetrievalReturn.getTransmissionKeyEncryptedPassword() == "") {
			self.retrievePassword(); // timeout, retry to get the password immediately
		} else if (!self._showingMail){
			self.password(tutao.locator.aesCrypter.decryptUtf8(self.symKeyForPasswordTransmission, passwordRetrievalReturn.getTransmissionKeyEncryptedPassword()));
			self.showMail();
		}
	});
};

/**
 * Creates the parameter map for authenticating with the remote services.
 * @return {Object.<String, String>} the parameters.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._getAuthHeaders = function() {
	var params = {};
	params[tutao.rest.ResourceConstants.AUTH_TOKEN_PARAMETER_NAME] = this.authToken;
	params[tutao.rest.ResourceConstants.MAIL_LIST_ID_PARAMETER_NAME] = this.mailListId;
	params[tutao.rest.ResourceConstants.MAIL_ELEMENT_ID_PARAMETER_NAME] = this.mailId;
	return params;
};
