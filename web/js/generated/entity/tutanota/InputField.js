"use strict";

tutao.provide('tutao.entity.tutanota.InputField');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.InputField = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._name = null;
    this._type = null;
    this._enumValues = [];
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.InputField.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.InputField.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._name = data.name;
  this._type = data.type;
  this._enumValues = [];
  for (var i=0; i < data.enumValues.length; i++) {
    this._enumValues.push(new tutao.entity.tutanota.Name(parent, data.enumValues[i]));
  }
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.InputField.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    name: this._name, 
    type: this._type, 
    enumValues: tutao.entity.EntityHelper.aggregatesToJsonData(this._enumValues)
  };
};

/**
 * Sets the id of this InputField.
 * @param {string} id The id of this InputField.
 */
tutao.entity.tutanota.InputField.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this InputField.
 * @return {string} The id of this InputField.
 */
tutao.entity.tutanota.InputField.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the name of this InputField.
 * @param {string} name The name of this InputField.
 */
tutao.entity.tutanota.InputField.prototype.setName = function(name) {
  this._name = name;
  return this;
};

/**
 * Provides the name of this InputField.
 * @return {string} The name of this InputField.
 */
tutao.entity.tutanota.InputField.prototype.getName = function() {
  return this._name;
};

/**
 * Sets the type of this InputField.
 * @param {string} type The type of this InputField.
 */
tutao.entity.tutanota.InputField.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this InputField.
 * @return {string} The type of this InputField.
 */
tutao.entity.tutanota.InputField.prototype.getType = function() {
  return this._type;
};

/**
 * Provides the enumValues of this InputField.
 * @return {Array.<tutao.entity.tutanota.Name>} The enumValues of this InputField.
 */
tutao.entity.tutanota.InputField.prototype.getEnumValues = function() {
  return this._enumValues;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.InputField.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
