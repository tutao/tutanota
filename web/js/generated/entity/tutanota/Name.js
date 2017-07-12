"use strict";

tutao.provide('tutao.entity.tutanota.Name');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Name = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._name = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.Name.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Name.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._name = data.name;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.Name.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    name: this._name
  };
};

/**
 * Sets the id of this Name.
 * @param {string} id The id of this Name.
 */
tutao.entity.tutanota.Name.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Name.
 * @return {string} The id of this Name.
 */
tutao.entity.tutanota.Name.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the name of this Name.
 * @param {string} name The name of this Name.
 */
tutao.entity.tutanota.Name.prototype.setName = function(name) {
  this._name = name;
  return this;
};

/**
 * Provides the name of this Name.
 * @return {string} The name of this Name.
 */
tutao.entity.tutanota.Name.prototype.getName = function() {
  return this._name;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.Name.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
