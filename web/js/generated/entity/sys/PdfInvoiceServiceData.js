"use strict";

tutao.provide('tutao.entity.sys.PdfInvoiceServiceData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PdfInvoiceServiceData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._invoice = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PdfInvoiceServiceData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PdfInvoiceServiceData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._invoice = data.invoice;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PdfInvoiceServiceData.MODEL_VERSION = '18';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PdfInvoiceServiceData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PdfInvoiceServiceData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    invoice: this._invoice
  };
};

/**
 * Sets the format of this PdfInvoiceServiceData.
 * @param {string} format The format of this PdfInvoiceServiceData.
 */
tutao.entity.sys.PdfInvoiceServiceData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PdfInvoiceServiceData.
 * @return {string} The format of this PdfInvoiceServiceData.
 */
tutao.entity.sys.PdfInvoiceServiceData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the invoice of this PdfInvoiceServiceData.
 * @param {Array.<string>} invoice The invoice of this PdfInvoiceServiceData.
 */
tutao.entity.sys.PdfInvoiceServiceData.prototype.setInvoice = function(invoice) {
  this._invoice = invoice;
  return this;
};

/**
 * Provides the invoice of this PdfInvoiceServiceData.
 * @return {Array.<string>} The invoice of this PdfInvoiceServiceData.
 */
tutao.entity.sys.PdfInvoiceServiceData.prototype.getInvoice = function() {
  return this._invoice;
};

/**
 * Loads the invoice of this PdfInvoiceServiceData.
 * @return {Promise.<tutao.entity.sys.Invoice>} Resolves to the loaded invoice of this PdfInvoiceServiceData or an exception if the loading failed.
 */
tutao.entity.sys.PdfInvoiceServiceData.prototype.loadInvoice = function() {
  return tutao.entity.sys.Invoice.load(this._invoice);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PdfInvoiceServiceData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
