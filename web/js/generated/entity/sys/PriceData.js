"use strict";

tutao.provide('tutao.entity.sys.PriceData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PriceData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._paymentInterval = null;
    this._price = null;
    this._taxIncluded = null;
    this._items = [];
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.PriceData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PriceData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._paymentInterval = data.paymentInterval;
  this._price = data.price;
  this._taxIncluded = data.taxIncluded;
  this._items = [];
  for (var i=0; i < data.items.length; i++) {
    this._items.push(new tutao.entity.sys.PriceItemData(parent, data.items[i]));
  }
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PriceData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    paymentInterval: this._paymentInterval, 
    price: this._price, 
    taxIncluded: this._taxIncluded, 
    items: tutao.entity.EntityHelper.aggregatesToJsonData(this._items)
  };
};

/**
 * The id of the PriceData type.
 */
tutao.entity.sys.PriceData.prototype.TYPE_ID = 853;

/**
 * The id of the paymentInterval attribute.
 */
tutao.entity.sys.PriceData.prototype.PAYMENTINTERVAL_ATTRIBUTE_ID = 857;

/**
 * The id of the price attribute.
 */
tutao.entity.sys.PriceData.prototype.PRICE_ATTRIBUTE_ID = 855;

/**
 * The id of the taxIncluded attribute.
 */
tutao.entity.sys.PriceData.prototype.TAXINCLUDED_ATTRIBUTE_ID = 856;

/**
 * The id of the items attribute.
 */
tutao.entity.sys.PriceData.prototype.ITEMS_ATTRIBUTE_ID = 858;

/**
 * Sets the id of this PriceData.
 * @param {string} id The id of this PriceData.
 */
tutao.entity.sys.PriceData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this PriceData.
 * @return {string} The id of this PriceData.
 */
tutao.entity.sys.PriceData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the paymentInterval of this PriceData.
 * @param {string} paymentInterval The paymentInterval of this PriceData.
 */
tutao.entity.sys.PriceData.prototype.setPaymentInterval = function(paymentInterval) {
  this._paymentInterval = paymentInterval;
  return this;
};

/**
 * Provides the paymentInterval of this PriceData.
 * @return {string} The paymentInterval of this PriceData.
 */
tutao.entity.sys.PriceData.prototype.getPaymentInterval = function() {
  return this._paymentInterval;
};

/**
 * Sets the price of this PriceData.
 * @param {string} price The price of this PriceData.
 */
tutao.entity.sys.PriceData.prototype.setPrice = function(price) {
  this._price = price;
  return this;
};

/**
 * Provides the price of this PriceData.
 * @return {string} The price of this PriceData.
 */
tutao.entity.sys.PriceData.prototype.getPrice = function() {
  return this._price;
};

/**
 * Sets the taxIncluded of this PriceData.
 * @param {boolean} taxIncluded The taxIncluded of this PriceData.
 */
tutao.entity.sys.PriceData.prototype.setTaxIncluded = function(taxIncluded) {
  this._taxIncluded = taxIncluded ? '1' : '0';
  return this;
};

/**
 * Provides the taxIncluded of this PriceData.
 * @return {boolean} The taxIncluded of this PriceData.
 */
tutao.entity.sys.PriceData.prototype.getTaxIncluded = function() {
  return this._taxIncluded != '0';
};

/**
 * Provides the items of this PriceData.
 * @return {Array.<tutao.entity.sys.PriceItemData>} The items of this PriceData.
 */
tutao.entity.sys.PriceData.prototype.getItems = function() {
  return this._items;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PriceData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
