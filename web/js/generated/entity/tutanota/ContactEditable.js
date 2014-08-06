"use strict";

tutao.provide('tutao.entity.tutanota.ContactEditable');

/**
 * Provides a knockout observable mechanism for a Contact.
 * @param {tutao.entity.tutanota.Contact} contact The actual Contact.
 * @constructor
 */
tutao.entity.tutanota.ContactEditable = function(contact) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = contact;
	this._area = ko.observable(contact.getArea());
	this._owner = ko.observable(contact.getOwner());
	this.autoTransmitPassword = ko.observable(contact.getAutoTransmitPassword());
	this.birthday = ko.observable(contact.getBirthday());
	this.comment = ko.observable(contact.getComment());
	this.company = ko.observable(contact.getCompany());
	this.firstName = ko.observable(contact.getFirstName());
	this.lastName = ko.observable(contact.getLastName());
	this.presharedPassword = ko.observable(contact.getPresharedPassword());
	this.title = ko.observable(contact.getTitle());
	this.addresses = ko.observableArray();
	for (var i = 0; i < contact.getAddresses().length; i++) {
		this.addresses.push(new tutao.entity.tutanota.ContactAddressEditable(contact.getAddresses()[i]));
	}
	this.mailAddresses = ko.observableArray();
	for (var i = 0; i < contact.getMailAddresses().length; i++) {
		this.mailAddresses.push(new tutao.entity.tutanota.ContactMailAddressEditable(contact.getMailAddresses()[i]));
	}
	this.phoneNumbers = ko.observableArray();
	for (var i = 0; i < contact.getPhoneNumbers().length; i++) {
		this.phoneNumbers.push(new tutao.entity.tutanota.ContactPhoneNumberEditable(contact.getPhoneNumbers()[i]));
	}
	this.socialIds = ko.observableArray();
	for (var i = 0; i < contact.getSocialIds().length; i++) {
		this.socialIds.push(new tutao.entity.tutanota.ContactSocialIdEditable(contact.getSocialIds()[i]));
	}

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.tutanota.ContactExtension) {
		tutao.entity.tutanota.ContactExtension(this);
	}
};

/**
 * Provides the actual Contact.
 * @return {tutao.entity.tutanota.Contact} The Contact.
 */
tutao.entity.tutanota.ContactEditable.prototype.getContact = function() {
	return this._entity;
};

/**
 * Updates the underlying Contact with the modified attributes.
 */
tutao.entity.tutanota.ContactEditable.prototype.update = function() {
	this._entity.setArea(this._area());
	this._entity.setOwner(this._owner());
	this._entity.setAutoTransmitPassword(this.autoTransmitPassword());
	this._entity.setBirthday(this.birthday());
	this._entity.setComment(this.comment());
	this._entity.setCompany(this.company());
	this._entity.setFirstName(this.firstName());
	this._entity.setLastName(this.lastName());
	this._entity.setPresharedPassword(this.presharedPassword());
	this._entity.setTitle(this.title());
	this._entity.getAddresses().length = 0;
	for (var i = 0; i < this.addresses().length; i++) {
		this.addresses()[i].update();
		this._entity.getAddresses().push(this.addresses()[i].getContactAddress());
	}
	this._entity.getMailAddresses().length = 0;
	for (var i = 0; i < this.mailAddresses().length; i++) {
		this.mailAddresses()[i].update();
		this._entity.getMailAddresses().push(this.mailAddresses()[i].getContactMailAddress());
	}
	this._entity.getPhoneNumbers().length = 0;
	for (var i = 0; i < this.phoneNumbers().length; i++) {
		this.phoneNumbers()[i].update();
		this._entity.getPhoneNumbers().push(this.phoneNumbers()[i].getContactPhoneNumber());
	}
	this._entity.getSocialIds().length = 0;
	for (var i = 0; i < this.socialIds().length; i++) {
		this.socialIds()[i].update();
		this._entity.getSocialIds().push(this.socialIds()[i].getContactSocialId());
	}
	this.lastUpdatedTimestamp(new Date().getTime());
};
