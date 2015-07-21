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
    this._currentPriceNextPeriod = null;
    this._currentPriceThisPeriod = null;
    this._futurePriceNextPeriod = null;
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
  this._currentPriceNextPeriod = (data.currentPriceNextPeriod) ? new tutao.entity.sys.PriceData(this, data.currentPriceNextPeriod) : null;
  this._currentPriceThisPeriod = (data.currentPriceThisPeriod) ? new tutao.entity.sys.PriceData(this, data.currentPriceThisPeriod) : null;
  this._futurePriceNextPeriod = (data.futurePriceNextPeriod) ? new tutao.entity.sys.PriceData(this, data.futurePriceNextPeriod) : null;
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
    currentPriceNextPeriod: tutao.entity.EntityHelper.aggregatesToJsonData(this._currentPriceNextPeriod), 
    currentPriceThisPeriod: tutao.entity.EntityHelper.aggregatesToJsonData(this._currentPriceThisPeriod), 
    futurePriceNextPeriod: tutao.entity.EntityHelper.aggregatesToJsonData(this._futurePriceNextPeriod)
  };
};

/**
 * The id of the PriceServiceReturn type.
 */
tutao.entity.sys.PriceServiceReturn.prototype.TYPE_ID = 855;

/**
 * The id of the currentPeriodAddedPrice attribute.
 */
tutao.entity.sys.PriceServiceReturn.prototype.CURRENTPERIODADDEDPRICE_ATTRIBUTE_ID = 858;

/**
 * The id of the periodEndDate attribute.
 */
tutao.entity.sys.PriceServiceReturn.prototype.PERIODENDDATE_ATTRIBUTE_ID = 857;

/**
 * The id of the currentPriceNextPeriod attribute.
 */
tutao.entity.sys.PriceServiceReturn.prototype.CURRENTPRICENEXTPERIOD_ATTRIBUTE_ID = 860;

/**
 * The id of the currentPriceThisPeriod attribute.
 */
tutao.entity.sys.PriceServiceReturn.prototype.CURRENTPRICETHISPERIOD_ATTRIBUTE_ID = 859;

/**
 * The id of the futurePriceNextPeriod attribute.
 */
tutao.entity.sys.PriceServiceReturn.prototype.FUTUREPRICENEXTPERIOD_ATTRIBUTE_ID = 861;

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
 * Sets the currentPriceNextPeriod of this PriceServiceReturn.
 * @param {tutao.entity.sys.PriceData} currentPriceNextPeriod The currentPriceNextPeriod of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.setCurrentPriceNextPeriod = function(currentPriceNextPeriod) {
  this._currentPriceNextPeriod = currentPriceNextPeriod;
  return this;
};

/**
 * Provides the currentPriceNextPeriod of this PriceServiceReturn.
 * @return {tutao.entity.sys.PriceData} The currentPriceNextPeriod of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.getCurrentPriceNextPeriod = function() {
  return this._currentPriceNextPeriod;
};

/**
 * Sets the currentPriceThisPeriod of this PriceServiceReturn.
 * @param {tutao.entity.sys.PriceData} currentPriceThisPeriod The currentPriceThisPeriod of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.setCurrentPriceThisPeriod = function(currentPriceThisPeriod) {
  this._currentPriceThisPeriod = currentPriceThisPeriod;
  return this;
};

/**
 * Provides the currentPriceThisPeriod of this PriceServiceReturn.
 * @return {tutao.entity.sys.PriceData} The currentPriceThisPeriod of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.getCurrentPriceThisPeriod = function() {
  return this._currentPriceThisPeriod;
};

/**
 * Sets the futurePriceNextPeriod of this PriceServiceReturn.
 * @param {tutao.entity.sys.PriceData} futurePriceNextPeriod The futurePriceNextPeriod of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.setFuturePriceNextPeriod = function(futurePriceNextPeriod) {
  this._futurePriceNextPeriod = futurePriceNextPeriod;
  return this;
};

/**
 * Provides the futurePriceNextPeriod of this PriceServiceReturn.
 * @return {tutao.entity.sys.PriceData} The futurePriceNextPeriod of this PriceServiceReturn.
 */
tutao.entity.sys.PriceServiceReturn.prototype.getFuturePriceNextPeriod = function() {
  return this._futurePriceNextPeriod;
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
