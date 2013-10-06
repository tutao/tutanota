"use strict";

goog.provide('tutao.tutanota.ctrl.RecipientInfo');

/**
 * A recipient bubble represents a recipient from a contact or from a pure email address.
 * @param {string} mailAddress The email address to use as recipient.
 * @param {string} name The name that shall be used for the recipient.
 * @param {tutao.entity.tutanota.ContactWrapper=} contactWrapper The contact to use for recipient info.
 * @constructor
 */
tutao.tutanota.ctrl.RecipientInfo = function(mailAddress, name, contactWrapper) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._mailAddress = mailAddress;
	this._name = name;
	if (!contactWrapper) {
		this._contactWrapper = tutao.entity.tutanota.ContactWrapper.createEmptyContactWrapper();
		this._existingContact = false;
	} else {
		this._contactWrapper = contactWrapper;
		this._existingContact = true;
	}
	if (this.isExternal()) {
		this._editableContact = this._contactWrapper.startEditingContact(this);
		if (!this._existingContact) {
			// prepare some contact information. it is only saved if the mail is sent securely
			// use the name or mail address to extract first and last name. first part is used as first name, all other parts as last name
			var nameData = [];
			var addr = mailAddress.substring(0, mailAddress.indexOf("@"));
			if (name != "") {
				nameData = name.split(" ");
			} else if (addr.indexOf(".") != -1) {
				nameData = addr.split(".");
			} else if (addr.indexOf("_") != -1) {
				nameData = addr.split("_");
			} else if (addr.indexOf("-") != -1) {
				nameData = addr.split("-");
			} else {
				nameData = [addr];
			}
			// first character upper case
			for (var i = 0; i < nameData.length; i++) {
				if (nameData[i].length > 0) {
					nameData[i] = nameData[i].substring(0, 1).toUpperCase() + nameData[i].substring(1);
				}
			}

			this._editableContact.firstName(nameData[0]);
			this._editableContact.lastName(nameData.slice(1).join(" "));

			var newma = new tutao.entity.tutanota.ContactMailAddress(this._contactWrapper.getContact());
			newma.setAddress(mailAddress);
			newma.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER);
			newma.setCustomTypeName("");
			this._editableContact.mailAddresses.push(new tutao.entity.tutanota.ContactMailAddressEditable(newma));
		}
	} else {
		this._editableContact = null;
	}
};

/**
 * Must be called before this recipient info is deleted. Stops editing the contact.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.setDeleted = function() {
	if (this.isExternal()) {
		this._contactWrapper.stopEditingContact(this);
	}
};

/**
 * Provides the text to display for this recipient.
 * @return {string} The text.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.getDisplayText = function() {
	return (this._name == "") ? this._mailAddress : this._name;
};

/**
 * Provides the mail address of this recipient..
 * @return {string} The mail address.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.getMailAddress = function() {
	return this._mailAddress;
};

/**
 * Provides the name of this recipient. The name might be an empty string.
 * @return {string} The name.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.getName = function() {
	return this._name;
};

/**
 * Provides the contact of this recipient.
 * @return {tutao.entity.tutanota.ContactWrapper} The wrapped contact.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.getContactWrapper = function() {
	return this._contactWrapper;
};

/**
 * Provides the editable contact of this recipient.
 * @return {tutao.entity.tutanota.ContactEditable} The editable contact.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.getEditableContact = function() {
	return this._editableContact;
};

/**
 * Returns true if the contact in this recipient info is from the users contact list.
 * @return {boolean} True if the contact is already existing.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.isExistingContact = function() {
	return this._existingContact;
};

/**
 * Returns true if this recipient is secure. It is secure if it is internal or at least one valid password channel is available.
 * @return {boolean} If the recipient is secure.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.isSecure = function() {
	if (!this.isExternal()) {
		return true;
	}
	if (this._editableContact.presharedPassword()) {
		return true;
	}
	for (var i = 0; i < this._editableContact.phoneNumbers().length; i++) {
		if (tutao.tutanota.ctrl.RecipientInfo.isValidMobileNumber(this._editableContact.phoneNumbers()[i].number())) {
			return true;
		}
	}
	return false;
};

/**
 * Returns true if this recipient is an external recipient.
 * @return {boolean} If the recipient is external.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.isExternal = function() {
	//TODO check for public key instead of the domain name
	return !tutao.util.StringUtils.endsWith(this._mailAddress, "tutanota.de");
};

/**
 * Checks if the given phone number is a valid mobile number that can be used as password channel.
 * @param {string} number The number to check.
 * @return {Boolean} True if the number is a valid mobile number, false otherwise.
 */
tutao.tutanota.ctrl.RecipientInfo.isValidMobileNumber = function(number) {
	return tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber(tutao.tutanota.util.Formatter.getCleanedPhoneNumber(number));
};
