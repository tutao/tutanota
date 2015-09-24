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
    this._endDate = null;
    this._onlyAccountingPostings = null;
    this._startDate = null;
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
  this._endDate = data.endDate;
  this._onlyAccountingPostings = data.onlyAccountingPostings;
  this._startDate = data.startDate;
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
    endDate: this._endDate, 
    onlyAccountingPostings: this._onlyAccountingPostings, 
    startDate: this._startDate
  };
};

/**
 * The id of the InvoiceOverviewServiceData type.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.TYPE_ID = 896;

/**
 * The id of the endDate attribute.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.ENDDATE_ATTRIBUTE_ID = 899;

/**
 * The id of the onlyAccountingPostings attribute.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.ONLYACCOUNTINGPOSTINGS_ATTRIBUTE_ID = 900;

/**
 * The id of the startDate attribute.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.STARTDATE_ATTRIBUTE_ID = 898;

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
 * Sets the endDate of this InvoiceOverviewServiceData.
 * @param {Date} endDate The endDate of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.setEndDate = function(endDate) {
  this._endDate = String(endDate.getTime());
  return this;
};

/**
 * Provides the endDate of this InvoiceOverviewServiceData.
 * @return {Date} The endDate of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.getEndDate = function() {
  if (isNaN(this._endDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._endDate);
  }
  return new Date(Number(this._endDate));
};

/**
 * Sets the onlyAccountingPostings of this InvoiceOverviewServiceData.
 * @param {boolean} onlyAccountingPostings The onlyAccountingPostings of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.setOnlyAccountingPostings = function(onlyAccountingPostings) {
  this._onlyAccountingPostings = onlyAccountingPostings ? '1' : '0';
  return this;
};

/**
 * Provides the onlyAccountingPostings of this InvoiceOverviewServiceData.
 * @return {boolean} The onlyAccountingPostings of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.getOnlyAccountingPostings = function() {
  return this._onlyAccountingPostings != '0';
};

/**
 * Sets the startDate of this InvoiceOverviewServiceData.
 * @param {Date} startDate The startDate of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.setStartDate = function(startDate) {
  this._startDate = String(startDate.getTime());
  return this;
};

/**
 * Provides the startDate of this InvoiceOverviewServiceData.
 * @return {Date} The startDate of this InvoiceOverviewServiceData.
 */
tutao.entity.sys.InvoiceOverviewServiceData.prototype.getStartDate = function() {
  if (isNaN(this._startDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._startDate);
  }
  return new Date(Number(this._startDate));
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
