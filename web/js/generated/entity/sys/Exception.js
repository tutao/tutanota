"use strict";

tutao.provide('tutao.entity.sys.Exception');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Exception = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._msg = null;
    this._type = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.Exception.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Exception.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._msg = data.msg;
  this._type = data.type;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Exception.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    msg: this._msg, 
    type: this._type
  };
};

/**
 * The id of the Exception type.
 */
tutao.entity.sys.Exception.prototype.TYPE_ID = 468;

/**
 * The id of the msg attribute.
 */
tutao.entity.sys.Exception.prototype.MSG_ATTRIBUTE_ID = 471;

/**
 * The id of the type attribute.
 */
tutao.entity.sys.Exception.prototype.TYPE_ATTRIBUTE_ID = 470;

/**
 * Sets the id of this Exception.
 * @param {string} id The id of this Exception.
 */
tutao.entity.sys.Exception.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Exception.
 * @return {string} The id of this Exception.
 */
tutao.entity.sys.Exception.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the msg of this Exception.
 * @param {string} msg The msg of this Exception.
 */
tutao.entity.sys.Exception.prototype.setMsg = function(msg) {
  this._msg = msg;
  return this;
};

/**
 * Provides the msg of this Exception.
 * @return {string} The msg of this Exception.
 */
tutao.entity.sys.Exception.prototype.getMsg = function() {
  return this._msg;
};

/**
 * Sets the type of this Exception.
 * @param {string} type The type of this Exception.
 */
tutao.entity.sys.Exception.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this Exception.
 * @return {string} The type of this Exception.
 */
tutao.entity.sys.Exception.prototype.getType = function() {
  return this._type;
};
