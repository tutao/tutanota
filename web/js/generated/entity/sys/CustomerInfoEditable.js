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
	this.business = ko.observable(customerinfo.getBusiness());
	this.company = ko.observable(customerinfo.getCompany());
	this.creationTime = ko.observable(customerinfo.getCreationTime());
	this.deletionReason = ko.observable(customerinfo.getDeletionReason());
	this.deletionTime = ko.observable(customerinfo.getDeletionTime());
	this.domain = ko.observable(customerinfo.getDomain());
	this.registrationMailAddress = ko.observable(customerinfo.getRegistrationMailAddress());
	this.source = ko.observable(customerinfo.getSource());
	this.storageCapacity = ko.observable(customerinfo.getStorageCapacity());
	this.testEndTime = ko.observable(customerinfo.getTestEndTime());
	if (customerinfo.getBookingItems()) {
		this.bookingItems = ko.observable(new tutao.entity.sys.BookingItemsRefEditable(customerinfo.getBookingItems()));
	} else {
	    this.bookingItems = ko.observable(null);
	}
	this.domainInfos = ko.observableArray();
	for (var i = 0; i < customerinfo.getDomainInfos().length; i++) {
		this.domainInfos.push(new tutao.entity.sys.DomainInfoEditable(customerinfo.getDomainInfos()[i]));
	}

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
	this._entity.setBusiness(this.business());
	this._entity.setCompany(this.company());
	this._entity.setCreationTime(this.creationTime());
	this._entity.setDeletionReason(this.deletionReason());
	this._entity.setDeletionTime(this.deletionTime());
	this._entity.setDomain(this.domain());
	this._entity.setRegistrationMailAddress(this.registrationMailAddress());
	this._entity.setSource(this.source());
	this._entity.setStorageCapacity(this.storageCapacity());
	this._entity.setTestEndTime(this.testEndTime());
		if (this.bookingItems()) {
			this.bookingItems().update();
			this._entity.setBookingItems(this.bookingItems().getBookingItemsRef());
		}
	this._entity.getDomainInfos().length = 0;
	for (var i = 0; i < this.domainInfos().length; i++) {
		this.domainInfos()[i].update();
		this._entity.getDomainInfos().push(this.domainInfos()[i].getDomainInfo());
	}
	this.lastUpdatedTimestamp(new Date().getTime());
};
