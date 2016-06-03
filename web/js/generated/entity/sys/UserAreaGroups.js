"use strict";

tutao.provide('tutao.entity.sys.UserAreaGroups');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserAreaGroups = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._list = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.UserAreaGroups.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserAreaGroups.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._list = data.list;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.UserAreaGroups.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    list: this._list
  };
};

/**
 * The id of the UserAreaGroups type.
 */
tutao.entity.sys.UserAreaGroups.prototype.TYPE_ID = 987;

/**
 * The id of the list attribute.
 */
tutao.entity.sys.UserAreaGroups.prototype.LIST_ATTRIBUTE_ID = 989;

/**
 * Sets the id of this UserAreaGroups.
 * @param {string} id The id of this UserAreaGroups.
 */
tutao.entity.sys.UserAreaGroups.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this UserAreaGroups.
 * @return {string} The id of this UserAreaGroups.
 */
tutao.entity.sys.UserAreaGroups.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the list of this UserAreaGroups.
 * @param {string} list The list of this UserAreaGroups.
 */
tutao.entity.sys.UserAreaGroups.prototype.setList = function(list) {
  this._list = list;
  return this;
};

/**
 * Provides the list of this UserAreaGroups.
 * @return {string} The list of this UserAreaGroups.
 */
tutao.entity.sys.UserAreaGroups.prototype.getList = function() {
  return this._list;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.UserAreaGroups.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
