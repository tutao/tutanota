"use strict";

tutao.provide('tutao.entity.sys.PriceItemData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PriceItemData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._count = null;
    this._featureType = null;
    this._price = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.PriceItemData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PriceItemData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._count = data.count;
  this._featureType = data.featureType;
  this._price = data.price;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PriceItemData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    count: this._count, 
    featureType: this._featureType, 
    price: this._price
  };
};

/**
 * The id of the PriceItemData type.
 */
tutao.entity.sys.PriceItemData.prototype.TYPE_ID = 845;

/**
 * The id of the count attribute.
 */
tutao.entity.sys.PriceItemData.prototype.COUNT_ATTRIBUTE_ID = 848;

/**
 * The id of the featureType attribute.
 */
tutao.entity.sys.PriceItemData.prototype.FEATURETYPE_ATTRIBUTE_ID = 847;

/**
 * The id of the price attribute.
 */
tutao.entity.sys.PriceItemData.prototype.PRICE_ATTRIBUTE_ID = 849;

/**
 * Sets the id of this PriceItemData.
 * @param {string} id The id of this PriceItemData.
 */
tutao.entity.sys.PriceItemData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this PriceItemData.
 * @return {string} The id of this PriceItemData.
 */
tutao.entity.sys.PriceItemData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the count of this PriceItemData.
 * @param {string} count The count of this PriceItemData.
 */
tutao.entity.sys.PriceItemData.prototype.setCount = function(count) {
  this._count = count;
  return this;
};

/**
 * Provides the count of this PriceItemData.
 * @return {string} The count of this PriceItemData.
 */
tutao.entity.sys.PriceItemData.prototype.getCount = function() {
  return this._count;
};

/**
 * Sets the featureType of this PriceItemData.
 * @param {string} featureType The featureType of this PriceItemData.
 */
tutao.entity.sys.PriceItemData.prototype.setFeatureType = function(featureType) {
  this._featureType = featureType;
  return this;
};

/**
 * Provides the featureType of this PriceItemData.
 * @return {string} The featureType of this PriceItemData.
 */
tutao.entity.sys.PriceItemData.prototype.getFeatureType = function() {
  return this._featureType;
};

/**
 * Sets the price of this PriceItemData.
 * @param {string} price The price of this PriceItemData.
 */
tutao.entity.sys.PriceItemData.prototype.setPrice = function(price) {
  this._price = price;
  return this;
};

/**
 * Provides the price of this PriceItemData.
 * @return {string} The price of this PriceItemData.
 */
tutao.entity.sys.PriceItemData.prototype.getPrice = function() {
  return this._price;
};
