"use strict";

tutao.provide('tutao.entity.tutanota.ContactFormStatisticField');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormStatisticField = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._name = null;
    this._value = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ContactFormStatisticField.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._name = data.name;
  this._value = data.value;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    name: this._name, 
    value: this._value
  };
};

/**
 * Sets the id of this ContactFormStatisticField.
 * @param {string} id The id of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ContactFormStatisticField.
 * @return {string} The id of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the name of this ContactFormStatisticField.
 * @param {string} name The name of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.setName = function(name) {
  this._name = name;
  return this;
};

/**
 * Provides the name of this ContactFormStatisticField.
 * @return {string} The name of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.getName = function() {
  return this._name;
};

/**
 * Sets the value of this ContactFormStatisticField.
 * @param {string} value The value of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.setValue = function(value) {
  this._value = value;
  return this;
};

/**
 * Provides the value of this ContactFormStatisticField.
 * @return {string} The value of this ContactFormStatisticField.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.getValue = function() {
  return this._value;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ContactFormStatisticField.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
