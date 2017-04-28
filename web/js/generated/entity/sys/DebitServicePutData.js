"use strict";

tutao.provide('tutao.entity.sys.DebitServicePutData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DebitServicePutData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._invoice = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.DebitServicePutData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DebitServicePutData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._invoice = data.invoice;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.DebitServicePutData.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.DebitServicePutData.PATH = '/rest/sys/debitservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.DebitServicePutData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.DebitServicePutData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    invoice: this._invoice
  };
};

/**
 * Sets the format of this DebitServicePutData.
 * @param {string} format The format of this DebitServicePutData.
 */
tutao.entity.sys.DebitServicePutData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DebitServicePutData.
 * @return {string} The format of this DebitServicePutData.
 */
tutao.entity.sys.DebitServicePutData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the invoice of this DebitServicePutData.
 * @param {Array.<string>} invoice The invoice of this DebitServicePutData.
 */
tutao.entity.sys.DebitServicePutData.prototype.setInvoice = function(invoice) {
  this._invoice = invoice;
  return this;
};

/**
 * Provides the invoice of this DebitServicePutData.
 * @return {Array.<string>} The invoice of this DebitServicePutData.
 */
tutao.entity.sys.DebitServicePutData.prototype.getInvoice = function() {
  return this._invoice;
};

/**
 * Loads the invoice of this DebitServicePutData.
 * @return {Promise.<tutao.entity.sys.Invoice>} Resolves to the loaded invoice of this DebitServicePutData or an exception if the loading failed.
 */
tutao.entity.sys.DebitServicePutData.prototype.loadInvoice = function() {
  return tutao.entity.sys.Invoice.load(this._invoice);
};

/**
 * Updates this service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.DebitServicePutData.prototype.update = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  return tutao.locator.entityRestClient.putService(tutao.entity.sys.DebitServicePutData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.DebitServicePutData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
