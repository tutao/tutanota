"use strict";

tutao.provide('tutao.entity.tutanota.ContactMailAddressEditable');

/**
 * Provides a knockout observable mechanism for a ContactMailAddress.
 * @param {tutao.entity.tutanota.ContactMailAddress} contactmailaddress The actual ContactMailAddress.
 * @constructor
 */
tutao.entity.tutanota.ContactMailAddressEditable = function(contactmailaddress) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = contactmailaddress;
	this._id = ko.observable(contactmailaddress.getId());
	this.address = ko.observable(contactmailaddress.getAddress());
	this.customTypeName = ko.observable(contactmailaddress.getCustomTypeName());
	this.type = ko.observable(contactmailaddress.getType());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.tutanota.ContactMailAddressExtension) {
		tutao.entity.tutanota.ContactMailAddressExtension(this);
	}
};

/**
 * Provides the actual ContactMailAddress.
 * @return {tutao.entity.tutanota.ContactMailAddress} The ContactMailAddress.
 */
tutao.entity.tutanota.ContactMailAddressEditable.prototype.getContactMailAddress = function() {
	return this._entity;
};

/**
 * Updates the underlying ContactMailAddress with the modified attributes.
 */
tutao.entity.tutanota.ContactMailAddressEditable.prototype.update = function() {
	this._entity.setId(this._id());
	this._entity.setAddress(this.address());
	this._entity.setCustomTypeName(this.customTypeName());
	this._entity.setType(this.type());
	this.lastUpdatedTimestamp(new Date().getTime());
};
