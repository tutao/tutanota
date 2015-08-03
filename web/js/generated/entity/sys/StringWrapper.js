"use strict";

tutao.provide('tutao.entity.sys.StringWrapper');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.StringWrapper = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._value = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.StringWrapper.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.StringWrapper.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._value = data.value;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.StringWrapper.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    value: this._value
  };
};

/**
 * The id of the StringWrapper type.
 */
tutao.entity.sys.StringWrapper.prototype.TYPE_ID = 728;

/**
 * The id of the value attribute.
 */
tutao.entity.sys.StringWrapper.prototype.VALUE_ATTRIBUTE_ID = 730;

/**
 * Sets the id of this StringWrapper.
 * @param {string} id The id of this StringWrapper.
 */
tutao.entity.sys.StringWrapper.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this StringWrapper.
 * @return {string} The id of this StringWrapper.
 */
tutao.entity.sys.StringWrapper.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the value of this StringWrapper.
 * @param {string} value The value of this StringWrapper.
 */
tutao.entity.sys.StringWrapper.prototype.setValue = function(value) {
  this._value = value;
  return this;
};

/**
 * Provides the value of this StringWrapper.
 * @return {string} The value of this StringWrapper.
 */
tutao.entity.sys.StringWrapper.prototype.getValue = function() {
  return this._value;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.StringWrapper.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
