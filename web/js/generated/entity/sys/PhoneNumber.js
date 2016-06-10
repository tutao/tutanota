"use strict";

tutao.provide('tutao.entity.sys.PhoneNumber');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PhoneNumber = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._number = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.PhoneNumber.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PhoneNumber.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._number = data.number;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PhoneNumber.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    number: this._number
  };
};

/**
 * Sets the id of this PhoneNumber.
 * @param {string} id The id of this PhoneNumber.
 */
tutao.entity.sys.PhoneNumber.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this PhoneNumber.
 * @return {string} The id of this PhoneNumber.
 */
tutao.entity.sys.PhoneNumber.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the number of this PhoneNumber.
 * @param {string} number The number of this PhoneNumber.
 */
tutao.entity.sys.PhoneNumber.prototype.setNumber = function(number) {
  this._number = number;
  return this;
};

/**
 * Provides the number of this PhoneNumber.
 * @return {string} The number of this PhoneNumber.
 */
tutao.entity.sys.PhoneNumber.prototype.getNumber = function() {
  return this._number;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PhoneNumber.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
