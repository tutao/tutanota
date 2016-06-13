"use strict";

tutao.provide('tutao.entity.tutanota.MailAddress');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailAddress = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._address = null;
    this._name = null;
    this._name_ = null;
    this._contact = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.MailAddress.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailAddress.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._address = data.address;
  this._name = data.name;
  this._name_ = null;
  this._contact = data.contact;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MailAddress.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    address: this._address, 
    name: this._name, 
    contact: this._contact
  };
};

/**
 * Sets the id of this MailAddress.
 * @param {string} id The id of this MailAddress.
 */
tutao.entity.tutanota.MailAddress.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this MailAddress.
 * @return {string} The id of this MailAddress.
 */
tutao.entity.tutanota.MailAddress.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the address of this MailAddress.
 * @param {string} address The address of this MailAddress.
 */
tutao.entity.tutanota.MailAddress.prototype.setAddress = function(address) {
  this._address = address;
  return this;
};

/**
 * Provides the address of this MailAddress.
 * @return {string} The address of this MailAddress.
 */
tutao.entity.tutanota.MailAddress.prototype.getAddress = function() {
  return this._address;
};

/**
 * Sets the name of this MailAddress.
 * @param {string} name The name of this MailAddress.
 */
tutao.entity.tutanota.MailAddress.prototype.setName = function(name) {
  var dataToEncrypt = name;
  this._name = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._name_ = name;
  return this;
};

/**
 * Provides the name of this MailAddress.
 * @return {string} The name of this MailAddress.
 */
tutao.entity.tutanota.MailAddress.prototype.getName = function() {
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
 * Sets the contact of this MailAddress.
 * @param {Array.<string>} contact The contact of this MailAddress.
 */
tutao.entity.tutanota.MailAddress.prototype.setContact = function(contact) {
  this._contact = contact;
  return this;
};

/**
 * Provides the contact of this MailAddress.
 * @return {Array.<string>} The contact of this MailAddress.
 */
tutao.entity.tutanota.MailAddress.prototype.getContact = function() {
  return this._contact;
};

/**
 * Loads the contact of this MailAddress.
 * @return {Promise.<tutao.entity.tutanota.Contact>} Resolves to the loaded contact of this MailAddress or an exception if the loading failed.
 */
tutao.entity.tutanota.MailAddress.prototype.loadContact = function() {
  return tutao.entity.tutanota.Contact.load(this._contact);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MailAddress.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
