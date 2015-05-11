"use strict";

tutao.provide('tutao.entity.sys.InvoiceInfoEditable');

/**
 * Provides a knockout observable mechanism for a InvoiceInfo.
 * @param {tutao.entity.sys.InvoiceInfo} invoiceinfo The actual InvoiceInfo.
 * @constructor
 */
tutao.entity.sys.InvoiceInfoEditable = function(invoiceinfo) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = invoiceinfo;
	this.publishInvoices = ko.observable(invoiceinfo.getPublishInvoices());
	this.specialPrice = ko.observable(invoiceinfo.getSpecialPrice());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.InvoiceInfoExtension) {
		tutao.entity.sys.InvoiceInfoExtension(this);
	}
};

/**
 * Provides the actual InvoiceInfo.
 * @return {tutao.entity.sys.InvoiceInfo} The InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfoEditable.prototype.getInvoiceInfo = function() {
	return this._entity;
};

/**
 * Updates the underlying InvoiceInfo with the modified attributes.
 */
tutao.entity.sys.InvoiceInfoEditable.prototype.update = function() {
	this._entity.setPublishInvoices(this.publishInvoices());
	this._entity.setSpecialPrice(this.specialPrice());
	this.lastUpdatedTimestamp(new Date().getTime());
};
