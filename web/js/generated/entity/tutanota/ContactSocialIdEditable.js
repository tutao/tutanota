"use strict";

tutao.provide('tutao.entity.tutanota.ContactSocialIdEditable');

/**
 * Provides a knockout observable mechanism for a ContactSocialId.
 * @param {tutao.entity.tutanota.ContactSocialId} contactsocialid The actual ContactSocialId.
 * @constructor
 */
tutao.entity.tutanota.ContactSocialIdEditable = function(contactsocialid) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = contactsocialid;
	this._id = ko.observable(contactsocialid.getId());
	this.customTypeName = ko.observable(contactsocialid.getCustomTypeName());
	this.socialId = ko.observable(contactsocialid.getSocialId());
	this.type = ko.observable(contactsocialid.getType());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.tutanota.ContactSocialIdExtension) {
		tutao.entity.tutanota.ContactSocialIdExtension(this);
	}
};

/**
 * Provides the actual ContactSocialId.
 * @return {tutao.entity.tutanota.ContactSocialId} The ContactSocialId.
 */
tutao.entity.tutanota.ContactSocialIdEditable.prototype.getContactSocialId = function() {
	return this._entity;
};

/**
 * Updates the underlying ContactSocialId with the modified attributes.
 */
tutao.entity.tutanota.ContactSocialIdEditable.prototype.update = function() {
	this._entity.setId(this._id());
	this._entity.setCustomTypeName(this.customTypeName());
	this._entity.setSocialId(this.socialId());
	this._entity.setType(this.type());
	this.lastUpdatedTimestamp(new Date().getTime());
};
