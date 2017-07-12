"use strict";

tutao.provide('tutao.entity.tutanota.ContactFormEncryptedStatisticsField');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormEncryptedStatisticsField = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._name = null;
    this._name_ = null;
    this._value = null;
    this._value_ = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ContactFormEncryptedStatisticsField.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormEncryptedStatisticsField.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._name = data.name;
  this._name_ = null;
  this._value = data.value;
  this._value_ = null;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactFormEncryptedStatisticsField.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    name: this._name, 
    value: this._value
  };
};

/**
 * Sets the id of this ContactFormEncryptedStatisticsField.
 * @param {string} id The id of this ContactFormEncryptedStatisticsField.
 */
tutao.entity.tutanota.ContactFormEncryptedStatisticsField.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ContactFormEncryptedStatisticsField.
 * @return {string} The id of this ContactFormEncryptedStatisticsField.
 */
tutao.entity.tutanota.ContactFormEncryptedStatisticsField.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the name of this ContactFormEncryptedStatisticsField.
 * @param {string} name The name of this ContactFormEncryptedStatisticsField.
 */
tutao.entity.tutanota.ContactFormEncryptedStatisticsField.prototype.setName = function(name) {
  var dataToEncrypt = name;
  this._name = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._name_ = name;
  return this;
};

/**
 * Provides the name of this ContactFormEncryptedStatisticsField.
 * @return {string} The name of this ContactFormEncryptedStatisticsField.
 */
tutao.entity.tutanota.ContactFormEncryptedStatisticsField.prototype.getName = function() {
  if (this._name_ != null) {
    return this._name_;
  }
  if (this._name == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._name);
    this._name_ = value;
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
 * Sets the value of this ContactFormEncryptedStatisticsField.
 * @param {string} value The value of this ContactFormEncryptedStatisticsField.
 */
tutao.entity.tutanota.ContactFormEncryptedStatisticsField.prototype.setValue = function(value) {
  var dataToEncrypt = value;
  this._value = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._value_ = value;
  return this;
};

/**
 * Provides the value of this ContactFormEncryptedStatisticsField.
 * @return {string} The value of this ContactFormEncryptedStatisticsField.
 */
tutao.entity.tutanota.ContactFormEncryptedStatisticsField.prototype.getValue = function() {
  if (this._value_ != null) {
    return this._value_;
  }
  if (this._value == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._value);
    this._value_ = value;
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
tutao.entity.tutanota.ContactFormEncryptedStatisticsField.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
