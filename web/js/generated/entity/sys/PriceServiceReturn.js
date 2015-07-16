"use strict";

tutao.provide('tutao.entity.sys.PriceServiceReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PriceServiceReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._currentPeriodAddedPrice = null;
    this._periodEndDate = null;
    this._currentPrice = null;
    this._futurePrice = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PriceServiceReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PriceServiceReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._currentPeriodAddedPrice = data.currentPeriodAddedPrice;
  this._periodEndDate = data.periodEndDate;
  this._currentPrice = (data.currentPrice) ? new tutao.entity.sys.PriceData(this, data.currentPrice) : null;
  this._futurePrice = (data.futurePrice) ? new tutao.entity.sys.PriceData(this, data.futurePrice) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PriceServiceReturn.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.PriceServiceReturn.PATH = '/rest/sys/priceservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PriceServiceReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PriceServiceReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    currentPeriodAddedPrice: this._currentPeriodAddedPrice, 
    periodEndDate: this._periodEndDate, 
    currentPrice: tutao.entity.EntityHelper.aggregatesToJsonData(this._currentPrice), 
    futurePrice: tutao.entity.EntityHelper.aggregatesToJsonData(this._futurePrice)
  };
};

/**
 * The id of the PriceServiceReturn type.
 */
tutao.entity.sys.PriceServiceReturn.prototype.TYPE_ID = 849;

/**
 * The id of the currentPeriodAddedPrice attribute.
 */
tutao.entity.sys.PriceServiceReturn.prototype.CURRENTPERIODADDEDPRICE_ATTRIBUTE_ID = 852;

/**
 * The id of the periodEndDate attribute.
 */
tutao.entity.sys.PriceServiceReturn.prototype.PERIODENDDATE_ATTRIBUTE_ID = 851;

/**
 * The id of the currentPrice attribute.
 */
tutao.entity.sys.PriceServiceReturn.prototype.CURRENTPRICE_ATTRIBUTE_ID = 853;

/**
 * The id of the futurePrice attribute.
 */
tutao.entity.sys.PriceServiceReturn.prototype.FUTUREPRICE_ATTRIBUTE_ID = 854;

/**
 * Sets the format of this PriceServiceReturn.
 * @param {string} format The format of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PriceServiceReturn.
 * @return {string} The format of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the currentPeriodAddedPrice of this PriceServiceReturn.
 * @param {string} currentPeriodAddedPrice The currentPeriodAddedPrice of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.setCurrentPeriodAddedPrice = function(currentPeriodAddedPrice) {
  this._currentPeriodAddedPrice = currentPeriodAddedPrice;
  return this;
};

/**
 * Provides the currentPeriodAddedPrice of this PriceServiceReturn.
 * @return {string} The currentPeriodAddedPrice of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.getCurrentPeriodAddedPrice = function() {
  return this._currentPeriodAddedPrice;
};

/**
 * Sets the periodEndDate of this PriceServiceReturn.
 * @param {Date} periodEndDate The periodEndDate of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.setPeriodEndDate = function(periodEndDate) {
  this._periodEndDate = String(periodEndDate.getTime());
  return this;
};

/**
 * Provides the periodEndDate of this PriceServiceReturn.
 * @return {Date} The periodEndDate of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.getPeriodEndDate = function() {
  if (isNaN(this._periodEndDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._periodEndDate);
  }
  return new Date(Number(this._periodEndDate));
};

/**
 * Sets the currentPrice of this PriceServiceReturn.
 * @param {tutao.entity.sys.PriceData} currentPrice The currentPrice of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.setCurrentPrice = function(currentPrice) {
  this._currentPrice = currentPrice;
  return this;
};

/**
 * Provides the currentPrice of this PriceServiceReturn.
 * @return {tutao.entity.sys.PriceData} The currentPrice of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.getCurrentPrice = function() {
  return this._currentPrice;
};

/**
 * Sets the futurePrice of this PriceServiceReturn.
 * @param {tutao.entity.sys.PriceData} futurePrice The futurePrice of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.setFuturePrice = function(futurePrice) {
  this._futurePrice = futurePrice;
  return this;
};

/**
 * Provides the futurePrice of this PriceServiceReturn.
 * @return {tutao.entity.sys.PriceData} The futurePrice of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.getFuturePrice = function() {
  return this._futurePrice;
};

/**
 * Loads from the service.
 * @param {tutao.entity.sys.PriceServiceData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.PriceServiceReturn>} Resolves to PriceServiceReturn or an exception if the loading failed.
 */
tutao.entity.sys.PriceServiceReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.PriceServiceReturn, tutao.entity.sys.PriceServiceReturn.PATH, entity, parameters, headers);
};
