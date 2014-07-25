"use strict";

goog.provide('tutao.entity.tutanota.ContactAddressEditable');

/**
 * Provides a knockout observable mechanism for a ContactAddress.
 * @param {tutao.entity.tutanota.ContactAddress} contactaddress The actual ContactAddress.
 * @constructor
 */
tutao.entity.tutanota.ContactAddressEditable = function(contactaddress) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = contactaddress;
	this._id = ko.observable(contactaddress.getId());
	this.address = ko.observable(contactaddress.getAddress());
	this.customTypeName = ko.observable(contactaddress.getCustomTypeName());
	this.type = ko.observable(contactaddress.getType());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.tutanota.ContactAddressExtension) {
		tutao.entity.tutanota.ContactAddressExtension(this);
	}
};

/**
 * Provides the actual ContactAddress.
 * @return {tutao.entity.tutanota.ContactAddress} The ContactAddress.
 */
tutao.entity.tutanota.ContactAddressEditable.prototype.getContactAddress = function() {
	return this._entity;
};

/**
 * Updates the underlying ContactAddress with the modified attributes.
 */
tutao.entity.tutanota.ContactAddressEditable.prototype.update = function() {
	this._entity.setId(this._id());
	this._entity.setAddress(this.address());
	this._entity.setCustomTypeName(this.customTypeName());
	this._entity.setType(this.type());
	this.lastUpdatedTimestamp(new Date().getTime());
};
