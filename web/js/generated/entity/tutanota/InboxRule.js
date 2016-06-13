"use strict";

tutao.provide('tutao.entity.tutanota.InboxRule');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.InboxRule = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._type = null;
    this._type_ = null;
    this._value = null;
    this._value_ = null;
    this._targetFolder = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.InboxRule.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.InboxRule.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._type = data.type;
  this._type_ = null;
  this._value = data.value;
  this._value_ = null;
  this._targetFolder = data.targetFolder;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.InboxRule.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    type: this._type, 
    value: this._value, 
    targetFolder: this._targetFolder
  };
};

/**
 * Sets the id of this InboxRule.
 * @param {string} id The id of this InboxRule.
 */
tutao.entity.tutanota.InboxRule.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this InboxRule.
 * @return {string} The id of this InboxRule.
 */
tutao.entity.tutanota.InboxRule.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the type of this InboxRule.
 * @param {string} type The type of this InboxRule.
 */
tutao.entity.tutanota.InboxRule.prototype.setType = function(type) {
  var dataToEncrypt = type;
  this._type = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._type_ = type;
  return this;
};

/**
 * Provides the type of this InboxRule.
 * @return {string} The type of this InboxRule.
 */
tutao.entity.tutanota.InboxRule.prototype.getType = function() {
  if (this._type_ != null) {
    return this._type_;
  }
  if (this._type == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._type);
    this._type_ = value;
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
 * Sets the value of this InboxRule.
 * @param {string} value The value of this InboxRule.
 */
tutao.entity.tutanota.InboxRule.prototype.setValue = function(value) {
  var dataToEncrypt = value;
  this._value = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._value_ = value;
  return this;
};

/**
 * Provides the value of this InboxRule.
 * @return {string} The value of this InboxRule.
 */
tutao.entity.tutanota.InboxRule.prototype.getValue = function() {
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
 * Sets the targetFolder of this InboxRule.
 * @param {Array.<string>} targetFolder The targetFolder of this InboxRule.
 */
tutao.entity.tutanota.InboxRule.prototype.setTargetFolder = function(targetFolder) {
  this._targetFolder = targetFolder;
  return this;
};

/**
 * Provides the targetFolder of this InboxRule.
 * @return {Array.<string>} The targetFolder of this InboxRule.
 */
tutao.entity.tutanota.InboxRule.prototype.getTargetFolder = function() {
  return this._targetFolder;
};

/**
 * Loads the targetFolder of this InboxRule.
 * @return {Promise.<tutao.entity.tutanota.MailFolder>} Resolves to the loaded targetFolder of this InboxRule or an exception if the loading failed.
 */
tutao.entity.tutanota.InboxRule.prototype.loadTargetFolder = function() {
  return tutao.entity.tutanota.MailFolder.load(this._targetFolder);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.InboxRule.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
