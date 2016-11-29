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

    this.config = new tutao.native.DeviceConfig();
    this.autoLoginActive = false;
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
    return tutao.locator.configFacade.read().then(function (config) {
        if (config) {
            self.config = config;
            if (allowAutoLogin && self.config.encryptedPassword) {
                return self._tryAutoLogin();
            }
        }
        tutao.locator.viewManager.select(tutao.locator.loginView);
        return Promise.resolve();
    }).caught(function(e) {
        tutao.locator.viewManager.select(tutao.locator.loginView);
        throw e;
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
	this.loginOngoing(true);
    this.loginStatus({ type: "neutral", text: "login_msg" });
	// in private browsing mode in mobile safari local storage is not available and throws an exception
	this.passphraseFieldFocused(false);
	tutao.tutanota.util.LocalStore.store('userMailAddress', this.mailAddress());
	return tutao.locator.userController.loginUser(self.mailAddress(), self.passphrase()).then(function () {
        return self._storePassword();
    }).then(function() {
        return self.postLoginActions().then(function() {
            self.passphrase("");
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
    // if auto login is active, the password is already stored and valid
    if (self.storePassword()) {
        var promise = null;
        if (!self.config.deviceToken || tutao.locator.userController.getUserId() != self.config.userId) {
            // register the device and store the encrypted password
            var deviceService = new tutao.entity.sys.AutoLoginDataReturn();
            var deviceKey = tutao.locator.aesCrypter.generateRandomKey();
            deviceService.setDeviceKey(tutao.util.EncodingConverter.keyToBase64(deviceKey));
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
            new tutao.entity.sys.AutoLoginDataDelete()
                .setDeviceToken(self.config.deviceToken).erase({}).caught(function(){
                    // Ignore errors
                }).lastly(function(){
                    self.config.deviceToken = null;
                    self.config.encryptedPassword = null;
                    self.config.userId = null;
                    tutao.locator.configFacade.write(self.config);
                });
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
    self.loginOngoing(true);
    return this._loadDeviceKey().then(function(deviceKey) {
        var password = null;
        try {
            password = tutao.locator.aesCrypter.decryptUtf8(deviceKey, self.config.encryptedPassword);
        } catch (e) { //tutao.tutadb.crypto.CryptoException
            return Promise.reject(e);
        }
        self.loginOngoing(false); // disable shortly to allow login to start
        self.passphrase(password);
        self.autoLoginActive = true;
        return self.login().then(function (successful) {
            self.autoLoginActive = false;
            if (!successful) {
                tutao.locator.viewManager.select(tutao.locator.loginView);
            }
        });
    }).caught(tutao.NotFoundError, function (e) {
        self.loginOngoing(false);
        console.log("configured user does not exist: ", e);
        tutao.locator.viewManager.select(tutao.locator.loginView);
        // suppress login error, if the user does not exist (should only occur during testing)
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
        return tutao.util.EncodingConverter.base64ToKey(autoLoginDataReturn.getDeviceKey());
    });
};

tutao.tutanota.ctrl.LoginViewModel.showAppInfo = function() {
    return (tutao.env.mode != tutao.Mode.App) && (tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_DESKTOP || tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_ANDROID || tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPAD || tutao.tutanota.util.ClientDetector.getDeviceType() == tutao.tutanota.util.ClientDetector.DEVICE_TYPE_IPHONE);
};
