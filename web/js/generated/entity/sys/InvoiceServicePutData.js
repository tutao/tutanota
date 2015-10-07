"use strict";

tutao.provide('tutao.entity.sys.InvoiceServicePutData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceServicePutData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._changeDate = null;
    this._comment = null;
    this._status = null;
    this._invoice = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.InvoiceServicePutData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._changeDate = data.changeDate;
  this._comment = data.comment;
  this._status = data.status;
  this._invoice = data.invoice;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.InvoiceServicePutData.MODEL_VERSION = '11';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.InvoiceServicePutData.PATH = '/rest/sys/invoiceservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.InvoiceServicePutData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    changeDate: this._changeDate, 
    comment: this._comment, 
    status: this._status, 
    invoice: this._invoice
  };
};

/**
 * The id of the InvoiceServicePutData type.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.TYPE_ID = 911;

/**
 * The id of the changeDate attribute.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.CHANGEDATE_ATTRIBUTE_ID = 914;

/**
 * The id of the comment attribute.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.COMMENT_ATTRIBUTE_ID = 915;

/**
 * The id of the status attribute.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.STATUS_ATTRIBUTE_ID = 913;

/**
 * The id of the invoice attribute.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.INVOICE_ATTRIBUTE_ID = 916;

/**
 * Sets the format of this InvoiceServicePutData.
 * @param {string} format The format of this InvoiceServicePutData.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this InvoiceServicePutData.
 * @return {string} The format of this InvoiceServicePutData.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the changeDate of this InvoiceServicePutData.
 * @param {Date} changeDate The changeDate of this InvoiceServicePutData.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.setChangeDate = function(changeDate) {
  this._changeDate = String(changeDate.getTime());
  return this;
};

/**
 * Provides the changeDate of this InvoiceServicePutData.
 * @return {Date} The changeDate of this InvoiceServicePutData.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.getChangeDate = function() {
  if (isNaN(this._changeDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._changeDate);
  }
  return new Date(Number(this._changeDate));
};

/**
 * Sets the comment of this InvoiceServicePutData.
 * @param {string} comment The comment of this InvoiceServicePutData.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.setComment = function(comment) {
  this._comment = comment;
  return this;
};

/**
 * Provides the comment of this InvoiceServicePutData.
 * @return {string} The comment of this InvoiceServicePutData.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.getComment = function() {
  return this._comment;
};

/**
 * Sets the status of this InvoiceServicePutData.
 * @param {string} status The status of this InvoiceServicePutData.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.setStatus = function(status) {
  this._status = status;
  return this;
};

/**
 * Provides the status of this InvoiceServicePutData.
 * @return {string} The status of this InvoiceServicePutData.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.getStatus = function() {
  return this._status;
};

/**
 * Sets the invoice of this InvoiceServicePutData.
 * @param {Array.<string>} invoice The invoice of this InvoiceServicePutData.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.setInvoice = function(invoice) {
  this._invoice = invoice;
  return this;
};

/**
 * Provides the invoice of this InvoiceServicePutData.
 * @return {Array.<string>} The invoice of this InvoiceServicePutData.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.getInvoice = function() {
  return this._invoice;
};

/**
 * Loads the invoice of this InvoiceServicePutData.
 * @return {Promise.<tutao.entity.sys.Invoice>} Resolves to the loaded invoice of this InvoiceServicePutData or an exception if the loading failed.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.loadInvoice = function() {
  return tutao.entity.sys.Invoice.load(this._invoice);
};

/**
 * Updates this service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.update = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 11;
  return tutao.locator.entityRestClient.putService(tutao.entity.sys.InvoiceServicePutData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.InvoiceServicePutData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
