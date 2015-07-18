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
  this._priceRequest = (data.priceRequest) ? new tutao.entity.sys.PriceRequestData(this, data.priceRequest) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PriceServiceData.MODEL_VERSION = '9';

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
    priceRequest: tutao.entity.EntityHelper.aggregatesToJsonData(this._priceRequest)
  };
};

/**
 * The id of the PriceServiceData type.
 */
tutao.entity.sys.PriceServiceData.prototype.TYPE_ID = 839;

/**
 * The id of the priceRequest attribute.
 */
tutao.entity.sys.PriceServiceData.prototype.PRICEREQUEST_ATTRIBUTE_ID = 841;

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
