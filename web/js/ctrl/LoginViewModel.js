"use strict";

tutao.provide('tutao.tutanota.ctrl.LoginViewModel');

/**
 * The ViewModel for the Login template.
 * @constructor
 */
tutao.tutanota.ctrl.LoginViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.welcomeTextId = ko.observable(null);
	this.welcomeText = ko.computed(function() {
		return tutao.locator.languageViewModel.get(this.welcomeTextId());
	}, this, {deferEvaluation: true});

	this.mailAddress = ko.observable("");
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

    this.config = new tutao.native.DeviceConfig();
    this.storedCredentials = ko.observableArray(); // all credentials from the config that shall be displayed to the user. if this array is empty the normal login form is shown

    this.loginFinished = ko.observable(false);

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

tutao.tutanota.ctrl.LoginViewModel.prototype.loginPossible = function() {
    return (this.mailAddress().trim() != "" && this.passphrase() != "" && !this.loginOngoing());
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
 * Logs the user in, if allowAutoLogin is true and the user has stored a password. Shows the appropriate view (login or mail view if auto logged in).
 * @param {bool} allowAutoLogin Indicates if auto login is allowed (not allowed if logout was clicked)
 * @return {Promise} Resolved when finished, rejected if setup fails.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.setup = function(allowAutoLogin) {
    var self = this;
    // load the userMailAddress for taking over the last login credentials in the new config version
    var lastLoggedInMailAddress = tutao.tutanota.util.LocalStore.load('userMailAddress');
    if (lastLoggedInMailAddress) {
        lastLoggedInMailAddress = tutao.tutanota.util.Formatter.getCleanedMailAddress(lastLoggedInMailAddress);
    }
    return tutao.locator.configFacade.read(lastLoggedInMailAddress).then(function (config) {
        if (lastLoggedInMailAddress) {
            // clean up and store new config
            tutao.tutanota.util.LocalStore.remove('userMailAddress');
            tutao.locator.configFacade.write(config);
        }
        self.config = config;
        var autoLoginPromise = null;
        if (allowAutoLogin && self.config.getAll().length == 1) {
            autoLoginPromise = self._tryAutoLogin(self.config.getAll()[0]);
        } else {
            autoLoginPromise = Promise.resolve(false);
        }
        return autoLoginPromise.then(function(autoLoginSuccessful) {
            if (!autoLoginSuccessful) {
                self.storedCredentials(self.config.getAll());
                tutao.locator.viewManager.select(tutao.locator.loginView);
            }
        });
    });
};

/**
 * Logs a user into the system:
 * <ul>
 *   <li>Sets the logged in user on the UserController
 *   <li>Initializes the DBFacade for the user
 *   <li>Switches to the MailView
 * </ul>
 * @return {Promise.<bool>} Resolves when finished, rejected in case of exception. Returns true if the login was successful, false otherwise.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.login = function() {
    var self = this;
	if (!this.loginPossible()) {
        // should not happen login is ongoing, may happen if the login button has been clicked twice.
		return Promise.resolve(false);
    }
    this.passphraseFieldFocused(false);
    return this._login(self.mailAddress(), self.passphrase()).then(function(successful) {
        if (successful) {
            return self._storePassword().then(function () {
                self.mailAddress("");
                self.passphrase("");
            });
        }
    });
};

tutao.tutanota.ctrl.LoginViewModel.prototype._login = function(mailAddress, password) {
    var self = this;
    this.loginOngoing(true);
    this.loginStatus({ type: "neutral", text: "login_msg" });
    // in private browsing mode in mobile safari local storage is not available and throws an exception
    return tutao.locator.userController.loginUser(mailAddress, password).then(function () {
        return self.postLoginActions().then(function() {
            return true;
        });
    }).caught(tutao.AccessBlockedError, function() {
        self.loginStatus({ type: "invalid", text: "loginFailedOften_msg" });
        return false;
    }).caught(tutao.NotAuthenticatedError, function() {
        self.loginStatus({ type: "invalid", text: "loginFailed_msg" });
        return false;
    }).caught(tutao.AccessDeactivatedError, function() {
        self.loginStatus({ type: "invalid", text: "loginFailed_msg" });
        return false;
    }).caught(tutao.ConnectionError, function(e) {
        self.loginStatus({ type: "neutral", text: "emptyString_msg" });
        throw e;
    }).lastly(function() {
        self.loginOngoing(false);
    });
};

tutao.tutanota.ctrl.LoginViewModel.prototype.postLoginActions = function () {
    var self = this;
    return self.loadEntropy().then(function() {
       return false; // continue normal flow
    }).caught(function(error) {
        if (error instanceof tutao.NotFoundError) {
            // redo the InitGroupService because it has failed at registration. and fetch entropy before because it could not yet be loaded.
            return new Promise(function (resolve, reject) {
                return tutao.locator.entropyCollector.fetchMissingEntropy(function () {
                    resolve();
                });
            }).then(function () {
                return self._initGroup().then(function() {
                    // the group was not migrated before, so we have to reload all instances
                    tutao.tutanota.Bootstrap.init();
                    tutao.locator.loginViewModel.setup(false);
                    return true; // stop normal flow
                });
            });
        } else {
            throw error;
        }
    }).then(function(stop) {
        if (!stop) {
            return tutao.locator.mailBoxController.initForUser().then(function () {
                if (!tutao.locator.userController.isLoggedInUserFreeAccount()) {
                    return tutao.locator.viewManager.loadCustomLogos();
                } else {
                    return Promise.resolve();
                }
            }).then(function() {
                // migration for group infos when admin logs in
                return self._migrateGroupInfos();
            }).then(function() {
                var folder = tutao.locator.mailFolderListViewModel.getSystemFolder(tutao.entity.tutanota.TutanotaConstants.MAIL_FOLDER_TYPE_INBOX);
                tutao.locator.mailFolderListViewModel.selectedFolder(folder);
                return tutao.locator.navigator.mail().then(function() {
                    tutao.locator.eventBus.connect(false);
                    tutao.locator.mailListViewModel.loadInitial();
                    tutao.locator.contactListViewModel.init();
                    self.loginFinished(true);
                    tutao.locator.pushService.register();
                    // run the following commands in sequence to avoid parallel loading of the customer
                    self._showApprovalRequestInfo().then(function() {
                        return self._showUpgradeReminder();
                    }).then(function() {
                        self._getInfoMails();
                    });
                });
            });
        }
    });
};

tutao.tutanota.ctrl.LoginViewModel.prototype._initGroup = function() {
    var groupKey = tutao.locator.userController.getUserGroupKey();
    var s = new tutao.entity.tutanota.InitGroupData();

    s.setGroupId(tutao.locator.userController.getUserGroupId());
    s.setGroupEncEntropy(tutao.locator.aesCrypter.encryptBytes(groupKey, tutao.util.EncodingConverter.uint8ArrayToBase64(tutao.locator.randomizer.generateRandomData(32))));

    var mailBoxSessionkey = tutao.locator.aesCrypter.generateRandomKey();
    s.setSymEncMailBoxSessionKey(tutao.locator.aesCrypter.encryptKey(groupKey, mailBoxSessionkey));

    var contactListSessionkey = tutao.locator.aesCrypter.generateRandomKey();
    s.setSymEncContactListSessionKey(tutao.locator.aesCrypter.encryptKey(groupKey, contactListSessionkey));

    var fileSystemSessionkey = tutao.locator.aesCrypter.generateRandomKey();
    s.setSymEncFileSystemSessionKey(tutao.locator.aesCrypter.encryptKey(groupKey, fileSystemSessionkey));

    var externalGroupInfoListKey = tutao.locator.aesCrypter.generateRandomKey();
    s.setSymEncExternalGroupInfoListKey(tutao.locator.aesCrypter.encryptKey(groupKey, externalGroupInfoListKey));

    return s.setup({}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
        if (tutao.locator.userController.getLoggedInUser().getAccountType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE) {
            new tutao.entity.tutanota.WelcomeMailData()
                .setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
                .setup({}, tutao.entity.EntityHelper.createAuthHeaders(), function() {});
        }
    });
};

/**
 * Migrates the group infos if
 * - an admin is logged in and
 * - the admin itself is already migrated and
 * - the admin user's group info is not yet migrated
 */
tutao.tutanota.ctrl.LoginViewModel.prototype._migrateGroupInfos = function () {
    var user = tutao.locator.userController.getLoggedInUser();
    if (tutao.locator.userController.isLoggedInUserAdmin() && user.getOwnerGroup() && !tutao.locator.userController.getUserGroupInfo().getOwnerGroup()) {
        return user.loadCustomer().then(function(customer) {
            return tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.GroupInfo, customer.getUserGroups(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID).then(function(groupInfos) {
                var customerGroupKey = tutao.locator.userController.getGroupKey(tutao.locator.userController.getGroupId(tutao.entity.tutanota.TutanotaConstants.GROUP_TYPE_CUSTOMER));
                var data = new tutao.entity.sys.MigrateGroupInfosData();
                return Promise.each(groupInfos, function(groupInfo) {
                    var groupInfoData = new tutao.entity.sys.MigratedGroupInfoData(data);
                    groupInfoData.setGroupInfo(groupInfo.getId());
                    groupInfoData.setOwnerEncSessionKey(tutao.locator.aesCrypter.encryptKey(customerGroupKey, groupInfo.getEntityHelper().getSessionKey()));
                    data.getGroupInfos().push(groupInfoData);
                }).then(function() {
                    return data.setup({}, tutao.entity.EntityHelper.createAuthHeaders());
                });
            });
        });
    } else {
        return Promise.resolve();
    }
};

tutao.tutanota.ctrl.LoginViewModel.prototype._getInfoMails = function () {
    var receiveService = new tutao.entity.tutanota.ReceiveInfoServiceData();
    return receiveService.setup({}, tutao.entity.EntityHelper.createAuthHeaders());
};

tutao.tutanota.ctrl.LoginViewModel.prototype._showUpgradeReminder = function () {
    var self = this;
    if (tutao.locator.userController.isLoggedInUserFreeAccount() && tutao.env.mode != tutao.Mode.App) {
        return tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
            return customer.loadProperties().then(function(properties) {
                return customer.loadCustomerInfo().then(function(customerInfo) {
                    if (properties.getLastUpgradeReminder() == null && (customerInfo.getCreationTime().getTime() + tutao.entity.tutanota.TutanotaConstants.UPGRADE_REMINDER_INTERVAL) < new Date().getTime() ) {
                        var message = tutao.lang("premiumOffer_msg") + " " + tutao.lang("moreInfo_msg");
                        var title = tutao.lang( "upgradeReminderTitle_msg");
                        return tutao.locator.modalDialogViewModel.showDialog([message], ["upgradeToPremium_action", "upgradeReminderCancel_action"], title, "https://tutanota.com/pricing", "/graphics/hab.png").then(function(selection) {
                            if ( selection == 0) {
                                tutao.locator.navigator.settings();
                                tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_PAYMENT);
                            }
                        }).then(function() {
                            properties.setLastUpgradeReminder(new Date());
                            properties.update();
                        });
                    }
                });
            });
        });
    } else {
        return Promise.resolve();
    }
};

tutao.tutanota.ctrl.LoginViewModel.prototype._showApprovalRequestInfo = function () {
    return tutao.locator.userController.getLoggedInUser().loadCustomer().then(function(customer) {
        if (customer.getApprovalStatus() == tutao.entity.tutanota.TutanotaConstants.APPROVAL_STATUS_REGISTRATION_APPROVAL_NEEDED) {
            return tutao.tutanota.gui.alert(tutao.lang("waitingForApproval_msg"));
        } else if (customer.getApprovalStatus() == tutao.entity.tutanota.TutanotaConstants.APPROVAL_STATUS_INVOICE_NOT_PAID){
            if (tutao.locator.userController.isLoggedInUserAdmin()) {
                return tutao.tutanota.gui.alert(tutao.lang("invoiceNotPaid_msg", {"{1}": tutao.env.getHttpOrigin()})).then(function(){
                    tutao.locator.navigator.settings();
                    tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_PAYMENT);
                });
            } else {
                return tutao.tutanota.gui.alert(tutao.lang("invoiceNotPaidUser_msg"));
            }
        }
    });
};


/**
 * Loads entropy from the last logout. Fetches missing entropy if none was stored yet and stores it.
 * @return {Promise.<>} Resolves when finished, rejected if failed.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.loadEntropy = function() {
    var self = this;
    return this._loadTutanotaPropertiesUnencrypted().then(function(tutanotaProperties) {
        return new Promise(function(resolve, reject) {
            var groupEncEntropy = tutanotaProperties.getGroupEncEntropy();
            if (!groupEncEntropy) {
                tutao.locator.entropyCollector.fetchMissingEntropy(function () {
                    self.storeEntropy();
                    resolve();
                });
            } else {
                try  {
                    var entropy = tutao.locator.aesCrypter.decryptBytes(tutao.locator.userController.getUserGroupKey(), groupEncEntropy);
                    tutao.locator.entropyCollector.addStaticEntropy(entropy);
                    resolve();
                } catch (exception) {
                    // when an exception occurs while decrypting the entropy, then fetch the missing entropy.
                    if (exception instanceof tutao.crypto.CryptoError) {
                        return tutao.locator.entropyCollector.fetchMissingEntropy(function() {
                            self.storeEntropy();
                            resolve();
                        });
                    } else {
                        reject(exception);
                    }
                }
            }
        });
    });
};

tutao.tutanota.ctrl.LoginViewModel.prototype._loadTutanotaPropertiesUnencrypted = function() {
    var rootId = [tutao.locator.userController.getUserGroupId(), tutao.entity.tutanota.TutanotaProperties.ROOT_INSTANCE_ID];
    return tutao.entity.sys.RootInstance.load(rootId).then(function(root) {
        return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.TutanotaProperties, tutao.entity.tutanota.TutanotaProperties.PATH, root.getReference(), null, {"v": tutao.entity.tutanota.TutanotaProperties.MODEL_VERSION}, tutao.entity.EntityHelper.createAuthHeaders());
    });
};

/**
 * Stores entropy from the randomizer for the next login.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.storeEntropy = function() {
    return this._loadTutanotaPropertiesUnencrypted().then(function(tutanotaProperties) {
        var groupEncEntropy = tutao.locator.aesCrypter.encryptBytes(tutao.locator.userController.getUserGroupKey(), tutao.util.EncodingConverter.uint8ArrayToBase64(tutao.locator.randomizer.generateRandomData(32)));
        tutanotaProperties.setGroupEncEntropy(groupEncEntropy);
        return tutanotaProperties.update();
    });
};

tutao.tutanota.ctrl.LoginViewModel.prototype.createAccount = function() {
    tutao.locator.navigator.register();
};

/**
 * Stores the password locally if chosen by user.
 * @return {Promise.<>} Resolved when finished, rejected if failed.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype._storePassword = function() {
    var self = this;
    var cleanMailAddress = tutao.tutanota.util.Formatter.getCleanedMailAddress(self.mailAddress());
    var storedCredentials = self.config.get(cleanMailAddress);
    if (self.storePassword()) {
        var promise = null;
        if (!storedCredentials) {
            // register the device and store the encrypted password
            promise = self._createNewCredentials(cleanMailAddress, self.passphrase());
        } else {
            // the device is already registered, so only store the encrypted password
            promise = self._loadDeviceKey(storedCredentials.userId, storedCredentials.deviceToken).then(function(deviceKey) {
                var deviceEncPassword = tutao.locator.aesCrypter.encryptUtf8(deviceKey, self.passphrase());
                self.config.set(cleanMailAddress, tutao.locator.userController.getLoggedInUser().getId(), deviceEncPassword, storedCredentials.deviceToken);
            }).caught(tutao.NotFoundError, function(e) {
                // the user id or device token is not valid, so create new ones and overwrite the old credentials
                return self._createNewCredentials(cleanMailAddress, self.passphrase());
            });
        }
        return promise.then(function () {
            tutao.locator.configFacade.write(self.config);
        });
    } else {
        // delete any stored password
        if (storedCredentials) {
            return this._deleteCredentials(storedCredentials);
        } else {
            return Promise.resolve();
        }
    }
};

tutao.tutanota.ctrl.LoginViewModel.prototype._createNewCredentials = function(cleanMailAddress, passphrase) {
    var self = this;
    var deviceService = new tutao.entity.sys.AutoLoginDataReturn();
    var deviceKey = tutao.locator.aesCrypter.generateRandomKey();
    deviceService.setDeviceKey(tutao.util.EncodingConverter.keyToBase64(deviceKey));
    return deviceService.setup({}, tutao.entity.EntityHelper.createAuthHeaders()).then(function (autoLoginPostReturn) {
        var deviceEncPassword = tutao.locator.aesCrypter.encryptUtf8(deviceKey, passphrase);
        self.config.set(cleanMailAddress, tutao.locator.userController.getLoggedInUser().getId(), deviceEncPassword, autoLoginPostReturn.getDeviceToken());
    });
};

/**
 * Login the user before trying to delete the credentials.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.deleteCredentials = function(credentials) {
    var self = this;
    self.loginOngoing(true);
    return this._loadDeviceKey(credentials.userId, credentials.deviceToken).then(function(deviceKey) {
        var password = null;
        try {
            password = tutao.locator.aesCrypter.decryptUtf8(deviceKey, credentials.encryptedPassword);
        } catch (e) { //tutao.tutadb.crypto.CryptoException
            return Promise.reject(e);
        }
        return tutao.locator.userController.loginUser(credentials.mailAddress, password);
    }).caught(function() {
        // delete the local credentials even if loading the device key or login fails
    }).lastly(function () {
        return self._deleteCredentials(credentials).then(function () {
            tutao.locator.userController.reset();
            self.loginOngoing(false);
            self.storedCredentials.remove(credentials);
        })
    });
};

/**
 *
 * @returns {bool} True if the credentials could be deleted, false otherwise.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype._deleteCredentials = function(credentials) {
    var self = this;
    if (self.config.get(credentials.mailAddress)) {
        return new tutao.entity.sys.AutoLoginDataDelete()
            .setDeviceToken(credentials.deviceToken).erase({}).caught(function() {
            // Ignore errors
        }).lastly(function() {
            self.config.delete(credentials.mailAddress);
            tutao.locator.configFacade.write(self.config);
        });
    } else {
        return Promise.resolve();
    }
};

/**
 * Tries to login the user automatically.
 * @return {Promise.<bool>} True when logged in, false otherwise.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype._tryAutoLogin = function(credentials) {
    var self = this;
    if (!credentials.mailAddress || !credentials.userId || !credentials.deviceToken || !credentials.encryptedPassword) {
        console.log("invalid credentials");
        return Promise.resolve(false);
    }
    self.loginOngoing(true);
    return this._loadDeviceKey(credentials.userId, credentials.deviceToken).then(function(deviceKey) {
        var password = null;
        try {
            password = tutao.locator.aesCrypter.decryptUtf8(deviceKey, credentials.encryptedPassword);
        } catch (e) { //tutao.tutadb.crypto.CryptoException
            console.log("invalid credentials", e);
            return false;
        }
        return self._login(credentials.mailAddress, password);
    }).caught(tutao.NotFoundError, function (e) {
        self.loginOngoing(false);
        console.log("configured user does not exist: ", e);
        return false;
        // suppress login error, if the user does not exist (should only occur during testing)
    });
};


/**
 * Loads the device key.
 * @return {Promise.<Object>} Resolves to the device key, rejected if loading the device key failed.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype._loadDeviceKey = function(userId, deviceToken) {
    var params = {};
    // use the userId of the currently logged in user, if a user is logged in. If not, use the one from our config.
    return tutao.entity.sys.AutoLoginDataReturn.load(new tutao.entity.sys.AutoLoginDataGet()
        .setUserId(userId)
        .setDeviceToken(deviceToken), params, null).then(function(autoLoginDataReturn) {
        return tutao.util.EncodingConverter.base64ToKey(autoLoginDataReturn.getDeviceKey());
    });
};

tutao.tutanota.ctrl.LoginViewModel.showAppInfo = function() {
    return (tutao.env.mode != tutao.Mode.App) && (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP || tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID || tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPAD || tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE);
};

tutao.tutanota.ctrl.LoginViewModel.prototype.loginOtherAccount = function() {
    this.storedCredentials([]);
};

tutao.tutanota.ctrl.LoginViewModel.prototype.loginWithStoredCredentials = function(credentials) {
    var self = this;
    this._tryAutoLogin(credentials).then(function(successful) {
        if (!successful) {
            // show the normal login view with the error message. set the login status again after it was changed when setting mail address and password
            var loginStatus = self.loginStatus();
            self.mailAddress(credentials.mailAddress);
            self.passphrase("");
            self.storePassword(true);
            self.loginStatus(loginStatus);
            self.storedCredentials([]);
        }
    });
};
