"use strict";

tutao.provide('tutao.entity.sys.File');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.File = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._data = null;
    this._mimeType = null;
    this._name = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.File.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.File.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._data = data.data;
  this._mimeType = data.mimeType;
  this._name = data.name;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.File.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    data: this._data, 
    mimeType: this._mimeType, 
    name: this._name
  };
};

/**
 * Sets the id of this File.
 * @param {string} id The id of this File.
 */
tutao.entity.sys.File.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this File.
 * @return {string} The id of this File.
 */
tutao.entity.sys.File.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the data of this File.
 * @param {string} data The data of this File.
 */
tutao.entity.sys.File.prototype.setData = function(data) {
  this._data = data;
  return this;
};

/**
 * Provides the data of this File.
 * @return {string} The data of this File.
 */
tutao.entity.sys.File.prototype.getData = function() {
  return this._data;
};

/**
 * Sets the mimeType of this File.
 * @param {string} mimeType The mimeType of this File.
 */
tutao.entity.sys.File.prototype.setMimeType = function(mimeType) {
  this._mimeType = mimeType;
  return this;
};

/**
 * Provides the mimeType of this File.
 * @return {string} The mimeType of this File.
 */
tutao.entity.sys.File.prototype.getMimeType = function() {
  return this._mimeType;
};

/**
 * Sets the name of this File.
 * @param {string} name The name of this File.
 */
tutao.entity.sys.File.prototype.setName = function(name) {
  this._name = name;
  return this;
};

/**
 * Provides the name of this File.
 * @return {string} The name of this File.
 */
tutao.entity.sys.File.prototype.getName = function() {
  return this._name;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.File.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
