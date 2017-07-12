"use strict";

tutao.provide('tutao.entity.tutanota.DeleteNotAccessibleMailsData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._customerId = null;
    this._endDateLarge = null;
    this._noop = null;
    this._singleCustomer = null;
    this._startDateSmall = null;
    this._stop = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._customerId = data.customerId;
  this._endDateLarge = data.endDateLarge;
  this._noop = data.noop;
  this._singleCustomer = data.singleCustomer;
  this._startDateSmall = data.startDateSmall;
  this._stop = data.stop;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.PATH = '/rest/tutanota/deletenotaccessiblemailsservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    customerId: this._customerId, 
    endDateLarge: this._endDateLarge, 
    noop: this._noop, 
    singleCustomer: this._singleCustomer, 
    startDateSmall: this._startDateSmall, 
    stop: this._stop
  };
};

/**
 * Sets the format of this DeleteNotAccessibleMailsData.
 * @param {string} format The format of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DeleteNotAccessibleMailsData.
 * @return {string} The format of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the customerId of this DeleteNotAccessibleMailsData.
 * @param {string} customerId The customerId of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.setCustomerId = function(customerId) {
  this._customerId = customerId;
  return this;
};

/**
 * Provides the customerId of this DeleteNotAccessibleMailsData.
 * @return {string} The customerId of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.getCustomerId = function() {
  return this._customerId;
};

/**
 * Sets the endDateLarge of this DeleteNotAccessibleMailsData.
 * @param {Date} endDateLarge The endDateLarge of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.setEndDateLarge = function(endDateLarge) {
  this._endDateLarge = String(endDateLarge.getTime());
  return this;
};

/**
 * Provides the endDateLarge of this DeleteNotAccessibleMailsData.
 * @return {Date} The endDateLarge of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.getEndDateLarge = function() {
  if (isNaN(this._endDateLarge)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._endDateLarge);
  }
  return new Date(Number(this._endDateLarge));
};

/**
 * Sets the noop of this DeleteNotAccessibleMailsData.
 * @param {boolean} noop The noop of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.setNoop = function(noop) {
  this._noop = noop ? '1' : '0';
  return this;
};

/**
 * Provides the noop of this DeleteNotAccessibleMailsData.
 * @return {boolean} The noop of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.getNoop = function() {
  return this._noop != '0';
};

/**
 * Sets the singleCustomer of this DeleteNotAccessibleMailsData.
 * @param {boolean} singleCustomer The singleCustomer of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.setSingleCustomer = function(singleCustomer) {
  this._singleCustomer = singleCustomer ? '1' : '0';
  return this;
};

/**
 * Provides the singleCustomer of this DeleteNotAccessibleMailsData.
 * @return {boolean} The singleCustomer of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.getSingleCustomer = function() {
  return this._singleCustomer != '0';
};

/**
 * Sets the startDateSmall of this DeleteNotAccessibleMailsData.
 * @param {Date} startDateSmall The startDateSmall of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.setStartDateSmall = function(startDateSmall) {
  this._startDateSmall = String(startDateSmall.getTime());
  return this;
};

/**
 * Provides the startDateSmall of this DeleteNotAccessibleMailsData.
 * @return {Date} The startDateSmall of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.getStartDateSmall = function() {
  if (isNaN(this._startDateSmall)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._startDateSmall);
  }
  return new Date(Number(this._startDateSmall));
};

/**
 * Sets the stop of this DeleteNotAccessibleMailsData.
 * @param {boolean} stop The stop of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.setStop = function(stop) {
  this._stop = stop ? '1' : '0';
  return this;
};

/**
 * Provides the stop of this DeleteNotAccessibleMailsData.
 * @return {boolean} The stop of this DeleteNotAccessibleMailsData.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.getStop = function() {
  return this._stop != '0';
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "20";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.DeleteNotAccessibleMailsData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.DeleteNotAccessibleMailsData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
