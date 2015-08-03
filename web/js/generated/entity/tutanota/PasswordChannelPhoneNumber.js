"use strict";

tutao.provide('tutao.entity.tutanota.PasswordChannelPhoneNumber');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.PasswordChannelPhoneNumber = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._number = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.PasswordChannelPhoneNumber.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.PasswordChannelPhoneNumber.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._number = data.number;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.PasswordChannelPhoneNumber.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    number: this._number
  };
};

/**
 * The id of the PasswordChannelPhoneNumber type.
 */
tutao.entity.tutanota.PasswordChannelPhoneNumber.prototype.TYPE_ID = 135;

/**
 * The id of the number attribute.
 */
tutao.entity.tutanota.PasswordChannelPhoneNumber.prototype.NUMBER_ATTRIBUTE_ID = 137;

/**
 * Sets the id of this PasswordChannelPhoneNumber.
 * @param {string} id The id of this PasswordChannelPhoneNumber.
 */
tutao.entity.tutanota.PasswordChannelPhoneNumber.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this PasswordChannelPhoneNumber.
 * @return {string} The id of this PasswordChannelPhoneNumber.
 */
tutao.entity.tutanota.PasswordChannelPhoneNumber.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the number of this PasswordChannelPhoneNumber.
 * @param {string} number The number of this PasswordChannelPhoneNumber.
 */
tutao.entity.tutanota.PasswordChannelPhoneNumber.prototype.setNumber = function(number) {
  this._number = number;
  return this;
};

/**
 * Provides the number of this PasswordChannelPhoneNumber.
 * @return {string} The number of this PasswordChannelPhoneNumber.
 */
tutao.entity.tutanota.PasswordChannelPhoneNumber.prototype.getNumber = function() {
  return this._number;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.PasswordChannelPhoneNumber.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
