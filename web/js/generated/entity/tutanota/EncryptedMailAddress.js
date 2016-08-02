"use strict";

tutao.provide('tutao.entity.tutanota.EncryptedMailAddress');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.EncryptedMailAddress = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._address = null;
    this._address_ = null;
    this._name = null;
    this._name_ = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.EncryptedMailAddress.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.EncryptedMailAddress.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._address = data.address;
  this._address_ = null;
  this._name = data.name;
  this._name_ = null;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.EncryptedMailAddress.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    address: this._address, 
    name: this._name
  };
};

/**
 * Sets the id of this EncryptedMailAddress.
 * @param {string} id The id of this EncryptedMailAddress.
 */
tutao.entity.tutanota.EncryptedMailAddress.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this EncryptedMailAddress.
 * @return {string} The id of this EncryptedMailAddress.
 */
tutao.entity.tutanota.EncryptedMailAddress.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the address of this EncryptedMailAddress.
 * @param {string} address The address of this EncryptedMailAddress.
 */
tutao.entity.tutanota.EncryptedMailAddress.prototype.setAddress = function(address) {
  var dataToEncrypt = address;
  this._address = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._address_ = address;
  return this;
};

/**
 * Provides the address of this EncryptedMailAddress.
 * @return {string} The address of this EncryptedMailAddress.
 */
tutao.entity.tutanota.EncryptedMailAddress.prototype.getAddress = function() {
  if (this._address_ != null) {
    return this._address_;
  }
  if (this._address == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._address);
    this._address_ = value;
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
 * Sets the name of this EncryptedMailAddress.
 * @param {string} name The name of this EncryptedMailAddress.
 */
tutao.entity.tutanota.EncryptedMailAddress.prototype.setName = function(name) {
  var dataToEncrypt = name;
  this._name = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._name_ = name;
  return this;
};

/**
 * Provides the name of this EncryptedMailAddress.
 * @return {string} The name of this EncryptedMailAddress.
 */
tutao.entity.tutanota.EncryptedMailAddress.prototype.getName = function() {
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
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.EncryptedMailAddress.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
