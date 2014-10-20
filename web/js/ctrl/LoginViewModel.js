"use strict";

tutao.provide('tutao.tutanota.ctrl.LoginViewModel');

/**
 * The ViewModel for the Login template.
 * @constructor
 */
tutao.tutanota.ctrl.LoginViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.welcomeTextId = ko.observable("welcome_msg");
	this.welcomeText = ko.computed(function() {
		return tutao.locator.languageViewModel.get(this.welcomeTextId());
	}, this, {deferEvaluation: true});

	this.mailAddress = ko.observable("");
	var address = tutao.tutanota.util.LocalStore.load('userMailAddress');
	if (address) {
		this.mailAddress(address);
	}
	this.mailAddressFieldFocused = ko.observable(false);
	this.passphrase = ko.observable("");
	this.passphraseFieldFocused = ko.observable(false);

	var emptyString = "\u2008"; // an empty string or normal whitespace makes the label collapse, so enter this invisible character
	this.loginStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });
	this.loginOngoing = ko.observable(false);
    this.storePassword = ko.observable(false);

	this.mailAddress.subscribe(function(newValue) {
	    this.loginStatus({ type: "neutral", text: "emptyString_msg" });
	}, this);
	this.passphrase.subscribe(function(newValue) {
	    this.loginStatus({ type: "neutral", text: "emptyString_msg" });
	}, this);
	
	this.loginPossible = ko.computed(function() {
		return (!this.loginOngoing());
	}, this);

    this.config = new tutao.native.DeviceConfig();
    this.autoLoginActive = false;
};

/**
 * Sets the focus when the view is shown.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.activate = function() {
	var self = this;
	setTimeout(function() {
		if (self.mailAddress() == "") {
			self.mailAddressFieldFocused(true);
		} else {
			self.passphraseFieldFocused(true);
		}
	}, 0);
};

/**
 * Sets the given mail address as login mail address.
 * @param {string} mailAddress The mail address.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.setMailAddress = function(mailAddress) {
	this.mailAddress(mailAddress);
};

/**
 * Sets the id of the welcome text that shall be shown (see tutao.tutanota.ctrl.LanguageViewModel).
 * @param {string} id The id of the welcome text.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.setWelcomeTextId = function(id) {
	this.welcomeTextId(id);
};

/**
 * Logs the user in, if allowAutoLogin is true and the user has stored a password
 * @param {bool} allowAutoLogin Indicates if auto login is allowed (not allowed if logout was clicked)
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.setup = function(allowAutoLogin) {
    var self = this;
    return tutao.locator.configFacade.read().then(function (config) {
        if (config) {
            self.config = config;
            if (allowAutoLogin && self.config.encryptedPassword) {
                return self._tryAutoLogin();
            } else if (!allowAutoLogin) {
                // remove authentication data
                self.config.encryptedPassword = null;
                return tutao.locator.configFacade.write(self.config);
            }
        }
    });
};

/**
 * Logs a user into the system:
 * <ul>
 *   <li>Sets the logged in user on the UserController
 *   <li>Initializes the DBFacade for the user
 *   <li>Switches to the MailView
 * </ul>
 * @return {Promise.<>} Resolves when finished, rejected if failed.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.login = function() {
	var self = this;
	if (!this.loginPossible()) {
		Promise.reject();
	}
	this.loginOngoing(true);
	// in private browsing mode in mobile safari local storage is not available and throws an exception
	this.passphraseFieldFocused(false);
	tutao.tutanota.util.LocalStore.store('userMailAddress', this.mailAddress());
	return tutao.locator.userController.loginUser(self.mailAddress(), self.passphrase()).then(function () {
        return self._storePassword().then(function () {
            self.passphrase("");
        });
    }).then(function() {
        return self.postLoginActions();
    }).caught(tutao.AccessBlockedError, function() {
        self.loginStatus({ type: "invalid", text: "loginFailedOften_msg" });
    }).caught(tutao.NotAuthenticatedError, function(exception) {
        self.loginStatus({ type: "invalid", text: "loginFailed_msg" });
    }).caught(tutao.AccessDeactivatedError, function() {
        self.loginStatus({ type: "invalid", text: "loginFailed_msg" });
    }).lastly(function() {
        self.loginOngoing(false);
    });
};

tutao.tutanota.ctrl.LoginViewModel.prototype.postLoginActions = function () {
    var self = this;
    return tutao.locator.mailBoxController.initForUser().then(function() {
        // this should be the user id instead of the name later
        return new Promise(function(resolve, reject) {
            tutao.locator.dao.init("Tutanota_" + self.mailAddress(), resolve);
        });
    }).then(function () {
        return self.loadEntropy();
    }).then(function() {
        // load all contacts to have them available in cache, e.g. for RecipientInfos
        return tutao.locator.contactListViewModel.init();
    }).then(function() {
        tutao.locator.eventBus.connect(false);
        tutao.locator.navigator.mail();
    });
};

/**
 * Loads entropy from the last logout. Fetches missing entropy if none was stored yet and stores it.
 * @return {Promise.<>} Resolves when finished, rejected if failed.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.loadEntropy = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        try  {
            var groupEncEntropy = tutao.locator.mailBoxController.getUserProperties().getGroupEncEntropy();
            if (!groupEncEntropy) {
                tutao.locator.entropyCollector.fetchMissingEntropy(function() {
                    self.storeEntropy();
                    resolve();
                });
            } else {
                var entropy = tutao.locator.aesCrypter.decryptBytes(tutao.locator.userController.getUserGroupKey(), groupEncEntropy);
                tutao.locator.entropyCollector.addStaticEntropy(entropy);
                resolve();
            }
        } catch (exception) {
            reject(exception);
        }
    });
};

/**
 * Stores entropy from the randomizer for the next login.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.storeEntropy = function() {
    var groupEncEntropy = tutao.locator.aesCrypter.encryptBytes(tutao.locator.userController.getUserGroupKey(), tutao.util.EncodingConverter.hexToBase64(tutao.locator.randomizer.generateRandomData(32)));
    tutao.locator.mailBoxController.getUserProperties().setGroupEncEntropy(groupEncEntropy);
    tutao.locator.mailBoxController.getUserProperties().update();
};

tutao.tutanota.ctrl.LoginViewModel.prototype.createAccount = function() {
    tutao.locator.navigator.register();
};

/**
 * Stores the password locally if chosen by user.
 * @param {string} password The password to store.
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype._storePassword = function() {
    var self = this;
    // if auto login is active, the password is already stored and valid
    if (self.storePassword()) {
        var promise = null;
        if (!self.config.deviceToken) {
            // register the device and store the encrypted password
            var deviceService = new tutao.entity.sys.AutoLoginDataReturn();
            var deviceKey = tutao.locator.aesCrypter.generateRandomKey();
            deviceService.setDeviceKey(tutao.util.EncodingConverter.hexToBase64(tutao.locator.aesCrypter.keyToHex(deviceKey)));
            promise = deviceService.setup({}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(autoLoginPostReturn) {
                self.config.deviceToken = autoLoginPostReturn.getDeviceToken();
                var deviceEncPassword = tutao.locator.aesCrypter.encryptUtf8(deviceKey, self.passphrase());
                self.config.encryptedPassword = deviceEncPassword;
            });
        } else {
            // the device is already registered, so only store the encrypted password
            promise = self._loadDeviceKey().then(function(deviceKey) {
                var deviceEncPassword = tutao.locator.aesCrypter.encryptUtf8(deviceKey, self.passphrase());
                self.config.encryptedPassword = deviceEncPassword;
            });
        }
        return promise.then(function () {
            self.config.userId = tutao.locator.userController.getUserId();
            tutao.locator.configFacade.write(self.config);
        });
    } else if (!self.autoLoginActive && !self.storePassword()) {
        // delete any stored password
        if (self.config.deviceToken || self.config.encryptedPassword) {
            self.config.deviceToken = null;
            self.config.encryptedPassword = null;
            tutao.locator.configFacade.write(self.config);
        }
        return Promise.resolve();
    } else {
        return Promise.resolve();
    }
};

/**
 * Tries to login the user automatically.
 * @return {Promise.<>} Resolved when finished, rejected if auto login failed.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype._tryAutoLogin = function() {
    var self = this;
    if (this.config.deviceToken == null || this.config.encryptedPassword == null) {
        return Promise.reject(new Error("no device token or password available"));
    }
    return this._loadDeviceKey().then(function(deviceKey) {
        var password = null;
        try {
            password = tutao.locator.aesCrypter.decryptUtf8(deviceKey, self.config.encryptedPassword);
        } catch (e) { //tutao.tutadb.crypto.CryptoException
            return Promise.reject(e);
        }
        self.passphrase(password);
        self.autoLoginActive = true;
        return self.login().then(function () {
            self.autoLoginActive = false;
        });
    });
};


/**
 * Loads the device key.
 * @return {Promise.<Object>} Resolves to the device key, rejected if loading the device key failed.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype._loadDeviceKey = function() {
    var params = {};
    // use the userId of the currently logged in user, if a user is logged in. If not, use the one from our config.
    var userId = tutao.locator.userController.getUserId() ? tutao.locator.userController.getUserId() : this.config.userId;
    return tutao.entity.sys.AutoLoginDataReturn.load(new tutao.entity.sys.AutoLoginDataGet()
        .setUserId(userId)
        .setDeviceToken(this.config.deviceToken), params, null).then(function(autoLoginDataReturn) {
        var deviceKey = tutao.locator.aesCrypter.hexToKey(tutao.util.EncodingConverter.base64ToHex(autoLoginDataReturn.getDeviceKey()));
        return deviceKey;
    });
};
