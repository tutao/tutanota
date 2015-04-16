"use strict";

tutao.provide('tutao.entity.sys.BookingItemsRef');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BookingItemsRef = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._items = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.BookingItemsRef.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BookingItemsRef.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._items = data.items;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.BookingItemsRef.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    items: this._items
  };
};

/**
 * The id of the BookingItemsRef type.
 */
tutao.entity.sys.BookingItemsRef.prototype.TYPE_ID = 711;

/**
 * The id of the items attribute.
 */
tutao.entity.sys.BookingItemsRef.prototype.ITEMS_ATTRIBUTE_ID = 713;

/**
 * Sets the id of this BookingItemsRef.
 * @param {string} id The id of this BookingItemsRef.
 */
tutao.entity.sys.BookingItemsRef.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this BookingItemsRef.
 * @return {string} The id of this BookingItemsRef.
 */
tutao.entity.sys.BookingItemsRef.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the items of this BookingItemsRef.
 * @param {string} items The items of this BookingItemsRef.
 */
tutao.entity.sys.BookingItemsRef.prototype.setItems = function(items) {
  this._items = items;
  return this;
};

/**
 * Provides the items of this BookingItemsRef.
 * @return {string} The items of this BookingItemsRef.
 */
tutao.entity.sys.BookingItemsRef.prototype.getItems = function() {
  return this._items;
};
