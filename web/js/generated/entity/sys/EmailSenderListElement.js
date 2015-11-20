"use strict";

tutao.provide('tutao.entity.sys.EmailSenderListElement');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.EmailSenderListElement = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._hashedValue = null;
    this._type = null;
    this._value = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.EmailSenderListElement.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.EmailSenderListElement.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._hashedValue = data.hashedValue;
  this._type = data.type;
  this._value = data.value;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.EmailSenderListElement.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    hashedValue: this._hashedValue, 
    type: this._type, 
    value: this._value
  };
};

/**
 * The id of the EmailSenderListElement type.
 */
tutao.entity.sys.EmailSenderListElement.prototype.TYPE_ID = 949;

/**
 * The id of the hashedValue attribute.
 */
tutao.entity.sys.EmailSenderListElement.prototype.HASHEDVALUE_ATTRIBUTE_ID = 951;

/**
 * The id of the type attribute.
 */
tutao.entity.sys.EmailSenderListElement.prototype.TYPE_ATTRIBUTE_ID = 953;

/**
 * The id of the value attribute.
 */
tutao.entity.sys.EmailSenderListElement.prototype.VALUE_ATTRIBUTE_ID = 952;

/**
 * Sets the id of this EmailSenderListElement.
 * @param {string} id The id of this EmailSenderListElement.
 */
tutao.entity.sys.EmailSenderListElement.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this EmailSenderListElement.
 * @return {string} The id of this EmailSenderListElement.
 */
tutao.entity.sys.EmailSenderListElement.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the hashedValue of this EmailSenderListElement.
 * @param {string} hashedValue The hashedValue of this EmailSenderListElement.
 */
tutao.entity.sys.EmailSenderListElement.prototype.setHashedValue = function(hashedValue) {
  this._hashedValue = hashedValue;
  return this;
};

/**
 * Provides the hashedValue of this EmailSenderListElement.
 * @return {string} The hashedValue of this EmailSenderListElement.
 */
tutao.entity.sys.EmailSenderListElement.prototype.getHashedValue = function() {
  return this._hashedValue;
};

/**
 * Sets the type of this EmailSenderListElement.
 * @param {string} type The type of this EmailSenderListElement.
 */
tutao.entity.sys.EmailSenderListElement.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this EmailSenderListElement.
 * @return {string} The type of this EmailSenderListElement.
 */
tutao.entity.sys.EmailSenderListElement.prototype.getType = function() {
  return this._type;
};

/**
 * Sets the value of this EmailSenderListElement.
 * @param {string} value The value of this EmailSenderListElement.
 */
tutao.entity.sys.EmailSenderListElement.prototype.setValue = function(value) {
  var dataToEncrypt = value;
  this._value = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the value of this EmailSenderListElement.
 * @return {string} The value of this EmailSenderListElement.
 */
tutao.entity.sys.EmailSenderListElement.prototype.getValue = function() {
  if (this._value == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._value);
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.EmailSenderListElement.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
