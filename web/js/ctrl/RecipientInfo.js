"use strict";

tutao.provide('tutao.tutanota.ctrl.RecipientInfo');

/**
 * A recipient bubble represents a recipient from a contact or from a pure email address.
 * @param {string} mailAddress The email address to use as recipient.
 * @param {string} name The name that shall be used for the recipient.
 * @param {tutao.entity.tutanota.ContactWrapper=} contactWrapper The contact to use for recipient info.
 * @param {Boolean=} external Optional. True if the recipient is external, false otherwise. If not set, this information is requested from the server.
 * @constructor
 */
tutao.tutanota.ctrl.RecipientInfo = function(mailAddress, name, contactWrapper, external) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._mailAddress = mailAddress;
	this._name = name;
    this._type = ko.observable(tutao.tutanota.ctrl.RecipientInfo.TYPE_UNKNOWN);
	if (external === false || tutao.tutanota.util.Formatter.isTutanotaMailAddress(mailAddress)) {
		this._type(tutao.tutanota.ctrl.RecipientInfo.TYPE_INTERNAL);
	} else if (external === true) {
        this._type(tutao.tutanota.ctrl.RecipientInfo.TYPE_EXTERNAL);
	}
	if (!contactWrapper) {
		this._contactWrapper = tutao.entity.tutanota.ContactWrapper.createContactWrapper(mailAddress, name);
	} else {
		this._contactWrapper = contactWrapper;
	}

    this._deleted = false;
    this._editableContact = null;

	this._editableContact = this._contactWrapper.startEditingContact(this);
};

/**
 * Not yet known if internal or external (server is currently queried).
 * @type {number}
 */
tutao.tutanota.ctrl.RecipientInfo.TYPE_UNKNOWN = 0;
/**
 * An internal recipient.
 * @type {number}
 */
tutao.tutanota.ctrl.RecipientInfo.TYPE_INTERNAL = 1;
/**
 * An external recipient.
 * @type {number}
 */
tutao.tutanota.ctrl.RecipientInfo.TYPE_EXTERNAL = 2;

/**
 * Must be called before this recipient info is deleted. Stops editing the contact.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.setDeleted = function() {
    this._deleted = true;
    this._contactWrapper.stopEditingContact(this);
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
	return this._contactWrapper.getContact().getId() != null;
};

/**
 * Returns true if this recipient is secure. It is secure if it is internal or at least one valid password channel is available for an external. Unknown recipients are regarded as secure.
 * @return {boolean} If the recipient is secure.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.isSecure = function() {
	if (!this.isExternal()) {
		return true;
	}
	if (this._editableContact.presharedPassword() != null && this._editableContact.presharedPassword().trim() != "") {
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
	return (this._type() == tutao.tutanota.ctrl.RecipientInfo.TYPE_EXTERNAL);
};

/**
 * Returns the recipient type, one of tutao.tutanota.ctrl.RecipientInfo.*.
 * @return {number} The recipient type.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.getRecipientType = function() {
    return this._type();
};

/**
 * Checks if the given phone number is a valid mobile number that can be used as password channel.
 * @param {string} number The number to check.
 * @return {Boolean} True if the number is a valid mobile number, false otherwise.
 */
tutao.tutanota.ctrl.RecipientInfo.isValidMobileNumber = function(number) {
	return tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber(tutao.tutanota.util.Formatter.getCleanedPhoneNumber(number));
};

/**
 * Checks if the phone numbers of the recipient have been changed.
 * @returns {boolean} True if one of the phone numbers have been changed otherwise false
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.hasPhoneNumberChanged = function() {
    var editedPhoneNumbers = this.getEditableContact().phoneNumbers();
    var originPhoneNumbers = this.getContactWrapper().getContact().getPhoneNumbers();

    if ( editedPhoneNumbers.length != originPhoneNumbers.length ){
        return true;
    }else{
        for ( var i=0; i< editedPhoneNumbers.length; i++ ){
            if ( editedPhoneNumbers[i].getContactPhoneNumber().getNumber() != originPhoneNumbers[i].getNumber()){
                return true;
            }
        }
    }
    return false;
};

/**
 * Checks if the pre shared password of this recipient has been changed,
 * @returns {boolean} True if the password has been changed.
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.hasPasswordChanged = function() {
    var editedPassword = this.getEditableContact().presharedPassword();
    var originPassword = this.getContactWrapper().getContact().getPresharedPassword();
    return editedPassword != originPassword;
};

/**
 * @return {Promise} Resolves when the recipient type has been resolved
 */
tutao.tutanota.ctrl.RecipientInfo.prototype.resolveType = function () {
    var self = this;
    if (this._type() == tutao.tutanota.ctrl.RecipientInfo.TYPE_UNKNOWN) {
        return tutao.entity.sys.PublicKeyReturn.load(new tutao.entity.sys.PublicKeyData().setMailAddress(self.getMailAddress()), {}, null).then(function(publicKeyData) {
            // do not update any field if this recipient is already deleted, because this._type is subscribed above and might trigger editing a contact otherwise
            if (!self._deleted) {
                self._type(tutao.tutanota.ctrl.RecipientInfo.TYPE_INTERNAL);
            }
        }).caught(tutao.NotFoundError, function(e) {
            if (!self._deleted) {
                self._type(tutao.tutanota.ctrl.RecipientInfo.TYPE_EXTERNAL);
            }
        });
    } else {
        return Promise.resolve();
    }
};


tutao.tutanota.ctrl.RecipientInfo.prototype.isTutanotaMailAddress = function(mailAddress) {
    var tutanotaDomains = tutao.entity.tutanota.TutanotaConstants.TUTANOTA_MAIL_ADDRESS_DOMAINS;
    for ( var i=0; i< tutanotaDomains.length; i++){
        if ( tutao.util.StringUtils.endsWith(mailAddress, "@" + tutanotaDomains[i])){
            return true;
        }
    }
    return false;
};

