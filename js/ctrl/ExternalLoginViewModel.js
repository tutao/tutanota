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

	this.userMessageId = ko.observable(null);
	this.smsBusy = ko.observable(false);
	this.loginBusy = ko.observable(false);
	var resetUserMsgId = function(busy) {
		if (busy) {
			self.userMessageId(null);
		}
	};
	this.loginBusy.subscribe(resetUserMsgId); // if we do not hide the msg immediately, the old message will fade in (and then be replaced) after the busy state is over.
	this.smsBusy.subscribe(resetUserMsgId);
	this.smsLocked = ko.observable(false); // disables the send sms button for 60s
	this.smsLocked.subscribe(function(locked) {
		if (locked) {
			setTimeout(function() {
				self.smsLocked(false);
				self.userMessageId("smsResent_msg");
			}, 60000);
		}
	});

	this.errorMessageId = ko.observable(null);

	this.password = ko.observable("");
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
			self.errorMessageId("invalidLink_msg"); //TODO error handling
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

	this.userMessageId("enterPW_msg");
};

/**
 * Loads the device key.
 * @param {?Object, function(tutao.rest.EntityRestException=)} callback Called when finished. Receives the device key or an exception if loading the device key failed.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._loadDeviceKey = function(callback) {
	var params = {};
	params[tutao.rest.ResourceConstants.USER_ID_PARAMETER_NAME] = this.userId;
	params[tutao.rest.ResourceConstants.DEVICE_TOKEN_PARAMETER_NAME] = this.deviceToken;
	tutao.entity.sys.AutoLoginService.load(params, null, function(deviceData, exception) {
		if (exception) {
			callback(null, exception);
		} else {
			var deviceKey = tutao.locator.aesCrypter.hexToKey(tutao.util.EncodingConverter.base64ToHex(deviceData.getDeviceKey()));
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
 * Shows the available phone numbers.
 * @param {function} callback Called when finished.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._showPhoneNumberSelection = function(callback) {
	var self = this;
	// TODO extend with callback and show a spinner until now, switch to the view just after the data has been retrieved.
	tutao.entity.tutanota.PasswordChannelReturn.load({}, self._getAuthHeaders(), function(pwChannelService, exception) {
		if (exception) {
			self.errorMessageId("invalidLink_msg");
			callback();
			return;
		}
		self.phoneNumbers(pwChannelService.getPhoneNumberChannels());
		// TODO extend with callback and show a spinner until now, switch to the view just after the data has been retrieved.
		callback();
	});
};

/**
 * Sends the password message to the provided phone number.
 * @param phoneNumber
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.sendSms = function(phoneNumber) {
	if (this.smsBusy() || this.smsLocked()) {
		return;
	}
	this.symKeyForPasswordTransmission = tutao.locator.aesCrypter.generateRandomKey();
	
	var self = this;
	var service = new tutao.entity.tutanota.PasswordMessagingService();
	service.setNumber(phoneNumber.getNumber());
	service.setSymKeyForPasswordTransmission(tutao.locator.aesCrypter.keyToBase64(this.symKeyForPasswordTransmission));
	self.smsBusy(true);
	var map = {};
	map[tutao.rest.ResourceConstants.LANGUAGE_PARAMETER_NAME] = tutao.locator.languageViewModel.getCurrentLanguage();
	service.setup(map, this._getAuthHeaders(), function(result, exception) {
		if (exception) {
			if ((exception.getOriginal() instanceof tutao.rest.RestException) && (exception.getOriginal().getResponseCode() == 429)) {
				self.userMessageId("smsSentOften_msg");
			} else {
				self.userMessageId("smsError_msg");
			}
		} else {
			self.autoAuthenticationId(result[0]);
			self.userMessageId("smsSent_msg");
			self.passphraseFieldFocused(true);
			self.smsLocked(true);
		}
		self.smsBusy(false);
	});
};

/**
 * Verifies that the password length is valid
 * @return {boolean} true, if the password is valid.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.isPasswordLengthValid = function() {
	return this.password().length === tutao.tutanota.util.PasswordUtils.MESSAGE_PASSWORD_LENGTH;
};

/**
 * Switches to the mailView and displays the mail if the provided password is correct.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.showMail = function() {
	var self = this;
	if (!this.isPasswordLengthValid() || this.loginBusy()) {
		return;
	}
	var saltHex = tutao.util.EncodingConverter.base64ToHex(this.salt);
	this.loginBusy(true);
	tutao.locator.userController.loginExternalUser(this.userId, this.password(), saltHex, this.authToken, function(exception) {
		if (exception) {
			self.loginBusy(false);
			self.userMessageId("invalidPassword_msg"); //TODO handle technical exceptions (depending on HTTP response code)
			return;
		}
		
		self._storePasswordIfPossible(function() {
			self._showMail(function(exception) {
				self.loginBusy(false);
				if (exception) {
					self.userMessageId("invalidPassword_msg"); //TODO handle technical exceptions (depending on HTTP response code)
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
			var deviceService = new tutao.entity.sys.AutoLoginService();
			var deviceKey = tutao.locator.aesCrypter.generateRandomKey();
			deviceService.setDeviceKey(tutao.util.EncodingConverter.hexToBase64(tutao.locator.aesCrypter.keyToHex(deviceKey)));
			deviceService.setup({}, tutao.entity.EntityHelper.createAuthHeaders(), function(deviceToken, exception) {
				if (exception) {
					callback();
					return;
				}
				if (tutao.tutanota.util.LocalStore.store('deviceToken_' + self.userId, deviceToken)) {
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
	tutao.entity.tutanota.PasswordRetrievalService.load(params, null, function(result, exception) {
		if (exception) {
			self.userMessageId("smsError_msg");
		} else if (result.getTransmissionKeyEncryptedPassword() == "") {
			self.retrievePassword(); // timeout, retry to get the password immediately
		} else if (!self._showingMail){
			self.password(tutao.locator.aesCrypter.decryptUtf8(self.symKeyForPasswordTransmission, result.getTransmissionKeyEncryptedPassword()));
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
