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
	this.specialPriceUserSingle = ko.observable(invoiceinfo.getSpecialPriceUserSingle());
	this.specialPriceUserTotal = ko.observable(invoiceinfo.getSpecialPriceUserTotal());

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
	this._entity.setSpecialPriceUserSingle(this.specialPriceUserSingle());
	this._entity.setSpecialPriceUserTotal(this.specialPriceUserTotal());
	this.lastUpdatedTimestamp(new Date().getTime());
};
