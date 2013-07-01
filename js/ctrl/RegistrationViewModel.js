"use strict";

goog.provide('tutao.tutanota.ctrl.RegistrationViewModel');

/**
 * The ViewModel for the Login template.
 * @constructor
 */
tutao.tutanota.ctrl.RegistrationViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	var emptyString = "\u2008"; // an empty string or normal whitespace makes the label collapse, so enter this invisible character

	this.authToken = "";
	this.name = ko.observable("");
	this.nameFieldFocused = ko.observable("");
	this.phoneNumber = ko.observable("");
	this.mailAddress = ko.observable("");
	this.code = ko.observable("");
	this.passphrase1 = ko.observable("");
	this.passphrase2 = ko.observable("");
	this.termsAccepted = ko.observable(false);
	this.gender = ko.observable();
	this.firstName = ko.observable("");
	this.lastName = ko.observable("");
	this.address = ko.observable("");

	this.mailAddress.subscribe(function(newValue) {
		var self = this;

		var cleanedValue = newValue.toLowerCase();
		if (cleanedValue == "") {
			self._checkMailAddressState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
			return;
		}
		if (cleanedValue.length < 4) {
			self._checkMailAddressState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
			return;
		}
		if (!this.isValidMailAddress()) {
			self._checkMailAddressState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
			return;
		}

		setTimeout(function() {
			if (self.mailAddress() == newValue) {
				self._checkMailAddressState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING);
				var params = [];
				params[tutao.rest.ResourceConstants.MAIL_ADDRESS] = cleanedValue + "@tutanota.com";
				tutao.entity.sys.MailAddressAvailabilityService.load(params, [], function(data, exception) {
					if (exception) {
					} else if (data.getAvailable()) {
						self._checkMailAddressState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_FINISHED);
					} else {
						self._checkMailAddressState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
					}
				});
			}
		}, 500);
	}, this);

	this.oldName = "";
	this.name.subscribe(function(newValue) {
		if ((this.mailAddress() == "" || this.mailAddress().toLowerCase() == this._getMailAddressFromName(this.oldName)) && this.name() != "") {
			this.mailAddress(this._getMailAddressFromName(this.name()));
		} else if (this.mailAddress().toLowerCase() == this._getMailAddressFromName(this.oldName) && this.name() == "") {
			this.mailAddress("");
		}
		this.oldName = newValue;
	}, this);

	this.sendSmsTextId = ko.observable("join_msg");
	this.sendSmsText = ko.computed(function() {
		return tutao.locator.languageViewModel.get(this.sendSmsTextId());
	}, this, {deferEvaluation: true});

	this.createAccountTextId = ko.observable("createAccount_msg");
	this.createAccountText = ko.computed(function() {
		var params = {};
		if (this.createAccountTextId() == "createAccount_msg") {
			params = { "$": this.phoneNumber() };
		}
		return tutao.locator.languageViewModel.get(this.createAccountTextId(), params);
	}, this, {deferEvaluation: true});

	this._keyGenProgress = ko.observable(0);

	this._checkMailAddressState = ko.observable(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
	this._sendSmsState = ko.observable(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
	this._createAccountState = ko.observable(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);

	this._wrongCodes = ko.observableArray([]);
};

/**
 * Sets the focus when the view is shown.
 */
tutao.tutanota.ctrl.RegistrationViewModel.prototype.activate = function() {
	var self = this;
	setTimeout(function() {
		self.nameFieldFocused(true);
	}, 0);
};

tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING = 0;
tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING = 1;
tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_FINISHED = 2;

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

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isPhoneNumberValid = function() {
	var cleaned = tutao.tutanota.util.Formatter.getCleanedPhoneNumber(this.phoneNumber());
	if (!cleaned) {
		return false;
	} else {
		return tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber(cleaned);
	}
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isValidMailAddress = function() {
	return tutao.tutanota.util.Formatter.isValidTutanotaLocalPart(this.mailAddress().toLowerCase());
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isPassphrase1ProvidedAndValid = function() {
	return (this.passphrase1() != "" && this.getPassphraseStrength() >= 80);
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isPassphrase1MissingOrValid = function() {
	return (this.passphrase1() == "" || this.getPassphraseStrength() >= 80);
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getPassphraseStrength = function() {
	return tutao.tutanota.util.PasswordUtils.getPassphraseStrength(this.passphrase1());
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isPassphrase2ProvidedAndValid = function() {
	return (this.passphrase2() != "" && this.passphrase1() == this.passphrase2());
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isPassphrase2MissingOrValid = function() {
	return (this.passphrase2() == "" || this.passphrase1() == this.passphrase2());
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getKeyGenerationProgress = function() {
	return this._keyGenProgress();
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getCheckMailAddressState = function() {
	return this._checkMailAddressState();
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getCheckMailAddressIcon = function() {
	if (this._checkMailAddressState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING) {
		return "graphics/not_ok.png";
	} else if (this._checkMailAddressState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING) {
		return "graphics/busy.gif";
	} else {
		return "graphics/ok.png";
	}
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getCheckMailAddressText = function() {
	if (this._checkMailAddressState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING) {
		return tutao.locator.languageViewModel.get("mailAddressNA_msg");
	} else if (this._checkMailAddressState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING) {
		return tutao.locator.languageViewModel.get("verifyingCode_msg");
	} else {
		return tutao.locator.languageViewModel.get("mailAddressAvailable_msg");
	}
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getSendSmsState = function() {
	return this._sendSmsState();
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isFormEditable = function() {
	return (this.getSendSmsState() != tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING);
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.getCreateAccountState = function() {
	return this._createAccountState();
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isSendSmsPossible = function() {
	return ((this._sendSmsState() != tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING) &&
			(this._createAccountState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING) &&
		(this._checkMailAddressState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_FINISHED) &&
		this.name().trim() &&
		this.isPhoneNumberValid() &&
		this.isPassphrase1ProvidedAndValid() &&
		this.isPassphrase2ProvidedAndValid() &&
		this.termsAccepted());
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.isCreateAccountPossible = function() {
	return (this._sendSmsState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_FINISHED &&
			(this._createAccountState() == tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING) &&
			this.code().length == 4 &&
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
	self._sendSmsState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING);
	var service = new tutao.entity.sys.SendRegistrationCodeService();
	service.setAccountType(tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_FREE);
	service.setAuthToken(this.authToken);
	service.setMobilePhoneNumber(tutao.tutanota.util.Formatter.getCleanedPhoneNumber(this.phoneNumber()));
	var map = {};
	map[tutao.rest.ResourceConstants.LANGUAGE_PARAMETER_NAME] = tutao.locator.languageViewModel.getCurrentLanguage();
	// if no registration link was used, the authToken is not set yet, but returned by the send registration code service
	service.setup(map, null, function(authToken, exception) {
		if (exception) {
			self._sendSmsState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
			self.sendSmsTextId("joinFailure_msg");
		} else {
			self._sendSmsState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_FINISHED);
			self.authToken = authToken;
		}
	});
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.createAccount = function() {
	var self = this;
	self._createAccountState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_RUNNING);
	var service = new tutao.entity.sys.VerifyRegistrationCodeService();
	service.setAuthToken(this.authToken);
	service.setCode(this.code());
	service.setup({}, null, function(authToken, exception) {
		if (exception) {
			self._createAccountState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
			if (exception.getOriginal() instanceof tutao.rest.RestException) {
				if (exception.getOriginal().getResponseCode() == 409) {
					self.createAccountTextId("createAccountWrongCode_msg");
					self._wrongCodes.push(self.code());
				} else if (exception.getOriginal().getResponseCode() == 403) {
					self.createAccountTextId("createAccountTooManyAttempts_msg");
				} else {
					self.createAccountTextId("createAccountError_msg");
				}
			} else {
				self.createAccountTextId("createAccountError_msg");
			}
		} else {
			self.generateKeys();
		}
	});
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.backToStartPage = function() {
	this._sendSmsState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype.generateKeys = function() {
	var self = this;
	self.createAccountTextId("createAccountPleaseWait_msg");
	tutao.locator.entropyCollector.fetchMissingEntropy(function() {
		self._generateKeys(function(exception) {
			if (exception) {
				console.log(exception);
				self._keyGenProgress(0);
				self._createAccountState(tutao.tutanota.ctrl.RegistrationViewModel.PROCESS_STATE_NOT_RUNNING);
				self.createAccountTextId("createAccountError_msg");
			} else {
				tutao.locator.navigator.login(); // the user is still logged in at this moment. This is why the navigator will re-initialize the whole application.
				setTimeout(function() {					
					tutao.locator.loginViewModel.setMailAddress(self.mailAddress() + "@tutanota.com");
					tutao.locator.loginViewModel.setWelcomeTextId("afterRegistration_msg");
				}, 0);
			}
		});
	});
};

tutao.tutanota.ctrl.RegistrationViewModel.prototype._generateKeys = function(callback) {
	var self = this;
	tutao.entity.sys.SystemKeysService.load({}, null, function(keyData, exception) {
		if (exception) {
			callback(exception);
			return;
		}

		var systemUserPubKeyBase64 = keyData.getSystemPubKey();
		var systemUserPubKeyVersion = keyData.getSystemPubKeyVersion();

		var customerService = new tutao.entity.sys.CustomerService();

		var salt = tutao.locator.kdfCrypter.generateRandomSalt();
		tutao.locator.kdfCrypter.generateKeyFromPassphrase(self.passphrase1(), salt, function(userPassphraseKeyHex) {
			self._keyGenProgress(5);
			var userPassphraseKey = tutao.locator.aesCrypter.hexToKey(userPassphraseKeyHex);

			// use a temporary key as user key and reencrypt it afterwards
			var tmpKey = tutao.locator.aesCrypter.generateRandomKey();
			tutao.tutanota.ctrl.GroupData.generateGroupKeys("admin", "", tmpKey, null, function(adminGroupData, exception) {
				self._keyGenProgress(35);
				if (exception) {
					callback(exception);
					return;
				}
				var adminPubKey = tutao.locator.rsaCrypter.hexToKey(adminGroupData.getPubKey());
				tutao.tutanota.ctrl.GroupData.generateGroupKeys(self.name(), self.mailAddress() + "@tutanota.com", userPassphraseKey, adminPubKey, function(userGroupData, exception) {
					self._keyGenProgress(65);
					if (exception) {
						callback(exception);
						return;
					}

					// reencrypt the admin key with the user key, because the user key was not available before
					adminGroupData.setSymEncGKey(tutao.locator.aesCrypter.encryptKey(userGroupData.getSymGroupKey(), adminGroupData.getSymGroupKey()));

					tutao.tutanota.ctrl.GroupData.generateGroupKeys("customer", "", userGroupData.getSymGroupKey(), adminPubKey, function(customerGroupData, exception) {
						self._keyGenProgress(95);
						if (exception) {
							callback(exception);
							return;
						}

						var customerSessionKey = tutao.locator.aesCrypter.generateRandomKey();
						var customerBucketKey = tutao.locator.aesCrypter.generateRandomKey();

						var clientKey = tutao.locator.aesCrypter.generateRandomKey();
						var pwEncClientKey = tutao.locator.aesCrypter.encryptKey(userPassphraseKey, clientKey);
						// encrypt the session keys for the permissions
						var adminEncCustomerSessionKey = tutao.locator.aesCrypter.encryptKey(adminGroupData.getSymGroupKey(), customerSessionKey);
						var customerEncUserGroupSessionKey = tutao.locator.aesCrypter.encryptKey(customerGroupData.getSymGroupKey(), userGroupData.getSessionKey());
						var customerEncAdminGroupSessionKey = tutao.locator.aesCrypter.encryptKey(customerGroupData.getSymGroupKey(), adminGroupData.getSessionKey());
						var adminEncUserSessionKey = tutao.locator.aesCrypter.encryptKey(adminGroupData.getSymGroupKey(), userGroupData.getSessionKey());

						var symEncAccountGroupKey = tutao.locator.aesCrypter.encryptKey(userGroupData.getSymGroupKey(), tutao.locator.aesCrypter.hexToKey(tutao.util.EncodingConverter.base64ToHex(keyData.getFreeGroupKey())));

						var systemUserPubKey = tutao.locator.rsaCrypter.hexToKey(tutao.util.EncodingConverter.base64ToHex(systemUserPubKeyBase64));

						var customerBucketEncCustomerSessionKey = tutao.locator.aesCrypter.encryptKey(customerBucketKey, customerSessionKey);

						tutao.locator.rsaCrypter.encryptAesKey(systemUserPubKey, tutao.locator.aesCrypter.keyToHex(customerBucketKey), function(systemPubEncCustomerBucketKey, exception) {
							self._keyGenProgress(97);
							if (exception) {
								callback(exception);
								return;
							}

							customerService.setAuthToken(self.authToken);
							customerService.setAdminEncAdminSessionKey(adminGroupData.getSymEncSessionKey());
							customerService.setAdminEncCustomerSessionKey(adminEncCustomerSessionKey);
							customerService.setAdminEncPrivKey(adminGroupData.getSymEncPrivKey());
							customerService.setAdminEncUserSessionKey(adminEncUserSessionKey);
							customerService.setAdminGroupName(adminGroupData.getEncryptedName());
							customerService.setAdminPubEncCustomerKey(customerGroupData.getPubEncGKey());
							customerService.setAdminPubEncUserKey(userGroupData.getPubEncGKey());
							customerService.setAdminPubKey(adminGroupData.getPubKey());
							customerService.setCustomerEncAdminSessionKey(customerEncAdminGroupSessionKey);
							customerService.setCustomerEncCustomerSessionKey(customerGroupData.getSymEncSessionKey());
							customerService.setCustomerEncPrivKey(customerGroupData.getSymEncPrivKey());
							customerService.setCustomerEncUserSessionKey(customerEncUserGroupSessionKey);
							customerService.setCustomerGroupName(customerGroupData.getEncryptedName());
							customerService.setCompany(tutao.locator.aesCrypter.encryptUtf8(customerSessionKey, "", true));
							customerService.setGenderMale(tutao.locator.aesCrypter.encryptUtf8(customerSessionKey, "1", true));
							customerService.setFirstName(tutao.locator.aesCrypter.encryptUtf8(customerSessionKey, "", true));
							customerService.setLastName(tutao.locator.aesCrypter.encryptUtf8(customerSessionKey, "", true));
							customerService.setAddress(tutao.locator.aesCrypter.encryptUtf8(customerSessionKey, "", true));
							customerService.setCustomerPubKey(customerGroupData.getPubKey());
							customerService.setPwEncClientKey(pwEncClientKey);
							customerService.setPwEncUserKey(userGroupData.getSymEncGKey());
							customerService.setCustomerBucketEncCustomerSessionKey(customerBucketEncCustomerSessionKey);
							customerService.setSystemPubEncCustomerBucketKey(systemPubEncCustomerBucketKey);
							customerService.setSystemPubKeyVersion(systemUserPubKeyVersion);
							customerService.setUserEncAdminKey(adminGroupData.getSymEncGKey());
							customerService.setUserEncCustomerKey(customerGroupData.getSymEncGKey());
							customerService.setUserEncPrivKey(userGroupData.getSymEncPrivKey());
							customerService.setUserEncUserSessionKey(userGroupData.getSymEncSessionKey());
							customerService.setUserGroupMailAddress(userGroupData.getMailAddr());
							customerService.setUserGroupName(userGroupData.getEncryptedName());
							customerService.setUserPubKey(tutao.util.EncodingConverter.hexToBase64(userGroupData.getPubKey()));
							customerService.setSalt(tutao.util.EncodingConverter.hexToBase64(salt));
							customerService.setVerifier(tutao.locator.shaCrypter.hashHex(userPassphraseKeyHex));
							customerService.setSymEncAccountGroupKey(symEncAccountGroupKey);

							customerService.setup({}, null, function(userId, exception) {
								if (exception) {
									callback(exception);
									return;
								}
								tutao.locator.userController.loginUser(userGroupData.getMailAddr(), self.passphrase1(), function(exception) {
									if (exception) {
										callback(exception);
										return;
									}
									//TODO create root instances and welcome mail before login
									var s = new tutao.entity.tutanota.InitGroupService();

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

									s.setup({}, tutao.entity.EntityHelper.createAuthHeaders(), function(nothing, exception) {
										if (exception) {
											callback(exception);
											return;
										}
										var map = {};
										map[tutao.rest.ResourceConstants.LANGUAGE_PARAMETER_NAME] = tutao.locator.languageViewModel.getCurrentLanguage();
										new tutao.entity.tutanota.WelcomeMailService().setup(map, tutao.entity.EntityHelper.createAuthHeaders(), function() {});
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
