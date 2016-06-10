"use strict";

tutao.provide('tutao.entity.sys.BookingItem');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BookingItem = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._currentCount = null;
    this._currentInvoicedCount = null;
    this._featureType = null;
    this._maxCount = null;
    this._price = null;
    this._priceType = null;
    this._totalInvoicedCount = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.BookingItem.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BookingItem.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._currentCount = data.currentCount;
  this._currentInvoicedCount = data.currentInvoicedCount;
  this._featureType = data.featureType;
  this._maxCount = data.maxCount;
  this._price = data.price;
  this._priceType = data.priceType;
  this._totalInvoicedCount = data.totalInvoicedCount;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.BookingItem.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    currentCount: this._currentCount, 
    currentInvoicedCount: this._currentInvoicedCount, 
    featureType: this._featureType, 
    maxCount: this._maxCount, 
    price: this._price, 
    priceType: this._priceType, 
    totalInvoicedCount: this._totalInvoicedCount
  };
};

/**
 * Sets the id of this BookingItem.
 * @param {string} id The id of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this BookingItem.
 * @return {string} The id of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the currentCount of this BookingItem.
 * @param {string} currentCount The currentCount of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setCurrentCount = function(currentCount) {
  this._currentCount = currentCount;
  return this;
};

/**
 * Provides the currentCount of this BookingItem.
 * @return {string} The currentCount of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getCurrentCount = function() {
  return this._currentCount;
};

/**
 * Sets the currentInvoicedCount of this BookingItem.
 * @param {string} currentInvoicedCount The currentInvoicedCount of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setCurrentInvoicedCount = function(currentInvoicedCount) {
  this._currentInvoicedCount = currentInvoicedCount;
  return this;
};

/**
 * Provides the currentInvoicedCount of this BookingItem.
 * @return {string} The currentInvoicedCount of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getCurrentInvoicedCount = function() {
  return this._currentInvoicedCount;
};

/**
 * Sets the featureType of this BookingItem.
 * @param {string} featureType The featureType of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setFeatureType = function(featureType) {
  this._featureType = featureType;
  return this;
};

/**
 * Provides the featureType of this BookingItem.
 * @return {string} The featureType of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getFeatureType = function() {
  return this._featureType;
};

/**
 * Sets the maxCount of this BookingItem.
 * @param {string} maxCount The maxCount of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setMaxCount = function(maxCount) {
  this._maxCount = maxCount;
  return this;
};

/**
 * Provides the maxCount of this BookingItem.
 * @return {string} The maxCount of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getMaxCount = function() {
  return this._maxCount;
};

/**
 * Sets the price of this BookingItem.
 * @param {string} price The price of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setPrice = function(price) {
  this._price = price;
  return this;
};

/**
 * Provides the price of this BookingItem.
 * @return {string} The price of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getPrice = function() {
  return this._price;
};

/**
 * Sets the priceType of this BookingItem.
 * @param {string} priceType The priceType of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setPriceType = function(priceType) {
  this._priceType = priceType;
  return this;
};

/**
 * Provides the priceType of this BookingItem.
 * @return {string} The priceType of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getPriceType = function() {
  return this._priceType;
};

/**
 * Sets the totalInvoicedCount of this BookingItem.
 * @param {string} totalInvoicedCount The totalInvoicedCount of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setTotalInvoicedCount = function(totalInvoicedCount) {
  this._totalInvoicedCount = totalInvoicedCount;
  return this;
};

/**
 * Provides the totalInvoicedCount of this BookingItem.
 * @return {string} The totalInvoicedCount of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getTotalInvoicedCount = function() {
  return this._totalInvoicedCount;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.BookingItem.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
