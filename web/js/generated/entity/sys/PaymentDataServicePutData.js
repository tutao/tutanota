"use strict";

tutao.provide('tutao.entity.sys.PaymentDataServicePutData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PaymentDataServicePutData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._business = null;
    this._confirmedCountry = null;
    this._invoiceAddress = null;
    this._invoiceCountry = null;
    this._invoiceName = null;
    this._invoiceVatIdNo = null;
    this._paymentInterval = null;
    this._paymentMethod = null;
    this._paymentToken = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PaymentDataServicePutData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._business = data.business;
  this._confirmedCountry = data.confirmedCountry;
  this._invoiceAddress = data.invoiceAddress;
  this._invoiceCountry = data.invoiceCountry;
  this._invoiceName = data.invoiceName;
  this._invoiceVatIdNo = data.invoiceVatIdNo;
  this._paymentInterval = data.paymentInterval;
  this._paymentMethod = data.paymentMethod;
  this._paymentToken = data.paymentToken;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PaymentDataServicePutData.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.PaymentDataServicePutData.PATH = '/rest/sys/paymentdataservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    business: this._business, 
    confirmedCountry: this._confirmedCountry, 
    invoiceAddress: this._invoiceAddress, 
    invoiceCountry: this._invoiceCountry, 
    invoiceName: this._invoiceName, 
    invoiceVatIdNo: this._invoiceVatIdNo, 
    paymentInterval: this._paymentInterval, 
    paymentMethod: this._paymentMethod, 
    paymentToken: this._paymentToken
  };
};

/**
 * The id of the PaymentDataServicePutData type.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.TYPE_ID = 789;

/**
 * The id of the business attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.BUSINESS_ATTRIBUTE_ID = 791;

/**
 * The id of the confirmedCountry attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.CONFIRMEDCOUNTRY_ATTRIBUTE_ID = 799;

/**
 * The id of the invoiceAddress attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.INVOICEADDRESS_ATTRIBUTE_ID = 793;

/**
 * The id of the invoiceCountry attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.INVOICECOUNTRY_ATTRIBUTE_ID = 794;

/**
 * The id of the invoiceName attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.INVOICENAME_ATTRIBUTE_ID = 792;

/**
 * The id of the invoiceVatIdNo attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.INVOICEVATIDNO_ATTRIBUTE_ID = 795;

/**
 * The id of the paymentInterval attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.PAYMENTINTERVAL_ATTRIBUTE_ID = 797;

/**
 * The id of the paymentMethod attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.PAYMENTMETHOD_ATTRIBUTE_ID = 796;

/**
 * The id of the paymentToken attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.PAYMENTTOKEN_ATTRIBUTE_ID = 798;

/**
 * Sets the format of this PaymentDataServicePutData.
 * @param {string} format The format of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PaymentDataServicePutData.
 * @return {string} The format of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the business of this PaymentDataServicePutData.
 * @param {boolean} business The business of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setBusiness = function(business) {
  this._business = business ? '1' : '0';
  return this;
};

/**
 * Provides the business of this PaymentDataServicePutData.
 * @return {boolean} The business of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getBusiness = function() {
  return this._business == '1';
};

/**
 * Sets the confirmedCountry of this PaymentDataServicePutData.
 * @param {string} confirmedCountry The confirmedCountry of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setConfirmedCountry = function(confirmedCountry) {
  this._confirmedCountry = confirmedCountry;
  return this;
};

/**
 * Provides the confirmedCountry of this PaymentDataServicePutData.
 * @return {string} The confirmedCountry of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getConfirmedCountry = function() {
  return this._confirmedCountry;
};

/**
 * Sets the invoiceAddress of this PaymentDataServicePutData.
 * @param {string} invoiceAddress The invoiceAddress of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setInvoiceAddress = function(invoiceAddress) {
  this._invoiceAddress = invoiceAddress;
  return this;
};

/**
 * Provides the invoiceAddress of this PaymentDataServicePutData.
 * @return {string} The invoiceAddress of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getInvoiceAddress = function() {
  return this._invoiceAddress;
};

/**
 * Sets the invoiceCountry of this PaymentDataServicePutData.
 * @param {string} invoiceCountry The invoiceCountry of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setInvoiceCountry = function(invoiceCountry) {
  this._invoiceCountry = invoiceCountry;
  return this;
};

/**
 * Provides the invoiceCountry of this PaymentDataServicePutData.
 * @return {string} The invoiceCountry of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getInvoiceCountry = function() {
  return this._invoiceCountry;
};

/**
 * Sets the invoiceName of this PaymentDataServicePutData.
 * @param {string} invoiceName The invoiceName of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setInvoiceName = function(invoiceName) {
  this._invoiceName = invoiceName;
  return this;
};

/**
 * Provides the invoiceName of this PaymentDataServicePutData.
 * @return {string} The invoiceName of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getInvoiceName = function() {
  return this._invoiceName;
};

/**
 * Sets the invoiceVatIdNo of this PaymentDataServicePutData.
 * @param {string} invoiceVatIdNo The invoiceVatIdNo of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setInvoiceVatIdNo = function(invoiceVatIdNo) {
  this._invoiceVatIdNo = invoiceVatIdNo;
  return this;
};

/**
 * Provides the invoiceVatIdNo of this PaymentDataServicePutData.
 * @return {string} The invoiceVatIdNo of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getInvoiceVatIdNo = function() {
  return this._invoiceVatIdNo;
};

/**
 * Sets the paymentInterval of this PaymentDataServicePutData.
 * @param {string} paymentInterval The paymentInterval of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setPaymentInterval = function(paymentInterval) {
  this._paymentInterval = paymentInterval;
  return this;
};

/**
 * Provides the paymentInterval of this PaymentDataServicePutData.
 * @return {string} The paymentInterval of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getPaymentInterval = function() {
  return this._paymentInterval;
};

/**
 * Sets the paymentMethod of this PaymentDataServicePutData.
 * @param {string} paymentMethod The paymentMethod of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setPaymentMethod = function(paymentMethod) {
  this._paymentMethod = paymentMethod;
  return this;
};

/**
 * Provides the paymentMethod of this PaymentDataServicePutData.
 * @return {string} The paymentMethod of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getPaymentMethod = function() {
  return this._paymentMethod;
};

/**
 * Sets the paymentToken of this PaymentDataServicePutData.
 * @param {string} paymentToken The paymentToken of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setPaymentToken = function(paymentToken) {
  this._paymentToken = paymentToken;
  return this;
};

/**
 * Provides the paymentToken of this PaymentDataServicePutData.
 * @return {string} The paymentToken of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getPaymentToken = function() {
  return this._paymentToken;
};

/**
 * Updates this service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.PaymentDataServicePutReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.update = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  return tutao.locator.entityRestClient.putService(tutao.entity.sys.PaymentDataServicePutData.PATH, this, parameters, headers, tutao.entity.sys.PaymentDataServicePutReturn);
};
