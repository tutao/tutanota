"use strict";

tutao.provide('tutao.entity.sys.BookingsRef');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BookingsRef = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._items = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.BookingsRef.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BookingsRef.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._items = data.items;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.BookingsRef.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    items: this._items
  };
};

/**
 * Sets the id of this BookingsRef.
 * @param {string} id The id of this BookingsRef.
 */
tutao.entity.sys.BookingsRef.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this BookingsRef.
 * @return {string} The id of this BookingsRef.
 */
tutao.entity.sys.BookingsRef.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the items of this BookingsRef.
 * @param {string} items The items of this BookingsRef.
 */
tutao.entity.sys.BookingsRef.prototype.setItems = function(items) {
  this._items = items;
  return this;
};

/**
 * Provides the items of this BookingsRef.
 * @return {string} The items of this BookingsRef.
 */
tutao.entity.sys.BookingsRef.prototype.getItems = function() {
  return this._items;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.BookingsRef.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
