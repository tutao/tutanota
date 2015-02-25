"use strict";

tutao.provide('tutao.tutanota.ctrl.PasswordChannelViewModel');

/**
 * The configuration for the password message for secure external recipients.
 * @constructor
 */
tutao.tutanota.ctrl.PasswordChannelViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    this.selectedLanguage = ko.observable(null);
	this.availableLanguages = ko.observableArray();
};

tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.init = function(){
	this.availableLanguages(tutao.locator.languageViewModel.getLanguages());
	this.availableLanguages.sort(function(a,b){
		return tutao.lang(a.textId).localeCompare(tutao.lang(b.textId));
	});
	var currentLanguage = tutao.locator.mailBoxController.getUserProperties().getNotificationMailLanguage();
    if (currentLanguage == null ){
        currentLanguage = tutao.locator.languageViewModel.getCurrentLanguage();
    }

	for(var i=0; i < this.availableLanguages().length; i++){
		if (this.availableLanguages()[i].id == currentLanguage){
			this.selectedLanguage(this.availableLanguages()[i]);
		}
	}
};


/**
 * Returns a array of external recipients.
 * @return {Array.<tutao.tutanota.ctrl.RecipientInfo>} the array of external recipients.
 */
    tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.getSecureExternalRecipients = function() {
	var externalRecipients = [];
	if (tutao.locator.mailViewModel.isComposingMailToSecureExternals()) {
		var allRecipients = tutao.locator.mailViewModel.getComposingMail().getAllComposerRecipients();
		for (var i = 0; i < allRecipients.length; i++) {
			if (allRecipients[i].isExternal()) {
               externalRecipients.push(allRecipients[i]);
			}
		}
	}
	return externalRecipients;
};

/**
 * Provides the information if the given phone number is a saved mobile number. If the number only exists in the editable contact, but not
 * in the underlying contact (i.e. it was not saved), then false is returned. Additionally an observer is registered which triggers an update
 * of bindings to this function if the contact is saved, i.e. if the returned information might not be valid any more).
 * @param {tutao.entity.tutanota.ContactPhoneNumberEditable} editablePhoneNumber The phone number to check.
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The editable contact which contains the editablePhoneNumber.
 * @return {Boolean} True if the given number is saved in the contact and is a mobile number, false otherwise.
 * @precondition (recipientInfo.isExternal() == true), otherwise there is no editable contact in the recipient info
 */
tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.isSavedMobileNumber = function(editablePhoneNumber, recipientInfo) {
	// observe contact updates by registering an observer on the lastUpdatedTimestamp
	recipientInfo.getEditableContact().lastUpdatedTimestamp();
	var savedPhoneNumbers = recipientInfo.getEditableContact().getContact().getPhoneNumbers();
	for (var i = 0; i < savedPhoneNumbers.length; i++) {
		var number = savedPhoneNumbers[i];
		if (number.getNumber() == editablePhoneNumber.number() && number.getType() == editablePhoneNumber.type() && number.getCustomTypeName() == editablePhoneNumber.customTypeName()) {
			return tutao.tutanota.ctrl.RecipientInfo.isValidMobileNumber(editablePhoneNumber.number());
		}
	}
	return false;
};

/**
 * Provides the information if the given phone number is not saved, i.e. only exists in the editable contact but not in the underlying contact.
 * Additionally an observer is registered which triggers an update
 * of bindings to this function if the contact is saved, i.e. if the returned information might not be valid any more).
 * @param {tutao.entity.tutanota.ContactPhoneNumberEditable} editablePhoneNumber The phone number to check.
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The editable contact which contains the editablePhoneNumber.
 * @return {Boolean} True if the given number is not saved in the contact, false otherwise.
 * @precondition (recipientInfo.isExternal() == true), otherwise there is no editable contact in the recipient info
 */
tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.isNotSavedNumber = function(editablePhoneNumber, recipientInfo) {
	// observe contact updates by registering an observer on the lastUpdatedTimestamp
	recipientInfo.getEditableContact().lastUpdatedTimestamp();
	var savedPhoneNumbers = recipientInfo.getEditableContact().getContact().getPhoneNumbers();
	for (var i = 0; i < savedPhoneNumbers.length; i++) {
		var number = savedPhoneNumbers[i];
		if (number.getNumber() == editablePhoneNumber.number() && number.getType() == editablePhoneNumber.type() && number.getCustomTypeName() == editablePhoneNumber.customTypeName()) {
			return false;
		}
	}
	return true;
};

/**
 * Provides the information if any of the recipientInfo's editable contact's newly added phone numbers are not mobile phone numbers.
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The recipient info to check.
 * @return {Boolean} True if any non-saved non-mobile phone numbers exist in the given recipient info, false otherwise.
 */
tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.containsInvalidNotSavedNumbers = function(recipientInfo) {
	if (!recipientInfo.isExternal()) {
		return false;
	}
	var editablePhoneNumbers = recipientInfo.getEditableContact().phoneNumbers();
	for (var i = 0; i < editablePhoneNumbers.length; i++) {
		if (this.isNotSavedNumber(editablePhoneNumbers[i], recipientInfo) && !tutao.tutanota.ctrl.RecipientInfo.isValidMobileNumber(editablePhoneNumbers[i].number())) {
			return true;
		}
	}
	return false;
};

/**
 * Edit the given recipient contact. If a different contact is already edited, the user is asked to cancel that one.
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The contact from this recipient info shall be edited.
 */
tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.editRecipient = function(recipientInfo) {
	// show the currently editing contact to the user even if he does not want to discard the changes
	// if we should decide not to show the editing contact, separate the tryToShowAndEditContact functionality
	// into cancelling the editing contact and showing the new one. in between the view must be switched, because the touch composing mode
	// must not be enabled as soon as the wrong view is visible.
	tutao.locator.navigator.contact();
	tutao.locator.contactView.showContactColumn();
	// the setTimeout is needed because otherwise the contact view is not necessarily shown
	setTimeout(function() {
		tutao.locator.contactViewModel.tryToShowAndEditContact(recipientInfo.getContactWrapper()).then(function(success) {
            if (!success) {
                tutao.locator.navigator.mail();
            }
        });
	}, 0);
};

tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.defineManualPassword = function(recipientInfo) {
	recipientInfo.getEditableContact().presharedPassword(""); // makes the text field appear for the sender to enter the password
};

tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.removePresharedPassword = function(recipientInfo) {
	recipientInfo.getEditableContact().presharedPassword(null);
};

/**
 * Provides the pre-shared password strength in %. If no pre-shared password is set, 0 is returned. 
 * @param {tutao.tutanota.ctrl.RecipientInfo} recipientInfo The contact of which the preshared password shall be checked.
 * @return {Number} The strength of the password.
 */
tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.getPasswordStrength = function(recipientInfo) {
	var password = recipientInfo.getEditableContact().presharedPassword();
	if (password) {		
		return tutao.tutanota.util.PasswordUtils.getPasswordStrength(password, [tutao.locator.userController.getMailAddress(), tutao.locator.userController.getUserGroupInfo().getName(), recipientInfo.getMailAddress(), recipientInfo.getName()]);
	} else {
		return 0;
	}
};


/**
 * Checks if the auto transmition of the password is allowed for the logged in user.
 * @return {boolean} True if the auto transmition is allowed.
 */
tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.isAutoTransmitPasswordAllowed = function() {
	// Get the account type from the ViewManager because the login state is a ko observable to get notfied when the logged in user changes.
    return tutao.locator.viewManager.getLoggedInUserAccountType() === tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_PREMIUM;
};


/**
 * Checks if the auto transmition of the password is deactivated for the logged in user
 * @return {boolean} True if the auto transmition is deactivated.
 */
tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.isAutoTransmitPasswordDeactivated = function() {
    // Get the account type from the ViewManager because the login state is a ko observable to get notfied when the logged in user changes.
    return tutao.locator.viewManager.getLoggedInUserAccountType() === tutao.entity.tutanota.TutanotaConstants.ACCOUNT_TYPE_STARTER;
};

/**
 * Returns a translatable description of the password channel for the logged in user.
 *
 * @return {String} Description of the password channel.
 */
tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.getPasswordChannelDescription = function() {
    if (this.isAutoTransmitPasswordAllowed()){
        return tutao.locator.languageViewModel.get('atLeastOneMobileNumber_label',[]);
    }else{
        var text = tutao.locator.languageViewModel.get('preSharedPasswordNeeded_label',[]);
        if ( this.isAutoTransmitPasswordDeactivated()){
            text += " " + tutao.locator.languageViewModel.get('autoTransmitPasswordDeactivated_label',[]);
        }
        return text;
    }
};

tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.getNotificationMailLanguage = function() {
    return this.selectedLanguage().id;
};
