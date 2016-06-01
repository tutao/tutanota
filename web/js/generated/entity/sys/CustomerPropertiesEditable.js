"use strict";

tutao.provide('tutao.entity.sys.CustomerPropertiesEditable');

/**
 * Provides a knockout observable mechanism for a CustomerProperties.
 * @param {tutao.entity.sys.CustomerProperties} customerproperties The actual CustomerProperties.
 * @constructor
 */
tutao.entity.sys.CustomerPropertiesEditable = function(customerproperties) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = customerproperties;
	this._ownerGroup = ko.observable(customerproperties.getOwnerGroup());
	this.externalUserWelcomeMessage = ko.observable(customerproperties.getExternalUserWelcomeMessage());
	this.lastUpgradeReminder = ko.observable(customerproperties.getLastUpgradeReminder());
	if (customerproperties.getBigLogo()) {
		this.bigLogo = ko.observable(new tutao.entity.sys.FileEditable(customerproperties.getBigLogo()));
	} else {
	    this.bigLogo = ko.observable(null);
	}
	if (customerproperties.getSmallLogo()) {
		this.smallLogo = ko.observable(new tutao.entity.sys.FileEditable(customerproperties.getSmallLogo()));
	} else {
	    this.smallLogo = ko.observable(null);
	}

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.CustomerPropertiesExtension) {
		tutao.entity.sys.CustomerPropertiesExtension(this);
	}
};

/**
 * Provides the actual CustomerProperties.
 * @return {tutao.entity.sys.CustomerProperties} The CustomerProperties.
 */
tutao.entity.sys.CustomerPropertiesEditable.prototype.getCustomerProperties = function() {
	return this._entity;
};

/**
 * Updates the underlying CustomerProperties with the modified attributes.
 */
tutao.entity.sys.CustomerPropertiesEditable.prototype.update = function() {
	this._entity.setOwnerGroup(this._ownerGroup());
	this._entity.setExternalUserWelcomeMessage(this.externalUserWelcomeMessage());
	this._entity.setLastUpgradeReminder(this.lastUpgradeReminder());
		if (this.bigLogo()) {
			this.bigLogo().update();
			this._entity.setBigLogo(this.bigLogo().getFile());
		} else {
			this._entity.setBigLogo(null);
		}
		if (this.smallLogo()) {
			this.smallLogo().update();
			this._entity.setSmallLogo(this.smallLogo().getFile());
		} else {
			this._entity.setSmallLogo(null);
		}
	this.lastUpdatedTimestamp(new Date().getTime());
};
