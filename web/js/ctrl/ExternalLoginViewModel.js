"use strict";

tutao.provide('tutao.tutanota.ctrl.ExternalLoginViewModel');

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
	this.sentSmsNumberId = ko.observable(null); // the id of the number aggregate to which the last SMS was sent
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
 * @param {String} authInfo The id of the external user and the salt as base64Url concatenated.
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.setup = function(allowAutoLogin, authInfo) {
	var self = this;
	// split mailRef to get user id and salt
	try {
        var userIdLength = tutao.rest.EntityRestInterface.GENERATED_MIN_ID.length;
        self.userId = authInfo.substring(0, userIdLength);
        self.saltHex = tutao.util.EncodingConverter.base64ToHex(tutao.util.EncodingConverter.base64UrlToBase64(authInfo.substring(userIdLength)));
        self.saltHash = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.shaCrypter.hashHex(self.saltHex));
	} catch (e) {
		this.errorMessageId("invalidLink_msg");
		return Promise.reject();
	}

	// TODO (timely) show a spinner until now, switch to the view just after the data has been retrieved.
	// call PassworChannelService to get the user id and password channels
	return tutao.entity.tutanota.PasswordChannelReturn.load({}, self._getAuthHeaders()).then(function(passwordChannelReturn) {
		if (allowAutoLogin) {
			self.autoLoginActive = true;
			return self._tryAutoLogin().caught(function(e) {
                self.phoneNumbers(passwordChannelReturn.getPhoneNumberChannels());
                if (self.phoneNumbers().length == 1) {
                    self.sendPasswordStatus({ type: "neutral", text: "clickNumber_msg" });
                } else {
                    self.sendPasswordStatus({ type: "neutral", text: "chooseNumber_msg" });
                }
            }).lastly(function() {
                self.autoLoginActive = false;
            });
		} else {
			self.phoneNumbers(passwordChannelReturn.getPhoneNumberChannels());
			if (self.phoneNumbers().length == 1) {
				self.sendPasswordStatus({ type: "neutral", text: "clickNumber_msg" });
			} else {
				self.sendPasswordStatus({ type: "neutral", text: "chooseNumber_msg" });
			}
            return Promise.resolve();
		}
	}).caught(tutao.AccessExpiredError, function(e) {
        self.errorMessageId("expiredLink_msg");
    }).caught(tutao.NotAuthenticatedError, function(e) {
        self.errorMessageId("invalidLink_msg");
    }).caught(tutao.BadRequestError, function(e) {
        self.errorMessageId("invalidLink_msg");
    });
};

/**
 * Loads the device key.
 * @return {Promise.<Object>} Resolves to the device key, rejected if loading the device key failed.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._loadDeviceKey = function() {
	var params = {};
	return tutao.entity.sys.AutoLoginDataReturn.load(new tutao.entity.sys.AutoLoginDataGet()
        .setUserId(this.userId)
        .setDeviceToken(this.deviceToken), params, null).then(function(autoLoginDataReturn) {
			var deviceKey = tutao.locator.aesCrypter.hexToKey(tutao.util.EncodingConverter.base64ToHex(autoLoginDataReturn.getDeviceKey()));
			return deviceKey;
	});
};

/**
 * Tries to login the user automatically.
 * @return {Promise.<>} Resolved when finished, rejected if auto login failed.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._tryAutoLogin = function() {
	var self = this;
	this.deviceToken = tutao.tutanota.util.LocalStore.load('deviceToken_' + this.userId);
	var deviceEncPassword = tutao.tutanota.util.LocalStore.load('deviceEncPassword_' + this.userId);
	if (this.deviceToken == null || deviceEncPassword == null) {
		return Promise.reject(new Error("no device token or password available"));
	}
	return this._loadDeviceKey().then(function(deviceKey) {
		var password = null;
		try {
			password = tutao.locator.aesCrypter.decryptUtf8(deviceKey, deviceEncPassword);
		} catch (e) { //tutao.tutadb.crypto.CryptoException
			return Promise.reject(e);
		}
		return self._tryLogin(password);
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
 * @param {string} numberId The aggregate id of the number.
 * @return {Object} Status object with type and text.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.getSendSmsStatus = function(numberId) {
	if (this.sentSmsNumberId() == numberId) {
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
 * @param {tutao.entity.tutanota.PasswordChannelPhoneNumber} phoneNumber The phone number so send the SMS to.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.sendSms = function(phoneNumber) {
	if (!this.sendSmsAllowed()) {
		return;
	}
	// reuse the transmission password to allow receiving the key if the SMS was requested a second time, but the SMS link of the first SMS was clicked
	if (this.symKeyForPasswordTransmission == null) {
        if (tutao.locator.randomizer.isReady()) {
            this.symKeyForPasswordTransmission = tutao.locator.aesCrypter.generateRandomKey();
        } else {
            // it must be created from Math.random() because the Randomizer is not yet fully initialized. Nevertheless this is no security problem because the server knows the password anyway.
            var hex = "";
            for (var i=0; i<16; i++) {
                var r = Math.floor(Math.random() * 256).toString(16);
                if (r.length == 1) {
                    r = "0" + r;
                }
                hex += r;
            }
            this.symKeyForPasswordTransmission = tutao.locator.aesCrypter.hexToKey(hex);
        }
	}
	
	var self = this;
	var service = new tutao.entity.tutanota.PasswordMessagingData()
        .setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
	    .setNumberId(phoneNumber.getId())
	    .setSymKeyForPasswordTransmission(tutao.locator.aesCrypter.keyToBase64(this.symKeyForPasswordTransmission));
	var map = {};
	this.sentSmsNumberId(phoneNumber.getId());
	this.state.event("sendSms");
	this.sendSmsStatus({ type: "neutral", text: "sendingSms_msg" });
	service.setup(map, this._getAuthHeaders()).then(function(passwordMessagingReturn) {
        self.autoAuthenticationId(passwordMessagingReturn.getAutoAuthenticationId());
        self.sendSmsStatus({ type: "valid", text: "smsSent_msg" });
        self.passphraseFieldFocused(true);
        self.smsLocked(true);
        self._allowSmsAfterDelay();
		self.state.event("sendSmsFinished");
	}).caught(tutao.TooManyRequestsError, function(exception) {
            self.sendSmsStatus({ type: "invalid", text: "smsSentOften_msg" });
            self.smsLocked(true);
    }).caught(tutao.AccessExpiredError, function(e) {
        self.errorMessageId("expiredLink_msg");
    }).caught(tutao.InternalServerError, function() {
        self.sendSmsStatus({ type: "invalid", text: "smsError_msg" });
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
	if (!this.showMailAllowed()) {
		return;
	}
	this._tryLogin(this.password());
};

/**
 * Must be called after password entry. Loads the communication key via ExternalMailReference, initializes the users mailbox and shows the mails.
 * @param {string} password The password to try the login with.
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._tryLogin = function(password) {
    var self = this;
    self.state.event("checkPassword");
    self.passwordStatus({ type: "neutral", text: "emptyString_msg" });
    self.showMailStatus({ type: "neutral", text: "loadingMail_msg" });
    return tutao.locator.userController.loginExternalUser(self.userId, password, self.saltHex).then(function() {
        self.state.event("passwordValid");
        return tutao.locator.loginViewModel.loadEntropy().then(function() {
            return tutao.locator.mailBoxController.initForUser().then(function() {
                return self._storePasswordIfPossible(password).then(function() {
                    // no indexing for external users
                    tutao.locator.replace('dao', new tutao.db.DummyDb);
                    self._showingMail = true;
                    tutao.entity.sys.ExternalPropertiesReturn.load({}, null).then(function (data) {
                        if (data.getAccountType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE) {
                            tutao.locator.mailView.setWelcomeMessage(tutao.lang("externalWelcomeMessageFree_msg"));
                        } else {
                            tutao.locator.mailView.setWelcomeMessage(data.getMessage());
                        }
                        var properties = new tutao.entity.sys.CustomerProperties()
                            .setSmallLogo(data.getSmallLogo())
                            .setBigLogo(data.getBigLogo());
                        tutao.locator.viewManager.updateLogos(properties);
                        tutao.locator.mailListViewModel.loadInitial();
                        tutao.locator.navigator.mail();
                    });
                });
            });
        });
    }).caught(tutao.AccessExpiredError, function(e) {
            self.errorMessageId("expiredLink_msg");
    }).caught(tutao.NotAuthenticatedError, function(e) {
        if (tutao.tutanota.util.LocalStore.contains('deviceToken_' + self.userId)){
            // device is not authenticated by server, so delete the device token locally
            tutao.tutanota.util.LocalStore.remove('deviceToken_' + self.userId);
			tutao.tutanota.util.LocalStore.remove('deviceEncPassword_' + self.userId);
            self.deviceToken = null;
        }
        self.state.event("passwordInvalid");
        self.passwordStatus({ type: "invalid", text: "invalidPassword_msg" });
        self.showMailStatus({ type: "neutral", text: "emptyString_msg" });
    });
};

/**
 * Stores the password locally if chosen by user.
 * @param {string} password The password to store.
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._storePasswordIfPossible = function(password) {
	var self = this;
	// if auto login is active, the password is already stored and valid
	if (!self.autoLoginActive && self.storePassword()) {
		if (!self.deviceToken) {
			// register the device and store the encrypted password
			var deviceService = new tutao.entity.sys.AutoLoginDataReturn();
			var deviceKey = tutao.locator.aesCrypter.generateRandomKey();
			deviceService.setDeviceKey(tutao.util.EncodingConverter.hexToBase64(tutao.locator.aesCrypter.keyToHex(deviceKey)));
			return deviceService.setup({}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(autoLoginPostReturn) {
				if (tutao.tutanota.util.LocalStore.store('deviceToken_' + self.userId, autoLoginPostReturn.getDeviceToken())) {
					var deviceEncPassword = tutao.locator.aesCrypter.encryptUtf8(deviceKey, password);
					tutao.tutanota.util.LocalStore.store('deviceEncPassword_' + self.userId, deviceEncPassword);
				}
			}).caught(function (e) {
                // do nothing
            });
		} else {
			// the device is already registered, so only store the encrypted password
			return self._loadDeviceKey().then(function(deviceKey) {
				var deviceEncPassword = tutao.locator.aesCrypter.encryptUtf8(deviceKey, password);
				tutao.tutanota.util.LocalStore.store('deviceEncPassword_' + self.userId, deviceEncPassword);
			}).caught(function (e) {
                // do nothing
            });
		}
	} else if (!self.autoLoginActive && !self.storePassword()) {
        // delete any stored password
        if (tutao.tutanota.util.LocalStore.contains('deviceToken_' + self.userId)) {
            var token = tutao.tutanota.util.LocalStore.load('deviceToken_' + self.userId);
            new tutao.entity.sys.AutoLoginDataDelete()
                .setDeviceToken(token).erase({}).caught(function(){
                    // Ignore errors
                });
            tutao.tutanota.util.LocalStore.remove('deviceToken_' + self.userId);
            tutao.tutanota.util.LocalStore.remove('deviceEncPassword_' + self.userId);
        }
		return Promise.resolve();
	} else {
        return Promise.resolve();
	}
};

tutao.tutanota.ctrl.ExternalLoginViewModel.prototype.retrievePassword = function() {
    if (this._showingMail) {
		return;
	}
    var input = new tutao.entity.tutanota.PasswordRetrievalData()
        .setAutoAuthenticationId(this.autoAuthenticationId());
	var self = this;
	tutao.entity.tutanota.PasswordRetrievalReturn.load(input, {}, this._getAuthHeaders()).then(function(passwordRetrievalReturn) {
		if (passwordRetrievalReturn.getTransmissionKeyEncryptedPassword() == "") {
			self.retrievePassword(); // timeout, retry to get the password immediately
		} else if (!self._showingMail){
			var password;
			try {
				// no initialization vector because it must fit into an SMS
				password = tutao.locator.aesCrypter.decryptUtf8Index(self.symKeyForPasswordTransmission, passwordRetrievalReturn.getTransmissionKeyEncryptedPassword());
			} catch (e) {
				self.state.event("passwordInvalid");
				self.passwordStatus({ type: "invalid", text: "invalidPassword_msg" });
				self.showMailStatus({ type: "neutral", text: "emptyString_msg" });
				return;
			}
			self._tryLogin(password);
		}
	}).caught(function(exception) {
        self.sendPasswordStatus({ type: "invalid", text: "smsError_msg" });
        throw exception;
    });
};

/**
 * Creates the parameter map for authenticating with the remote services.
 * @return {Object.<String, String>} the parameters.
 */
tutao.tutanota.ctrl.ExternalLoginViewModel.prototype._getAuthHeaders = function() {
	var headers = {};
	headers[tutao.rest.ResourceConstants.USER_ID_PARAMETER_NAME] = this.userId;
	headers[tutao.rest.ResourceConstants.AUTH_TOKEN_PARAMETER_NAME] = this.saltHash;
	return headers;
};
