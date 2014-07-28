"use strict";

goog.provide('tutao.entity.tutanotaencrypted.MailAddress');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaencrypted.MailAddress = function(parent, data) {
  if (data) {
    this.__id = data._id;
    this._address = data.address;
    this._name = data.name;
    this._contact = data.contact;
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._address = null;
    this._name = null;
    this._contact = null;
  };
  this._parent = parent;
  this.prototype = tutao.entity.tutanotaencrypted.MailAddress.prototype;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    address: this._address, 
    name: this._name, 
    contact: this._contact
  };
};

/**
 * The id of the MailAddress type.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.TYPE_ID = 27;

/**
 * The id of the address attribute.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.ADDRESS_ATTRIBUTE_ID = 30;

/**
 * The id of the name attribute.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.NAME_ATTRIBUTE_ID = 29;

/**
 * The id of the contact attribute.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.CONTACT_ATTRIBUTE_ID = 31;

/**
 * Sets the id of this MailAddress.
 * @param {string} id The id of this MailAddress.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this MailAddress.
 * @return {string} The id of this MailAddress.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the address of this MailAddress.
 * @param {string} address The address of this MailAddress.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.setAddress = function(address) {
  this._address = address;
  return this;
};

/**
 * Provides the address of this MailAddress.
 * @return {string} The address of this MailAddress.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.getAddress = function() {
  return this._address;
};

/**
 * Sets the name of this MailAddress.
 * @param {string} name The name of this MailAddress.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.setName = function(name) {
  var dataToEncrypt = name;
  this._name = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the name of this MailAddress.
 * @return {string} The name of this MailAddress.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.getName = function() {
  if (this._name == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._name);
  return value;
};

/**
 * Sets the contact of this MailAddress.
 * @param {string} contact The contact of this MailAddress.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.setContact = function(contact) {
  this._contact = contact;
  return this;
};

/**
 * Provides the contact of this MailAddress.
 * @return {string} The contact of this MailAddress.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.getContact = function() {
  return this._contact;
};

/**
 * Loads the contact of this MailAddress.
 * @return {Promise.<tutao.entity.tutanotaencrypted.Contact>} Resolves to the loaded contact of this MailAddress or an exception if the loading failed.
 */
tutao.entity.tutanotaencrypted.MailAddress.prototype.loadContact = function() {
  return tutao.entity.tutanotaencrypted.Contact.load(this._contact);
};
