"use strict";

tutao.provide('tutao.entity.sys.PriceServiceData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PriceServiceData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._date = null;
    this._priceRequest = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PriceServiceData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PriceServiceData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._date = data.date;
  this._priceRequest = (data.priceRequest) ? new tutao.entity.sys.PriceRequestData(this, data.priceRequest) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PriceServiceData.MODEL_VERSION = '13';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PriceServiceData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PriceServiceData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    date: this._date, 
    priceRequest: tutao.entity.EntityHelper.aggregatesToJsonData(this._priceRequest)
  };
};

/**
 * The id of the PriceServiceData type.
 */
tutao.entity.sys.PriceServiceData.prototype.TYPE_ID = 843;

/**
 * The id of the date attribute.
 */
tutao.entity.sys.PriceServiceData.prototype.DATE_ATTRIBUTE_ID = 846;

/**
 * The id of the priceRequest attribute.
 */
tutao.entity.sys.PriceServiceData.prototype.PRICEREQUEST_ATTRIBUTE_ID = 845;

/**
 * Sets the format of this PriceServiceData.
 * @param {string} format The format of this PriceServiceData.
 */
tutao.entity.sys.PriceServiceData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PriceServiceData.
 * @return {string} The format of this PriceServiceData.
 */
tutao.entity.sys.PriceServiceData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the date of this PriceServiceData.
 * @param {Date} date The date of this PriceServiceData.
 */
tutao.entity.sys.PriceServiceData.prototype.setDate = function(date) {
  if (date == null) {
    this._date = null;
  } else {
    this._date = String(date.getTime());
  }
  return this;
};

/**
 * Provides the date of this PriceServiceData.
 * @return {Date} The date of this PriceServiceData.
 */
tutao.entity.sys.PriceServiceData.prototype.getDate = function() {
  if (this._date == null) {
    return null;
  }
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the priceRequest of this PriceServiceData.
 * @param {tutao.entity.sys.PriceRequestData} priceRequest The priceRequest of this PriceServiceData.
 */
tutao.entity.sys.PriceServiceData.prototype.setPriceRequest = function(priceRequest) {
  this._priceRequest = priceRequest;
  return this;
};

/**
 * Provides the priceRequest of this PriceServiceData.
 * @return {tutao.entity.sys.PriceRequestData} The priceRequest of this PriceServiceData.
 */
tutao.entity.sys.PriceServiceData.prototype.getPriceRequest = function() {
  return this._priceRequest;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PriceServiceData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
