"use strict";

tutao.provide('tutao.entity.sys.InvoiceEditable');

/**
 * Provides a knockout observable mechanism for a Invoice.
 * @param {tutao.entity.sys.Invoice} invoice The actual Invoice.
 * @constructor
 */
tutao.entity.sys.InvoiceEditable = function(invoice) {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._entity = invoice;
	this._ownerEncSessionKey = ko.observable(invoice.getOwnerEncSessionKey());
	this._ownerGroup = ko.observable(invoice.getOwnerGroup());
	this.country = ko.observable(invoice.getCountry());
	this.date = ko.observable(invoice.getDate());
	this.grandTotal = ko.observable(invoice.getGrandTotal());
	this.number = ko.observable(invoice.getNumber());
	this.paymentMethod = ko.observable(invoice.getPaymentMethod());
	this.source = ko.observable(invoice.getSource());
	this.status = ko.observable(invoice.getStatus());
	this.vat = ko.observable(invoice.getVat());
	this.vatRate = ko.observable(invoice.getVatRate());

	this.lastUpdatedTimestamp = ko.observable(null);

	if (tutao.entity.sys.InvoiceExtension) {
		tutao.entity.sys.InvoiceExtension(this);
	}
};

/**
 * Provides the actual Invoice.
 * @return {tutao.entity.sys.Invoice} The Invoice.
 */
tutao.entity.sys.InvoiceEditable.prototype.getInvoice = function() {
	return this._entity;
};

/**
 * Updates the underlying Invoice with the modified attributes.
 */
tutao.entity.sys.InvoiceEditable.prototype.update = function() {
	this._entity.setOwnerEncSessionKey(this._ownerEncSessionKey());
	this._entity.setOwnerGroup(this._ownerGroup());
	this._entity.setCountry(this.country());
	this._entity.setDate(this.date());
	this._entity.setGrandTotal(this.grandTotal());
	this._entity.setNumber(this.number());
	this._entity.setPaymentMethod(this.paymentMethod());
	this._entity.setSource(this.source());
	this._entity.setStatus(this.status());
	this._entity.setVat(this.vat());
	this._entity.setVatRate(this.vatRate());
	this.lastUpdatedTimestamp(new Date().getTime());
};
