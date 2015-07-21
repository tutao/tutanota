"use strict";

tutao.provide('tutao.entity.sys.InvoiceServiceData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceServiceData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._date = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.InvoiceServiceData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceServiceData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._date = data.date;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.InvoiceServiceData.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.InvoiceServiceData.PATH = '/rest/sys/invoiceservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.InvoiceServiceData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.InvoiceServiceData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    date: this._date
  };
};

/**
 * The id of the InvoiceServiceData type.
 */
tutao.entity.sys.InvoiceServiceData.prototype.TYPE_ID = 594;

/**
 * The id of the date attribute.
 */
tutao.entity.sys.InvoiceServiceData.prototype.DATE_ATTRIBUTE_ID = 828;

/**
 * Sets the format of this InvoiceServiceData.
 * @param {string} format The format of this InvoiceServiceData.
 */
tutao.entity.sys.InvoiceServiceData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this InvoiceServiceData.
 * @return {string} The format of this InvoiceServiceData.
 */
tutao.entity.sys.InvoiceServiceData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the date of this InvoiceServiceData.
 * @param {Date} date The date of this InvoiceServiceData.
 */
tutao.entity.sys.InvoiceServiceData.prototype.setDate = function(date) {
  if (date == null) {
    this._date = null;
  } else {
    this._date = String(date.getTime());
  }
  return this;
};

/**
 * Provides the date of this InvoiceServiceData.
 * @return {Date} The date of this InvoiceServiceData.
 */
tutao.entity.sys.InvoiceServiceData.prototype.getDate = function() {
  if (this._date == null) {
    return null;
  }
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.InvoiceServiceData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.InvoiceServiceData.PATH, this, parameters, headers, null);
};
