"use strict";

tutao.provide('tutao.entity.tutanota.ContactPhoneNumberEditable');

/**
 * Provides a knockout observable mechanism for a ContactPhoneNumber.
 * @param {tutao.entity.tutanota.ContactPhoneNumber} contactphonenumber The actual ContactPhoneNumber.
 * @constructor
 */
tutao.entity.tutanota.ContactPhoneNumberEditable = function(contactphonenumber) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = contactphonenumber;
	this._id = ko.observable(contactphonenumber.getId());
	this.customTypeName = ko.observable(contactphonenumber.getCustomTypeName());
	this.number = ko.observable(contactphonenumber.getNumber());
	this.type = ko.observable(contactphonenumber.getType());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.tutanota.ContactPhoneNumberExtension) {
		tutao.entity.tutanota.ContactPhoneNumberExtension(this);
	}
};

/**
 * Provides the actual ContactPhoneNumber.
 * @return {tutao.entity.tutanota.ContactPhoneNumber} The ContactPhoneNumber.
 */
tutao.entity.tutanota.ContactPhoneNumberEditable.prototype.getContactPhoneNumber = function() {
	return this._entity;
};

/**
 * Updates the underlying ContactPhoneNumber with the modified attributes.
 */
tutao.entity.tutanota.ContactPhoneNumberEditable.prototype.update = function() {
	this._entity.setId(this._id());
	this._entity.setCustomTypeName(this.customTypeName());
	this._entity.setNumber(this.number());
	this._entity.setType(this.type());
	this.lastUpdatedTimestamp(new Date().getTime());
};
