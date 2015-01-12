"use strict";

tutao.provide('tutao.entity.sys.CustomerInfoEditable');

/**
 * Provides a knockout observable mechanism for a CustomerInfo.
 * @param {tutao.entity.sys.CustomerInfo} customerinfo The actual CustomerInfo.
 * @constructor
 */
tutao.entity.sys.CustomerInfoEditable = function(customerinfo) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = customerinfo;
	this.activationTime = ko.observable(customerinfo.getActivationTime());
	this.company = ko.observable(customerinfo.getCompany());
	this.creationTime = ko.observable(customerinfo.getCreationTime());
	this.deletionReason = ko.observable(customerinfo.getDeletionReason());
	this.deletionTime = ko.observable(customerinfo.getDeletionTime());
	this.domain = ko.observable(customerinfo.getDomain());
	this.registrationMailAddress = ko.observable(customerinfo.getRegistrationMailAddress());
	this.storageCapacity = ko.observable(customerinfo.getStorageCapacity());
	this.testEndTime = ko.observable(customerinfo.getTestEndTime());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.CustomerInfoExtension) {
		tutao.entity.sys.CustomerInfoExtension(this);
	}
};

/**
 * Provides the actual CustomerInfo.
 * @return {tutao.entity.sys.CustomerInfo} The CustomerInfo.
 */
tutao.entity.sys.CustomerInfoEditable.prototype.getCustomerInfo = function() {
	return this._entity;
};

/**
 * Updates the underlying CustomerInfo with the modified attributes.
 */
tutao.entity.sys.CustomerInfoEditable.prototype.update = function() {
	this._entity.setActivationTime(this.activationTime());
	this._entity.setCompany(this.company());
	this._entity.setCreationTime(this.creationTime());
	this._entity.setDeletionReason(this.deletionReason());
	this._entity.setDeletionTime(this.deletionTime());
	this._entity.setDomain(this.domain());
	this._entity.setRegistrationMailAddress(this.registrationMailAddress());
	this._entity.setStorageCapacity(this.storageCapacity());
	this._entity.setTestEndTime(this.testEndTime());
	this.lastUpdatedTimestamp(new Date().getTime());
};
