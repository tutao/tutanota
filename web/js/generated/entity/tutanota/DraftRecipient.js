"use strict";

tutao.provide('tutao.entity.tutanota.DraftRecipient');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftRecipient = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._mailAddress = null;
    this._name = null;
    this._name_ = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.DraftRecipient.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftRecipient.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._mailAddress = data.mailAddress;
  this._name = data.name;
  this._name_ = null;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DraftRecipient.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    mailAddress: this._mailAddress, 
    name: this._name
  };
};

/**
 * Sets the id of this DraftRecipient.
 * @param {string} id The id of this DraftRecipient.
 */
tutao.entity.tutanota.DraftRecipient.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this DraftRecipient.
 * @return {string} The id of this DraftRecipient.
 */
tutao.entity.tutanota.DraftRecipient.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the mailAddress of this DraftRecipient.
 * @param {string} mailAddress The mailAddress of this DraftRecipient.
 */
tutao.entity.tutanota.DraftRecipient.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this DraftRecipient.
 * @return {string} The mailAddress of this DraftRecipient.
 */
tutao.entity.tutanota.DraftRecipient.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the name of this DraftRecipient.
 * @param {string} name The name of this DraftRecipient.
 */
tutao.entity.tutanota.DraftRecipient.prototype.setName = function(name) {
  var dataToEncrypt = name;
  this._name = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._name_ = name;
  return this;
};

/**
 * Provides the name of this DraftRecipient.
 * @return {string} The name of this DraftRecipient.
 */
tutao.entity.tutanota.DraftRecipient.prototype.getName = function() {
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
tutao.entity.tutanota.DraftRecipient.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
