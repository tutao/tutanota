"use strict";

tutao.provide('tutao.entity.tutanota.ContactExtension');

/**
 * Adds extended functionality to the given editable contact.
 * @param {tutao.entity.tutanota.ContactEditable} editableContact The contact to add the functionality to.
 */
tutao.entity.tutanota.ContactExtension = function(editableContact) {
	//noinspection JSUndefinedPropertyAssignment
    editableContact.birthdayString = ko.observable(null);
    //noinspection JSUndefinedPropertyAssignment
	editableContact.birthdayStringInvalid = ko.observable(false);
    //noinspection JSUndefinedPropertyAssignment
	editableContact.birthdayStringComputed = ko.computed({
        read: function() {
        	if (editableContact.birthdayString() == null) {
        		// the birthday string is requested the first time and must be inititialized
        		if (editableContact.birthday()) {
        			editableContact.birthdayString(tutao.tutanota.util.Formatter.dateToDashString(editableContact.birthday()));
        		} else {
        			editableContact.birthdayString("");
        		}
        	}
        	return editableContact.birthdayString();
        },
        write: function(value) {
        	if (value == "") {
        		editableContact.birthdayStringInvalid(false);
        		editableContact.birthday(null);
        	} else {
	        	var date = tutao.tutanota.util.Formatter.dashStringToDate(value);
	        	if (date != null) {
	        		editableContact.birthdayStringInvalid(false);
	        		editableContact.birthday(date);
	        	} else {
	        		editableContact.birthdayStringInvalid(true);
	        		editableContact.birthday(null);
	        	}
        	}
        	editableContact.birthdayString(value);
        },
        owner: editableContact
    });

	tutao.entity.tutanota.ContactExtension.addNewObservable(
			editableContact,
			tutao.entity.tutanota.ContactExtension.createEmptyContactMailAddressEditable,
			"newContactMailAddress",
			"newContactMailAddressUpdated",
			"address",
			"mailAddresses"
	);
	tutao.entity.tutanota.ContactExtension.addNewObservable(
			editableContact,
			tutao.entity.tutanota.ContactExtension.createEmptyContactPhoneNumberEditable,
			"newContactPhoneNumber",
			"newContactPhoneNumberUpdated",
			"number",
			"phoneNumbers"
	);
	tutao.entity.tutanota.ContactExtension.addNewObservable(
			editableContact,
			tutao.entity.tutanota.ContactExtension.createEmptyMobileContactPhoneNumberEditable,
			"newMobileContactPhoneNumber",
			"newMobileContactPhoneNumberUpdated",
			"number",
			"phoneNumbers"
	);
	tutao.entity.tutanota.ContactExtension.addNewObservable(
			editableContact,
			tutao.entity.tutanota.ContactExtension.createEmptyContactAddressEditable,
			"newContactAddress",
			"newContactAddressUpdated",
			"address",
			"addresses"
	);
	tutao.entity.tutanota.ContactExtension.addNewObservable(
			editableContact,
			tutao.entity.tutanota.ContactExtension.createEmptyContactSocialIdEditable,
			"newContactSocialId",
			"newContactSocialIdUpdated",
			"socialId",
			"socialIds"
	);
};

/**
 * Provides the functionality to add a new empty data line in the dom for contact's aggregations of type T, e.g. ContactMailAddress.
 * As soon as the main field (triggerFieldName) was filled and the focus removed, the new data is added to the contact and
 * a new empty data line is created.
 * @param {tutao.entity.tutanota.ContactEditable} editableContact The ContactEditable that is shall be affected.
 * @param {function()} createFunction The function that creates new instances of the editable data type containing an empty instance.
 * @param {string} observableName The name of the observable that is added to the editableContact which holds the empty editable data instance. It should be bound from html.
 * @param {string} updatedFunctionName The name of the function that must be called as soon as the focus leaves the trigger field in the dom.
 * @param {string} triggerFieldName The name of the field in the new observable that triggers the copy to the editable if it is not empty.
 * @param {string} listName The name of the observable array in the ContactEditable that contains the editables of type T. The new instance is added to this list when filled.
 */
tutao.entity.tutanota.ContactExtension.addNewObservable = function(editableContact, createFunction, observableName, updatedFunctionName, triggerFieldName, listName) {
	var a = createFunction(editableContact.getContact());
	editableContact[observableName] = ko.observable(a);

	editableContact[updatedFunctionName] = function(model, event) {
		if (editableContact[observableName]()[triggerFieldName]() != "") {
			editableContact[listName].push(editableContact[observableName]());
			editableContact[observableName](createFunction(editableContact.getContact()));
		}
	};
};

/**
 * Creates a new editable empty mail address for the given contact with the default type CONTACT_MAIL_ADDRESS_TYPE_PRIVATE.
 * @param {tutao.entity.tutanota.Contact} The contact.
 */
tutao.entity.tutanota.ContactExtension.createEmptyContactMailAddressEditable = function(contact) {
	var newma = new tutao.entity.tutanota.ContactMailAddress(contact);
	newma.setAddress("");
	newma.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_PRIVATE);
	newma.setCustomTypeName("");
	return new tutao.entity.tutanota.ContactMailAddressEditable(newma);
};

/**
 * Creates a new editable empty phone number for the given contact with the default type CONTACT_PHONE_NUMBER_TYPE_PRIVATE.
 * @param {tutao.entity.tutanota.Contact} The contact.
 */
tutao.entity.tutanota.ContactExtension.createEmptyContactPhoneNumberEditable = function(contact) {
	var newma = new tutao.entity.tutanota.ContactPhoneNumber(contact);
	newma.setNumber("");
	newma.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_PRIVATE);
	newma.setCustomTypeName("");
	return new tutao.entity.tutanota.ContactPhoneNumberEditable(newma);
};

/**
 * Creates a new editable empty phone number for the given contact with the default type CONTACT_PHONE_NUMBER_TYPE_MOBILE.
 * @param {tutao.entity.tutanota.Contact} The contact.
 */
tutao.entity.tutanota.ContactExtension.createEmptyMobileContactPhoneNumberEditable = function(contact) {
	var newma = new tutao.entity.tutanota.ContactPhoneNumber(contact);
	newma.setNumber("");
	newma.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_MOBILE);
	newma.setCustomTypeName("");
	return new tutao.entity.tutanota.ContactPhoneNumberEditable(newma);
};

/**
 * Creates a new editable empty address for the given contact with the default type CONTACT_ADDRESS_TYPE_PRIVATE.
 * @param {tutao.entity.tutanota.Contact} The contact.
 */
tutao.entity.tutanota.ContactExtension.createEmptyContactAddressEditable = function(contact) {
	var newma = new tutao.entity.tutanota.ContactAddress(contact);
	newma.setAddress("");
	newma.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_PRIVATE);
	newma.setCustomTypeName("");
	return new tutao.entity.tutanota.ContactAddressEditable(newma);
};

/**
 * Creates a new editable empty social id for the given contact with the default type CONTACT_SOCIAL_ID_TYPE_OTHER.
 * @param {tutao.entity.tutanota.Contact} The contact.
 */
tutao.entity.tutanota.ContactExtension.createEmptyContactSocialIdEditable = function(contact) {
	var newma = new tutao.entity.tutanota.ContactSocialId(contact);
	newma.setSocialId("");
	newma.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_OTHER);
	newma.setCustomTypeName("");
	return new tutao.entity.tutanota.ContactSocialIdEditable(newma);
};
