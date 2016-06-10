"use strict";

tutao.provide('tutao.entity.sys.PushIdentifierList');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PushIdentifierList = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._list = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.PushIdentifierList.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PushIdentifierList.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._list = data.list;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PushIdentifierList.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    list: this._list
  };
};

/**
 * Sets the id of this PushIdentifierList.
 * @param {string} id The id of this PushIdentifierList.
 */
tutao.entity.sys.PushIdentifierList.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this PushIdentifierList.
 * @return {string} The id of this PushIdentifierList.
 */
tutao.entity.sys.PushIdentifierList.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the list of this PushIdentifierList.
 * @param {string} list The list of this PushIdentifierList.
 */
tutao.entity.sys.PushIdentifierList.prototype.setList = function(list) {
  this._list = list;
  return this;
};

/**
 * Provides the list of this PushIdentifierList.
 * @return {string} The list of this PushIdentifierList.
 */
tutao.entity.sys.PushIdentifierList.prototype.getList = function() {
  return this._list;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PushIdentifierList.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
