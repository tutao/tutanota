"use strict";

goog.provide('tutao.tutanota.ctrl.PasswordChannelViewModel');

/**
 * The configuration for the password message for secure external recipients.
 * @constructor
 */
tutao.tutanota.ctrl.PasswordChannelViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
};

/**
 * Returns a sorted (recipients with missing phone numbers first) array of recipients.
 * @return {Array.<tutao.tutanota.ctrl.RecipientInfo>} the array of external recipients.
 */
tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.getSecureExternalRecipients = function() {
	var missingChannelRecipients = [];
	var existingChannelRecipients = [];
	if (tutao.locator.mailViewModel.isComposingMailToSecureExternals()) {
		//TODO remove duplicates
		var allRecipients = tutao.locator.mailViewModel.getComposingMail().getAllComposerRecipients();
		for (var i = 0; i < allRecipients.length; i++) {
			if (allRecipients[i].isExternal()) {
				if (allRecipients[i].isSecure()) {
					existingChannelRecipients.push(allRecipients[i]);
				} else {
					missingChannelRecipients.push(allRecipients[i]);
				}
			}
		}
	}
	return missingChannelRecipients.concat(existingChannelRecipients);
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
 * Edit the given recipient contact. If a different contact is already edited, the user us asked to cancel that one.
 * TODO move to Navigator.js
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
		if (!tutao.locator.contactViewModel.tryToShowAndEditContact(recipientInfo.getContactWrapper())) {
			tutao.locator.navigator.mail();
		}
	}, 0);
};

/**
 * Provides an array containing a mapping of phone number types that can be selected for new mobile numbers, wrapped in a function
 * to allow dynamic language changes.
 * This array is a subset of tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_NAMES.
 * @return {function(): Array.<Object>}
 */
tutao.tutanota.ctrl.PasswordChannelViewModel.prototype.getValidMobileTypes = function() {
	return function() { return [{ id: tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_PRIVATE_MOBILE, name: tutao.locator.languageViewModel.get("privateMobile_label") },
             { id: tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_WORK_MOBILE, name: tutao.locator.languageViewModel.get("workMobile_label") }]; };
};
