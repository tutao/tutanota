"use strict";

goog.provide('tutao.tutanota.ctrl.RegistrationViewModel');

/**
 * The ViewModel for the registration template.
 * TODO (before beta) only load and render the DOM when #registration is active, unload from DOM afterwards
 * @constructor
 */
tutao.tutanota.ctrl.RegistrationViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.authToken = ko.observable("");
	this.accountType = ko.observable(tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE);
	this.companyName = ko.observable("");
	this.invoiceAddress = ko.observable("");
	this.domain = ko.observable("tutanota.de");
	this.name = ko.observable("");
	this.nameFieldFocused = ko.observable("");
	this.mobileNumber = ko.observable("");
	this.mobileNumberStatus = ko.computed(function() {
		if (this.mobileNumber() == "") {
			return { type: "neutral", text: "mobileNumberNeutral_msg" };
		} else if (this.isMobileNumberValid()) {
			return { type: "valid", text: "mobileNumberValid_msg" };
		} else {
			return { type: "invalid", text: "mobileNumberInvalid_msg" };
		}
	}, this); 
	
	this.mailAddressPrefix = ko.observable("");
	this.mailAddressStatus = ko.observable({ type: "neutral", text: "mailAddressNeutral_msg"});
	
	this.code = ko.observable("");
	this.password1 = ko.observable("");
	this.password2 = ko.observable("");
	this.termsAccepted = ko.observable(false);

	this.mailAddressPrefix.subscribe(tutao.tutanota.ctrl.RegistrationViewModel.createMailAddressVerifier(this, tutao.tutanota.ctrl.RegistrationViewModel.MINIMUM_MAIL_ADDRESS_PREFIX_LENGTH));

	this.oldName = "";
	this.name.subscribe(function(newValue) {
		if ((this.mailAddressPrefix() == "" || this.mailAddressPrefix().toLowerCase() == this._getMailAddressFromName(this.oldName)) && this.name() != "") {
			this.mailAddressPrefix(this._getMailAddressFromName(this.name()));
		} else if (this.mailAddressPrefix().toLowerCase() == this._getMailAddressFromName(this.oldName) && this.name() == "") {
			this.mailAddressPrefix("");
		}
		this.oldName = newValue;
	}, this);

	this.joinStatus = ko.observable({ type: "neutral", text: "joinNeutral_msg" });

	/**
	 * Must be called when the code was changed (directly after each character).
	 */
	this.code.subscribe(function(newValue) {
		if (newValue.length == 4) {
			if (this.codeVerificationFailed()) {
				this.codeInputStatus({ type: "invalid", text: "codeInvalid_msg" });
			} else {
				this.codeInputStatus({ type: "valid", text: "codeValid_msg" });
			}
		} else {
			this.codeInputStatus({ type: "neutral", text: "codeNeutralEnterCode_msg" });
		}
	}, this);

	this.codeInputStatus = ko.observable({ type: "neutral", text: "codeNeutralEnterCode_msg" });
	this.createAccountStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });

	this._keyGenProgress = ko.observable(0);

	this._sendSmsState = ko.observable(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
	this._createAccountState = ko.observable(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);

	this._wrongCodes = ko.observableArray([]);
};

/**
 * Sets the focus when the view is shown.
 */
tutao.tutanota.ctrl.RegistrationViewModel.prototype.activate = function(authToken) {
	var self = this;
	setTimeout(function() {
		self.nameFieldFocused(true);
	}, 0);
	
	if (authToken) {
		this.authToken(authToken);
		var params = {};
		params[tutao.rest.ResourceConstants.AUTH_ID_PARAMETER_NAME] = authToken;
		tutao.entity.sys.RegistrationServiceData.load(params, null, function(data, exception) {
			if (!exception && (data.getState() == tutao.entity.tutanota.TutanotaConstants.REGISTRATION_STATE_INITIAL || 
					data.getState() == tutao.entity.tutanota.TutanotaConstants.REGISTRATION_STATE_CODE_SENT)) {
			    self.accountType(data.getAccountType());
			    self.invoiceAddress(data.getInvoiceAddress());
			    self.domain(data.getDomain());
			    self.companyName(data.getCompany());
			    self.name(data.getGroupName());
			    self.mailAddressPrefix(data.getMailAddress().substring(0, data.getMailAddress().indexOf("@")));
			    self.mobileNumber(data.getMobilePhoneNumber());
			}
		});
	}
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getRegistrationType = function() {
	if (this.authToken()) return 'Starter';
	return 'Free';
};

tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING = 0;
tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING = 1;
tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_FINISHED = 2;
tutao.tutanota.ctrl.RegistrationViewModel.MINIMUM_MAIL_ADDRESS_PREFIX_LENGTH = 4;

tutao.tutanota.ctrl.RegistrationViewModel.prototype._getMailAddressFromName = function(name) {
	var mailAddress = name;
	mailAddress = mailAddress.trim().toLowerCase();
	mailAddress = mailAddress.replace(/ /g, ".");
	mailAddress = mailAddress.replace(/ö/g, "oe");
	mailAddress = mailAddress.replace(/ä/g, "ae");
	mailAddress = mailAddress.replace(/ü/g, "ue");
	mailAddress = mailAddress.replace(/ß/g, "ss");
	return mailAddress;
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isMobileNumberValid = function() {
	var cleaned = tutao.tutanota.util.Formatter.getCleanedPhoneNumber(this.mobileNumber());
	if (!cleaned) {
		return false;
	} else {
		return tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber(cleaned);
	}
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isValidMailAddress = function() {
	return tutao.tutanota.util.Formatter.isValidTutanotaLocalPart(this.mailAddressPrefix().toLowerCase());
};

/**
 * Provides the status of the first entered new password.
 * @return {Object} The status containing type and text id.
 */
tutao.tutanota.ctrl.RegistrationViewModel.prototype.getPassword1Status = function() {
	if (this.password1() == "") {
		return { type: "neutral", text: "password1Neutral_msg" };
	} else if (this.getPasswordStrength() >= 80) {
		return { type: "valid", text: "passwordValid_msg" };
	} else {
		return { type: "invalid", text: "password1InvalidUnsecure_msg" };
	}
};

/**
 * Provides the status of the second entered new password.
 * @return {Object} The status containing type and text id.
 */
tutao.tutanota.ctrl.RegistrationViewModel.prototype.getPassword2Status = function() {
	if (this.password2() == "") {
		return { type: "neutral", text: "password2Neutral_msg" };
	} else if (this.password1() == this.password2()) {
		return { type: "valid", text: "passwordValid_msg" };
	} else {
		return { type: "invalid", text: "password2Invalid_msg" };
	}
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getPasswordStrength = function() {
	return tutao.tutanota.util.PasswordUtils.getPasswordStrength(this.password1());
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getTermsStatus = function() {
	if (!this.termsAccepted()) {
		return { type: "neutral", text: "termsAcceptedNeutral_msg" };
	} else {
		return { type: "valid", text: "emptyString_msg" };
	}
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getKeyGenerationProgress = function() {
	return this._keyGenProgress();
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getSendSmsState = function() {
	return this._sendSmsState();
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isFormEditable = function() {
	return (this.getSendSmsState() != tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING);
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isSendSmsPossible = function() {
	return ((this._sendSmsState() != tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING) &&
			(this._createAccountState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING) &&
		(this.mailAddressStatus().type == "valid") &&
		this.isMobileNumberValid() &&
		(this.getPassword1Status().type == "valid") &&
		(this.getPassword2Status().type == "valid") &&
		this.termsAccepted());
};

// STEP 2

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getCreateAccountState = function() {
	return this._createAccountState();
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isCreateAccountPossible = function() {
	return (this._sendSmsState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_FINISHED &&
			(this._createAccountState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING) &&
			this.code().length == 4 &&
			!this.codeVerificationFailed());
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isBackPossible = function() {
	return (this._sendSmsState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_FINISHED &&
			(this._createAccountState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING) &&
			!this.codeVerificationFailed());
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isCreatingAccount = function() {
	return this._createAccountState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING;
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.codeVerificationFailed = function() {
	return tutao.util.ArrayUtils.contains(this._wrongCodes(), this.code());
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.sendSms = function() {
	var self = this;
	if (!this.isSendSmsPossible()) {
		return;
	}
	this._sendSmsState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING);
	self.joinStatus({ type: "neutral", text: "joinRunning_msg" });
	var service = new tutao.entity.sys.SendRegistrationCodeData()
	    .setAccountType(this.accountType())
	    .setAuthToken(this.authToken())
        .setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
	    .setMobilePhoneNumber(tutao.tutanota.util.Formatter.getCleanedPhoneNumber(this.mobileNumber()));
	// if no registration link was used, the authToken is not set yet, but returned by the send registration code service
	service.setup({}, null, function(sendRegistrationCodeReturn, exception) {
		if (exception) {
			self.joinStatus({ type: "invalid", text: "joinFailure_msg" });
			self._sendSmsState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
		} else {
			self.authToken(sendRegistrationCodeReturn.getAuthToken());
			self.joinStatus({ type: "neutral", text: "joinNeutral_msg" });
			self.code(""); // reset the code input field because it might be filled if the user changed back to the first view
			self._sendSmsState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_FINISHED);
		}
	});
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.createAccount = function() {
	var self = this;
	if (!this.isCreateAccountPossible()) {
		return;
	}
	self._createAccountState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING);
	self.createAccountStatus({ type: "neutral", text: "createAccountRunning_msg" });
	var service = new tutao.entity.sys.VerifyRegistrationCodeData();
	service.setAuthToken(this.authToken());
	service.setCode(this.code());
	service.setup({}, null, function(voidReturn, exception) {
		if (exception) {
			self._createAccountState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
			if (exception.getOriginal() instanceof tutao.rest.RestException) {
				if (exception.getOriginal().getResponseCode() == 473) { // InvalidDataException
					self.codeInputStatus({ type: "invalid", text: "codeInvalid_msg" });
					self.createAccountStatus({ type: "neutral", text: "emptyString_msg" });
					self._wrongCodes.push(self.code());
				} else if (exception.getOriginal().getResponseCode() == 429) { // TooManyRequestsException
					self._createAccountState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_FINISHED);
					self.createAccountStatus({ type: "invalid", text: "createAccountTooManyAttempts_msg" });
				} else {
					self.createAccountStatus({ type: "invalid", text: "createAccountError_msg" });
				}
			} else {
				self.createAccountStatus({ type: "invalid", text: "createAccountError_msg" });
			}
		} else {
			self.generateKeys();
		}
	});
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.backToStartPage = function() {
	if (this.isCreatingAccount()) {
		return;
	}
	this._sendSmsState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.generateKeys = function() {
	var self = this;
	self.createAccountStatus({ type: "neutral", text: "createAccountRunning_msg" });
	tutao.locator.entropyCollector.fetchMissingEntropy(function() {
		self._generateKeys(function(exception) {
			if (exception) {
				console.log(exception);
				self._keyGenProgress(0);
				self._createAccountState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
				self.createAccountStatus({ type: "invalid", text: "createAccountError_msg" });
			} else {
				tutao.locator.navigator.login(false); // the user is still logged in at this moment. This is why the navigator will re-initialize the whole application.
				setTimeout(function() {					
					tutao.locator.loginViewModel.setMailAddress(self.mailAddressPrefix() + "@" + self.domain());
					tutao.locator.loginViewModel.setWelcomeTextId("afterRegistration_msg");
				}, 0);
			}
		});
	});
};

/**
 *
 * @param {tutao.entity.sys.SystemKeysReturn} keyData
 * @returns {string} the group key for the current account type
 * @private
 */
tutao.tutanota.ctrl.RegistrationViewModel.prototype._getAccountGroupKey = function (keyData) {
    if (this.accountType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE) {
        return keyData.getFreeGroupKey();
    } else if (this.accountType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER) {
        return keyData.getStarterGroupKey();
    } else {
        throw Error("Illegal account type");
    }
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype._generateKeys = function(callback) {
	var self = this;
	tutao.entity.sys.SystemKeysReturn.load({}, null, function(keyData, exception) {
		if (exception) {
			callback(exception);
			return;
		}

		var systemAdminPubKeyBase64 = keyData.getSystemAdminPubKey();
		var systemAdminPubKeyVersion = keyData.getSystemAdminPubKeyVersion();

		var salt = tutao.locator.kdfCrypter.generateRandomSalt();
		tutao.locator.kdfCrypter.generateKeyFromPassphrase(self.password1(), salt, function(userPassphraseKeyHex) {
			self._keyGenProgress(5);
			var userPassphraseKey = tutao.locator.aesCrypter.hexToKey(userPassphraseKeyHex);

            var adminGroupsListKey = tutao.locator.aesCrypter.generateRandomKey();
			tutao.tutanota.ctrl.GroupData.generateGroupKeys("admin", "", null, null, adminGroupsListKey, function(adminGroupData, adminGroupKey, exception) {
				self._keyGenProgress(35);
				if (exception) {
					callback(exception);
					return;
				}
                var userGroupsListKey = tutao.locator.aesCrypter.generateRandomKey();
				tutao.tutanota.ctrl.GroupData.generateGroupKeys(self.name(), self.mailAddressPrefix() + "@" + self.domain(), userPassphraseKey, adminGroupKey, userGroupsListKey, function(userGroupData, userGroupKey, exception) {
					self._keyGenProgress(65);
					if (exception) {
						callback(exception);
						return;
					}

					// encrypt the admin key with the user key, because the user key was not available before
					adminGroupData.setSymEncGKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, adminGroupKey));

                    var customerGroupsListKey = tutao.locator.aesCrypter.generateRandomKey();
					tutao.tutanota.ctrl.GroupData.generateGroupKeys("customer", "", userGroupKey, adminGroupKey, customerGroupsListKey, function(customerGroupData, customerGroupKey, exception) {
						self._keyGenProgress(95);
						if (exception) {
							callback(exception);
							return;
						}
						var customerSessionKey = tutao.locator.aesCrypter.generateRandomKey();
						var customerBucketKey = tutao.locator.aesCrypter.generateRandomKey();

						var clientKey = tutao.locator.aesCrypter.generateRandomKey();

						var symEncAccountGroupKey = tutao.locator.aesCrypter.encryptKey(userGroupKey, tutao.locator.aesCrypter.hexToKey(tutao.util.EncodingConverter.base64ToHex(self._getAccountGroupKey(keyData))));

						var systemAdminPubKey = tutao.locator.rsaCrypter.hexToKey(tutao.util.EncodingConverter.base64ToHex(systemAdminPubKeyBase64));

						tutao.locator.rsaCrypter.encryptAesKey(systemAdminPubKey, tutao.locator.aesCrypter.keyToHex(customerBucketKey), function(systemAdminPubEncCustomerBucketKey, exception) {
							self._keyGenProgress(97);
							if (exception) {
								callback(exception);
								return;
							}

                            var teamGroupsListKey = tutao.locator.aesCrypter.generateRandomKey();

                            var customerService = new tutao.entity.sys.CustomerData()
							    .setAuthToken(self.authToken())
							    .setCompany(tutao.locator.aesCrypter.encryptUtf8(customerSessionKey, self.companyName(), true))
							    .setInvoiceAddress(tutao.locator.aesCrypter.encryptUtf8(customerSessionKey, self.invoiceAddress(), true))
							    .setDomain(self.domain())
                                .setAdminGroupList(new tutao.entity.sys.CreateGroupListData()
                                    .setCustomerEncGroupInfoListKey(tutao.locator.aesCrypter.encryptKey(customerGroupKey, adminGroupsListKey))
                                    .setAdminEncGroupInfoListKey(tutao.locator.aesCrypter.encryptKey(adminGroupKey, adminGroupsListKey))
                                    .setCreateGroupData(adminGroupData))
                                .setUserGroupList(new tutao.entity.sys.CreateGroupListData()
                                    .setCustomerEncGroupInfoListKey(tutao.locator.aesCrypter.encryptKey(customerGroupKey, userGroupsListKey))
                                    .setAdminEncGroupInfoListKey(tutao.locator.aesCrypter.encryptKey(adminGroupKey, userGroupsListKey))
                                    .setCreateGroupData(userGroupData))
                                .setCustomerGroupList(new tutao.entity.sys.CreateGroupListData()
                                    .setCustomerEncGroupInfoListKey(tutao.locator.aesCrypter.encryptKey(customerGroupKey, customerGroupsListKey))
                                    .setAdminEncGroupInfoListKey(tutao.locator.aesCrypter.encryptKey(adminGroupKey, customerGroupsListKey))
                                    .setCreateGroupData(customerGroupData))
                                .setTeamGroupList(new tutao.entity.sys.CreateGroupListData()
                                    .setCustomerEncGroupInfoListKey(tutao.locator.aesCrypter.encryptKey(customerGroupKey, teamGroupsListKey))
                                    .setAdminEncGroupInfoListKey(tutao.locator.aesCrypter.encryptKey(adminGroupKey, teamGroupsListKey)))

							    .setAdminEncCustomerSessionKey(tutao.locator.aesCrypter.encryptKey(adminGroupKey, customerSessionKey))
							    .setPwEncClientKey(tutao.locator.aesCrypter.encryptKey(userPassphraseKey, clientKey))
							    .setCustomerBucketEncCustomerSessionKey(tutao.locator.aesCrypter.encryptKey(customerBucketKey, customerSessionKey))
							    .setSystemAdminPubEncCustomerBucketKey(systemAdminPubEncCustomerBucketKey)
							    .setSystemAdminPubKeyVersion(systemAdminPubKeyVersion)
							    .setSalt(tutao.util.EncodingConverter.hexToBase64(salt))
							    .setVerifier(tutao.locator.shaCrypter.hashHex(userPassphraseKeyHex))
							    .setSymEncAccountGroupKey(symEncAccountGroupKey);

							customerService.setup({}, null, function(adminUserData, exception) {
								if (exception) {
									callback(exception);
									return;
								}
								tutao.locator.userController.loginUser(userGroupData.getMailAddr(), self.password1(), function(exception) {
									if (exception) {
										callback(exception);
										return;
									}
									//TODO (before beta) create root instances and welcome mail before login
									var s = new tutao.entity.tutanota.InitGroupData();

									var mailShareBucketKey = tutao.locator.aesCrypter.generateRandomKey();
									var mailBoxSessionkey = tutao.locator.aesCrypter.generateRandomKey();
									var userGroupKey = tutao.locator.userController.getUserGroupKey();
									s.setSymEncMailBoxSessionKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, mailBoxSessionkey));
									s.setSymEncMailShareBucketKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, mailShareBucketKey));
									s.setMailShareBucketEncMailBoxSessionKey(tutao.locator.aesCrypter.encryptKey(mailShareBucketKey, mailBoxSessionkey));

									var contactShareBucketKey = tutao.locator.aesCrypter.generateRandomKey();
									var contactListSessionkey = tutao.locator.aesCrypter.generateRandomKey();
									s.setSymEncContactListSessionKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, contactListSessionkey));
									s.setSymEncContactShareBucketKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, contactShareBucketKey));
									s.setContactShareBucketEncContactListSessionKey(tutao.locator.aesCrypter.encryptKey(contactShareBucketKey, contactListSessionkey));

									var fileShareBucketKey = tutao.locator.aesCrypter.generateRandomKey();
									var fileSystemSessionkey = tutao.locator.aesCrypter.generateRandomKey();
									s.setSymEncFileSystemSessionKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, fileSystemSessionkey));
									s.setSymEncFileShareBucketKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, fileShareBucketKey));
									s.setFileShareBucketEncFileSystemSessionKey(tutao.locator.aesCrypter.encryptKey(fileShareBucketKey, fileSystemSessionkey));
									
									var externalRecipientListKey = tutao.locator.aesCrypter.generateRandomKey();
									s.setSymEncExternalRecipientListKey(tutao.locator.aesCrypter.encryptKey(userGroupKey, externalRecipientListKey));
									s.setMailShareBucketEncExternalRecipientListKey(tutao.locator.aesCrypter.encryptKey(mailShareBucketKey, externalRecipientListKey));

									s.setup({}, tutao.entity.EntityHelper.createAuthHeaders(), function(nothing, exception) {
										if (exception) {
											callback(exception);
											return;
										}
										var map = {};
										new tutao.entity.tutanota.WelcomeMailData()
                                            .setLanguage(tutao.locator.languageViewModel.getCurrentLanguage())
                                            .setup(map, tutao.entity.EntityHelper.createAuthHeaders(), function() {});
										self._keyGenProgress(100);
										callback();
									});
								});
							});
						});
					});
				});
			});
		});
	});
};

tutao.tutanota.ctrl.RegistrationViewModel.createMailAddressVerifier = function(scope, minLength) {
	var self = scope;
	return function(newValue) {

		var cleanedValue = newValue.toLowerCase();
		if (self.mailAddressPrefix().length < minLength) {
			self.mailAddressStatus({ type: "neutral", text: "mailAddressNeutral_msg"});
			return;
		} else if (!self.isValidMailAddress()) {
			self.mailAddressStatus({ type: "invalid", text: "mailAddressInvalid_msg"});
			return;
		}
		
		self.mailAddressStatus({ type: "invalid", text: "mailAddressBusy_msg"});

		setTimeout(function() {
			if (self.mailAddressPrefix() == newValue) {
				var params = [];
				tutao.entity.sys.MailAddressAvailabilityReturn.load(new tutao.entity.sys.MailAddressAvailabilityData().setMailAddress(cleanedValue + "@" + self.domain()), params, [], function(mailAddressAvailabilityReturn, exception) {
					if (self.mailAddressPrefix() == newValue) {
						if (exception) {
							console.log(exception);
						} else if (mailAddressAvailabilityReturn.getAvailable()) {
							self.mailAddressStatus({ type: "valid", text: "mailAddressAvailable_msg"});
						} else {
							self.mailAddressStatus({ type: "invalid", text: "mailAddressNA_msg"});
						}
					}
				});
			}
		}, 500);
	};
};
