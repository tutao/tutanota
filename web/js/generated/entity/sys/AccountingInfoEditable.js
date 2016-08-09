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
	this.business = ko.observable(accountinginfo.getBusiness());
	this.invoiceAddress = ko.observable(accountinginfo.getInvoiceAddress());
	this.invoiceCountry = ko.observable(accountinginfo.getInvoiceCountry());
	this.invoiceName = ko.observable(accountinginfo.getInvoiceName());
	this.invoiceVatIdNo = ko.observable(accountinginfo.getInvoiceVatIdNo());
	this.lastInvoiceNbrOfSentSms = ko.observable(accountinginfo.getLastInvoiceNbrOfSentSms());
	this.lastInvoiceTimestamp = ko.observable(accountinginfo.getLastInvoiceTimestamp());
	this.paymentAccountIdentifier = ko.observable(accountinginfo.getPaymentAccountIdentifier());
	this.paymentInterval = ko.observable(accountinginfo.getPaymentInterval());
	this.paymentMethod = ko.observable(accountinginfo.getPaymentMethod());
	this.paymentMethodInfo = ko.observable(accountinginfo.getPaymentMethodInfo());
	this.paymentProviderCustomerId = ko.observable(accountinginfo.getPaymentProviderCustomerId());
	this.secondCountryInfo = ko.observable(accountinginfo.getSecondCountryInfo());

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
	this._entity.setBusiness(this.business());
	this._entity.setInvoiceAddress(this.invoiceAddress());
	this._entity.setInvoiceCountry(this.invoiceCountry());
	this._entity.setInvoiceName(this.invoiceName());
	this._entity.setInvoiceVatIdNo(this.invoiceVatIdNo());
	this._entity.setLastInvoiceNbrOfSentSms(this.lastInvoiceNbrOfSentSms());
	this._entity.setLastInvoiceTimestamp(this.lastInvoiceTimestamp());
	this._entity.setPaymentAccountIdentifier(this.paymentAccountIdentifier());
	this._entity.setPaymentInterval(this.paymentInterval());
	this._entity.setPaymentMethod(this.paymentMethod());
	this._entity.setPaymentMethodInfo(this.paymentMethodInfo());
	this._entity.setPaymentProviderCustomerId(this.paymentProviderCustomerId());
	this._entity.setSecondCountryInfo(this.secondCountryInfo());
	this.lastUpdatedTimestamp(new Date().getTime());
};
