"use strict";

tutao.provide('tutao.entity.sys.CustomerServerPropertiesEditable');

/**
 * Provides a knockout observable mechanism for a CustomerServerProperties.
 * @param {tutao.entity.sys.CustomerServerProperties} customerserverproperties The actual CustomerServerProperties.
 * @constructor
 */
tutao.entity.sys.CustomerServerPropertiesEditable = function(customerserverproperties) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = customerserverproperties;
	this._ownerEncSessionKey = ko.observable(customerserverproperties.getOwnerEncSessionKey());
	this._ownerGroup = ko.observable(customerserverproperties.getOwnerGroup());
	this.emailSenderList = ko.observableArray();
	for (var i = 0; i < customerserverproperties.getEmailSenderList().length; i++) {
		this.emailSenderList.push(new tutao.entity.sys.EmailSenderListElementEditable(customerserverproperties.getEmailSenderList()[i]));
	}

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.CustomerServerPropertiesExtension) {
		tutao.entity.sys.CustomerServerPropertiesExtension(this);
	}
};

/**
 * Provides the actual CustomerServerProperties.
 * @return {tutao.entity.sys.CustomerServerProperties} The CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerPropertiesEditable.prototype.getCustomerServerProperties = function() {
	return this._entity;
};

/**
 * Updates the underlying CustomerServerProperties with the modified attributes.
 */
tutao.entity.sys.CustomerServerPropertiesEditable.prototype.update = function() {
	this._entity.setOwnerEncSessionKey(this._ownerEncSessionKey());
	this._entity.setOwnerGroup(this._ownerGroup());
	this._entity.getEmailSenderList().length = 0;
	for (var i = 0; i < this.emailSenderList().length; i++) {
		this.emailSenderList()[i].update();
		this._entity.getEmailSenderList().push(this.emailSenderList()[i].getEmailSenderListElement());
	}
	this.lastUpdatedTimestamp(new Date().getTime());
};
