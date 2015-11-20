"use strict";

tutao.provide('tutao.entity.sys.EmailSenderListElementEditable');

/**
 * Provides a knockout observable mechanism for a EmailSenderListElement.
 * @param {tutao.entity.sys.EmailSenderListElement} emailsenderlistelement The actual EmailSenderListElement.
 * @constructor
 */
tutao.entity.sys.EmailSenderListElementEditable = function(emailsenderlistelement) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = emailsenderlistelement;
	this._id = ko.observable(emailsenderlistelement.getId());
	this.hashedValue = ko.observable(emailsenderlistelement.getHashedValue());
	this.type = ko.observable(emailsenderlistelement.getType());
	this.value = ko.observable(emailsenderlistelement.getValue());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.EmailSenderListElementExtension) {
		tutao.entity.sys.EmailSenderListElementExtension(this);
	}
};

/**
 * Provides the actual EmailSenderListElement.
 * @return {tutao.entity.sys.EmailSenderListElement} The EmailSenderListElement.
 */
tutao.entity.sys.EmailSenderListElementEditable.prototype.getEmailSenderListElement = function() {
	return this._entity;
};

/**
 * Updates the underlying EmailSenderListElement with the modified attributes.
 */
tutao.entity.sys.EmailSenderListElementEditable.prototype.update = function() {
	this._entity.setId(this._id());
	this._entity.setHashedValue(this.hashedValue());
	this._entity.setType(this.type());
	this._entity.setValue(this.value());
	this.lastUpdatedTimestamp(new Date().getTime());
};
