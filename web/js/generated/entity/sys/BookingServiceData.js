"use strict";

tutao.provide('tutao.entity.sys.BookingServiceData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BookingServiceData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._amount = null;
    this._date = null;
    this._featureType = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.BookingServiceData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BookingServiceData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._amount = data.amount;
  this._date = data.date;
  this._featureType = data.featureType;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.BookingServiceData.MODEL_VERSION = '19';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.BookingServiceData.PATH = '/rest/sys/bookingservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.BookingServiceData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.BookingServiceData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    amount: this._amount, 
    date: this._date, 
    featureType: this._featureType
  };
};

/**
 * Sets the format of this BookingServiceData.
 * @param {string} format The format of this BookingServiceData.
 */
tutao.entity.sys.BookingServiceData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this BookingServiceData.
 * @return {string} The format of this BookingServiceData.
 */
tutao.entity.sys.BookingServiceData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the amount of this BookingServiceData.
 * @param {string} amount The amount of this BookingServiceData.
 */
tutao.entity.sys.BookingServiceData.prototype.setAmount = function(amount) {
  this._amount = amount;
  return this;
};

/**
 * Provides the amount of this BookingServiceData.
 * @return {string} The amount of this BookingServiceData.
 */
tutao.entity.sys.BookingServiceData.prototype.getAmount = function() {
  return this._amount;
};

/**
 * Sets the date of this BookingServiceData.
 * @param {Date} date The date of this BookingServiceData.
 */
tutao.entity.sys.BookingServiceData.prototype.setDate = function(date) {
  if (date == null) {
    this._date = null;
  } else {
    this._date = String(date.getTime());
  }
  return this;
};

/**
 * Provides the date of this BookingServiceData.
 * @return {Date} The date of this BookingServiceData.
 */
tutao.entity.sys.BookingServiceData.prototype.getDate = function() {
  if (this._date == null) {
    return null;
  }
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the featureType of this BookingServiceData.
 * @param {string} featureType The featureType of this BookingServiceData.
 */
tutao.entity.sys.BookingServiceData.prototype.setFeatureType = function(featureType) {
  this._featureType = featureType;
  return this;
};

/**
 * Provides the featureType of this BookingServiceData.
 * @return {string} The featureType of this BookingServiceData.
 */
tutao.entity.sys.BookingServiceData.prototype.getFeatureType = function() {
  return this._featureType;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.BookingServiceData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "19";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.BookingServiceData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.BookingServiceData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
