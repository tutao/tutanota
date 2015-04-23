"use strict";

tutao.provide('tutao.entity.sys.AccountingInfoEditable');

/**
 * Provides a knockout observable mechanism for a AccountingInfo.
 * @param {tutao.entity.sys.AccountingInfo} accountinginfo The actual AccountingInfo.
 * @constructor
 */
tutao.entity.sys.AccountingInfoEditable = function(accountinginfo) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = accountinginfo;
	this.invoiceAddress = ko.observable(accountinginfo.getInvoiceAddress());
	this.invoiceCountry = ko.observable(accountinginfo.getInvoiceCountry());
	this.invoiceName = ko.observable(accountinginfo.getInvoiceName());
	this.invoiceVatIdNo = ko.observable(accountinginfo.getInvoiceVatIdNo());
	this.lastInvoiceNbrOfSentSms = ko.observable(accountinginfo.getLastInvoiceNbrOfSentSms());
	this.lastInvoiceTimestamp = ko.observable(accountinginfo.getLastInvoiceTimestamp());
	this.paymentMethod = ko.observable(accountinginfo.getPaymentMethod());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.AccountingInfoExtension) {
		tutao.entity.sys.AccountingInfoExtension(this);
	}
};

/**
 * Provides the actual AccountingInfo.
 * @return {tutao.entity.sys.AccountingInfo} The AccountingInfo.
 */
tutao.entity.sys.AccountingInfoEditable.prototype.getAccountingInfo = function() {
	return this._entity;
};

/**
 * Updates the underlying AccountingInfo with the modified attributes.
 */
tutao.entity.sys.AccountingInfoEditable.prototype.update = function() {
	this._entity.setInvoiceAddress(this.invoiceAddress());
	this._entity.setInvoiceCountry(this.invoiceCountry());
	this._entity.setInvoiceName(this.invoiceName());
	this._entity.setInvoiceVatIdNo(this.invoiceVatIdNo());
	this._entity.setLastInvoiceNbrOfSentSms(this.lastInvoiceNbrOfSentSms());
	this._entity.setLastInvoiceTimestamp(this.lastInvoiceTimestamp());
	this._entity.setPaymentMethod(this.paymentMethod());
	this.lastUpdatedTimestamp(new Date().getTime());
};
