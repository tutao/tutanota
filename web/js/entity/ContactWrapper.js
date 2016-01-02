"use strict";

tutao.provide('tutao.entity.tutanota.ContactWrapper');

/**
 * Provides additional methods on a contact.
 * @param {tutao.entity.tutanota.Contact} contact The contact.
 * @constructor
 */
tutao.entity.tutanota.ContactWrapper = function(contact) {
	this._contact = contact;
};

// there shall be only one editable contact instance per contact to sync password channel and contact editing
// the cache contains a map from contact id to ContactEditable
tutao.entity.tutanota.ContactWrapper._editableContactsCache = [];

/**
 * Creates an empty contact and returns it wrapped.
 * @return {tutao.entity.tutanota.ContactWrapper} The wrapped empty contact.
 */
tutao.entity.tutanota.ContactWrapper.createEmptyContactWrapper = function() {
	var contact = new tutao.entity.tutanota.Contact();
    contact.setOwner(tutao.locator.userController.getUserGroupId());
    contact.setArea(tutao.entity.tutanota.TutanotaConstants.AREA_CONTACTS);
	contact.setFirstName("");
	contact.setLastName("");
	contact.setCompany("");
	contact.setTitle("");
	contact.setBirthday(null);
	contact.setComment("");
	contact.setAutoTransmitPassword("");
	return new tutao.entity.tutanota.ContactWrapper(contact);
};

/**
 * Creates a contact with an email address and a name.
 * @param {string} mailAddress The mail address of the contact. Type is OTHER.
 * @param {string} name The name of the contact. If an empty string is provided, the name is parsed from the mail address.
 * @return {tutao.entity.tutanota.ContactWrapper} The wrapped contact.
 */
tutao.entity.tutanota.ContactWrapper.createContactWrapper = function(mailAddress, name) {
		var contactWrapper = tutao.entity.tutanota.ContactWrapper.createEmptyContactWrapper();

		// prepare some contact information. it is only saved if the mail is sent securely
		// use the name or mail address to extract first and last name. first part is used as first name, all other parts as last name
        var firstAndLastName = null;
        if (name != "") {
            firstAndLastName = tutao.tutanota.util.Formatter.fullNameToFirstAndLastName(name);
        } else {
            firstAndLastName = tutao.tutanota.util.Formatter.mailAddressToFirstAndLastName(mailAddress);
        }

        contactWrapper.getContact().setFirstName(firstAndLastName.firstName);
        contactWrapper.getContact().setLastName(firstAndLastName.lastName);

        var newma = new tutao.entity.tutanota.ContactMailAddress(contactWrapper.getContact());
        newma.setAddress(mailAddress);
        newma.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER);
        newma.setCustomTypeName("");
        contactWrapper.getContact().getMailAddresses().push(newma);
		return contactWrapper;
};


/**
 * Provides the wrapped contact.
 * @return {tutao.entity.tutanota.Contact} The contact.
 */
tutao.entity.tutanota.ContactWrapper.prototype.getContact = function() {
	return this._contact;
};

/**
 * Returns true if the given mail address matches one of the mail addresses of this contact.
 * @param {string} mailAddress The mailAddress to check in lower case.
 * @return {boolean} True if the mailAddress matches, false otherwise.
 */
tutao.entity.tutanota.ContactWrapper.prototype.hasMailAddress = function(mailAddress) {

    var cleanedMailAddress = tutao.tutanota.util.Formatter.getCleanedMailAddress(mailAddress);
	for (var i = 0; i < this._contact.getMailAddresses().length; i++) {
        var cleanedContactMailAddress = tutao.tutanota.util.Formatter.getCleanedMailAddress(this._contact.getMailAddresses()[i].getAddress());
		if (cleanedContactMailAddress === cleanedMailAddress) {
			return true;
		}
	}
	return false;
};

/**
 * Provides the full name of the given contact consisting of first and last name.
 * @return {string} The full name of the contact.
 */
tutao.entity.tutanota.ContactWrapper.prototype.getFullName = function() {
	var fullName = this._contact.getFirstName() + " " + this._contact.getLastName();
	return fullName.trim(); // cut off the whitespace if first or last name is not existing
};

/**
 * Provides the name of the contact by which it is sorted in the contact list.
 * @return {string} The sort name of the contact.
 */
tutao.entity.tutanota.ContactWrapper.prototype.getSortName = function() {
    return (this._contact.getLastName().trim().toLowerCase() != "") ? (this._contact.getLastName().trim().toLowerCase() + ", " + this._contact.getFirstName().trim().toLowerCase()) : this._contact.getFirstName().trim().toLowerCase();
};

/**
 * Provides the age of the contact.
 * @return {string=} The age or null if no birthday exists.
 */
tutao.entity.tutanota.ContactWrapper.prototype.getAge = function() {
	if (this._contact.getBirthday()) {
        var today = new Date();
        var birthDate = this._contact.getBirthday();
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return String(age);
	} else {
		return null;
	}
};

/**
 * Provides the type name of the given mail address.
 * @param {tutao.entity.tutanota.ContactMailAddress} contactMailAddress The mail address of a contact.
 * @return {string} The name of the mail address type.
 */
tutao.entity.tutanota.ContactWrapper.getMailAddressTypeName = function(contactMailAddress) {
	if (contactMailAddress.getType() == tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_CUSTOM) {
		return contactMailAddress.getCustomTypeName();
	} else {
		return tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_NAMES()[contactMailAddress.getType()].name;
	}
};

/**
 * Provides the type name of the given phone number.
 * @param {tutao.entity.tutanota.ContactPhoneNumber} contactPhoneNumber The phone number of a contact.
 * @return {string} The name of the phone number type.
 */
tutao.entity.tutanota.ContactWrapper.getPhoneNumberTypeName = function(contactPhoneNumber) {
	if (contactPhoneNumber.getType() == tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_CUSTOM) {
		return contactPhoneNumber.getCustomTypeName();
	} else {
		return tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_NAMES()[contactPhoneNumber.getType()].name;
	}
};

/**
 * Provides the type name of the given address.
 * @param {tutao.entity.tutanota.ContactAddress} contactAddress The address of a contact.
 * @return {string} The name of the address type.
 */
tutao.entity.tutanota.ContactWrapper.getAddressTypeName = function(contactAddress) {
	if (contactAddress.getType() == tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_CUSTOM) {
		return contactAddress.getCustomTypeName();
	} else {
		return tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_NAMES()[contactAddress.getType()].name;
	}
};

/**
 * Provides the type name of the given social id.
 * @param {tutao.entity.tutanota.ContactSocialId} contactSocialId The social id of a contact.
 * @return {string} The name of the social id type.
 */
tutao.entity.tutanota.ContactWrapper.getSocialIdTypeName = function(contactSocialId) {
	if (contactSocialId.getType() == tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_CUSTOM) {
		return contactSocialId.getCustomTypeName();
	} else {
		return tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_NAMES()[contactSocialId.getType()].name;
	}
};

/**
 * Provided the ContactEditable instance for this contact. As long as one or more instances edit the same contact, always the same ContactEditable instance is provided.
 * @param {Object} editingInstance The instance that edits the contact.
 */
tutao.entity.tutanota.ContactWrapper.prototype.startEditingContact = function(editingInstance) {
	var cache = tutao.entity.tutanota.ContactWrapper._editableContactsCache;
	var entry = null;
	for (var i = 0; i < cache.length; i++) {
		if (cache[i].editable.getContact() == this._contact) {
			entry = cache[i];
			break;
		}
	}
	if (entry && entry.editingInstances.indexOf(editingInstance) != -1) {
		console.log("start editing without stop", editingInstance);
	} else if (!entry) {
		entry = { "editable": new tutao.entity.tutanota.ContactEditable(this._contact), "editingInstances": [editingInstance] };
		cache.push(entry);
	} else {
		entry.editingInstances.push(editingInstance);
	}
	return entry.editable;
};


/**
 * Deletes the ContactEditable as soon as there are no more instances that edit the contact.
 * @param {Object} editingInstance The instance that has edited the contact.
 */
tutao.entity.tutanota.ContactWrapper.prototype.stopEditingContact = function(editingInstance) {
	var cache = tutao.entity.tutanota.ContactWrapper._editableContactsCache;
	var entry = null;
	var i = 0;
	for (; i < cache.length; i++) {
		if (cache[i].editable.getContact() == this._contact) {
			entry = cache[i];
			break;
		}
	}
	if (!entry || entry.editingInstances.indexOf(editingInstance) == -1) {
		console.log("stop editing without start", editingInstance);
		return;
	}
	entry.editingInstances.splice(entry.editingInstances.indexOf(editingInstance), 1);
	if (entry.editingInstances.length == 0) {
		cache.splice(i, 1);
	}
};
