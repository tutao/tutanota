"use strict";

tutao.provide('tutao.entity.sys.LongConfigValue');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.LongConfigValue = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._name = null;
    this._value = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.LongConfigValue.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.LongConfigValue.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._name = data.name;
  this._value = data.value;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.LongConfigValue.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    name: this._name, 
    value: this._value
  };
};

/**
 * The id of the LongConfigValue type.
 */
tutao.entity.sys.LongConfigValue.prototype.TYPE_ID = 511;

/**
 * The id of the name attribute.
 */
tutao.entity.sys.LongConfigValue.prototype.NAME_ATTRIBUTE_ID = 513;

/**
 * The id of the value attribute.
 */
tutao.entity.sys.LongConfigValue.prototype.VALUE_ATTRIBUTE_ID = 514;

/**
 * Sets the id of this LongConfigValue.
 * @param {string} id The id of this LongConfigValue.
 */
tutao.entity.sys.LongConfigValue.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this LongConfigValue.
 * @return {string} The id of this LongConfigValue.
 */
tutao.entity.sys.LongConfigValue.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the name of this LongConfigValue.
 * @param {string} name The name of this LongConfigValue.
 */
tutao.entity.sys.LongConfigValue.prototype.setName = function(name) {
  this._name = name;
  return this;
};

/**
 * Provides the name of this LongConfigValue.
 * @return {string} The name of this LongConfigValue.
 */
tutao.entity.sys.LongConfigValue.prototype.getName = function() {
  return this._name;
};

/**
 * Sets the value of this LongConfigValue.
 * @param {string} value The value of this LongConfigValue.
 */
tutao.entity.sys.LongConfigValue.prototype.setValue = function(value) {
  this._value = value;
  return this;
};

/**
 * Provides the value of this LongConfigValue.
 * @return {string} The value of this LongConfigValue.
 */
tutao.entity.sys.LongConfigValue.prototype.getValue = function() {
  return this._value;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.LongConfigValue.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
