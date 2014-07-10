"use strict";

goog.provide('tutao.tutanota.ctrl.LoginViewModel');

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

	this.mailAddress.subscribe(function(newValue) {
	    this.loginStatus({ type: "neutral", text: "emptyString_msg" });
	}, this);
	this.passphrase.subscribe(function(newValue) {
	    this.loginStatus({ type: "neutral", text: "emptyString_msg" });
	}, this);
	
	this.loginPossible = ko.computed(function() {
		return (!this.loginOngoing());
	}, this);
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
 * Logs a user into the system:
 * <ul>
 *   <li>Sets the logged in user on the UserController
 *   <li>Initializes the DBFacade for the user
 *   <li>Switches to the MailView
 * </ul>
 * @param {function=} callback Called when finished.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.login = function(callback) {
	var self = this;
	if (!this.loginPossible()) {
		return;
	}
	this.loginOngoing(true);
	// in private browsing mode in mobile safari local storage is not available and throws an exception
	this.passphraseFieldFocused(false);
	tutao.tutanota.util.LocalStore.store('userMailAddress', this.mailAddress());
	tutao.locator.userController.loginUser(self.mailAddress(), self.passphrase(), function(exception) {
		if (exception) {
			if ((exception instanceof tutao.rest.EntityRestException) && (exception.getOriginal() instanceof tutao.rest.RestException) && (exception.getOriginal().getResponseCode() == 472)) { // AccessBlockedException
				self.loginStatus({ type: "invalid", text: "loginFailedOften_msg" });
			} else {
				self.loginStatus({ type: "invalid", text: "loginFailed_msg" });
			}
			self.loginOngoing(false);
			if (callback && callback instanceof Function) {
				callback();
			}
			return;
		}
		tutao.locator.mailBoxController.initForUser(function() {
            self.loadEntropy(function() {
                // this should be the user id instead of the name later
                tutao.locator.dao.init("Tutanota_" + self.mailAddress(), function() {
                    tutao.locator.eventBus.connect();
                    if (tutao.locator.userController.getLoggedInUser().getAccountType() == tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER) {
                        // Starter users may only use settings
                        tutao.locator.navigator.settings();
                    } else {
                        tutao.locator.navigator.mail();
                    }
                    self.loginOngoing(false);
                    // load all contacts to have them available in cache, e.g. for RecipientInfos
                    tutao.entity.tutanota.Contact.loadRange(tutao.locator.mailBoxController.getUserContactList().getContacts(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID, tutao.rest.EntityRestInterface.MAX_RANGE_COUNT, false, function(loadedContacts, exception) {});
                    if (callback && callback instanceof Function) {
                        callback();
                    }
                });
            });
		});
	});
};

/**
 * Loads entropy from the last logout. Fetches missing entropy if none was stored yet and stores it.
 * @param {function()} callback Called when finished.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.loadEntropy = function(callback) {
    var self = this;
    var groupEncEntropy = tutao.locator.mailBoxController.getUserProperties().getGroupEncEntropy();
    if (!groupEncEntropy) {
        tutao.locator.entropyCollector.fetchMissingEntropy(function() {
            self.storeEntropy();
            callback();
        });
    } else {
        var entropy = tutao.locator.aesCrypter.decryptBytes(tutao.locator.userController.getUserGroupKey(), groupEncEntropy);
        tutao.locator.entropyCollector.addStaticEntropy(entropy);
        callback();
    }
};

/**
 * Stores entropy from the randomizer for the next login.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.storeEntropy = function() {
    var groupEncEntropy = tutao.locator.aesCrypter.encryptBytes(tutao.locator.userController.getUserGroupKey(), tutao.util.EncodingConverter.hexToBase64(tutao.locator.randomizer.generateRandomData(32)));
    tutao.locator.mailBoxController.getUserProperties().setGroupEncEntropy(groupEncEntropy);
    tutao.locator.mailBoxController.getUserProperties().update(function(exception) {
        if (exception) {
            console.log(exception);
        }
    });
};

tutao.tutanota.ctrl.LoginViewModel.prototype.createAccount = function() {
    tutao.locator.navigator.register();
};

/**
 * Completely clears the DB for the current user
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.clearDbForUser = function() {
	// delete the mails from the server
	tutao.locator.userController.loginUser(this.selectedUser(), this.selectedUser(), function(exception) {
		if (!exception) {
			tutao.locator.mailBoxController.initForUser(function() {
				tutao.entity.tutanota.Mail.loadRange(tutao.locator.mailBoxController.getUserMailBox().getMails(), tutao.rest.EntityRestInterface.GENERATED_MIN_ID, tutao.rest.EntityRestInterface.MAX_RANGE_COUNT, false, function(loadedMails, exception) {
					if (!exception) {
						if (loadedMails.length > 0) {
							for (var i = 0; i < loadedMails.length; i++) {
								//enable when deleting mails is activated: loadedMails[i].erase(function() {});
							}
						}

						// delete the search index
						tutao.locator.dao.init("Tutanota_" + this.selectedUser(), function() {
							tutao.locator.dao.clear();
						});
					}
				});
			});
		}
	});
};

/**
 * writes dummy-entries to the db in order to fill it for demonstration purposes
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.fillDb = function() {
	var self = this;
	var max = self.fillDbIndex + tutao.tutanota.ctrl.LoginViewModel.maxEntries;
	this.updateProgress(0, max);
	tutao.locator.dao.init("Tutanota_" + this.selectedUser(), function() {
		self.writeDummyEntry(max);
	});
};

/**
 * The maximum nbr of index entries when filling the db.
 */
tutao.tutanota.ctrl.LoginViewModel.maxEntries = 1000;

/**
 * Writes index entries into the local database to make the user accept higher memory limits.
 * @param {number} max The maximum number of index entries in the db.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.writeDummyEntry = function(max) {
	if (this.fillDbIndex === max) {
		return;
	}
	this.fillDbIndex++;
	var values = [this.randomString()];
	this.updateProgress(this.fillDbIndex, max);
	var typeId = 1;
	var attributeIds = [1];
	setTimeout(
			tutao.locator.dao.addIndexEntries(typeId, attributeIds, this.fillDbIndex + "", values, this.writeDummyEntry(max)), 10);
};

/**
 * Creates and returns a string of random characters. length: 6000 characters.
 * @return {string} The random string.
 */
tutao.tutanota.ctrl.LoginViewModel.prototype.randomString = function() {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 6000;
	var randomstring = '';
	for (var i = 0; i < string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum, rnum + 1);
	}
	return randomstring;
};
