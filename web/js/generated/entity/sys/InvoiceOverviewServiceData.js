"use strict";

tutao.provide('tutao.entity.sys.InvoiceOverviewServiceData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceOverviewServiceData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._month = null;
    this._year = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.InvoiceOverviewServiceData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._month = data.month;
  this._year = data.year;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.InvoiceOverviewServiceData.MODEL_VERSION = '10';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.InvoiceOverviewServiceData.PATH = '/rest/sys/invoiceoverviewservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    month: this._month, 
    year: this._year
  };
};

/**
 * The id of the InvoiceOverviewServiceData type.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.TYPE_ID = 883;

/**
 * The id of the month attribute.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.MONTH_ATTRIBUTE_ID = 886;

/**
 * The id of the year attribute.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.YEAR_ATTRIBUTE_ID = 885;

/**
 * Sets the format of this InvoiceOverviewServiceData.
 * @param {string} format The format of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this InvoiceOverviewServiceData.
 * @return {string} The format of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the month of this InvoiceOverviewServiceData.
 * @param {string} month The month of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.setMonth = function(month) {
  this._month = month;
  return this;
};

/**
 * Provides the month of this InvoiceOverviewServiceData.
 * @return {string} The month of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.getMonth = function() {
  return this._month;
};

/**
 * Sets the year of this InvoiceOverviewServiceData.
 * @param {string} year The year of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.setYear = function(year) {
  this._year = year;
  return this;
};

/**
 * Provides the year of this InvoiceOverviewServiceData.
 * @return {string} The year of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.getYear = function() {
  return this._year;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 10;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.InvoiceOverviewServiceData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
