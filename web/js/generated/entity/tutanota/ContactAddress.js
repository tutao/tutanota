"use strict";

tutao.provide('tutao.entity.tutanota.ContactAddress');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactAddress = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._address = null;
    this._customTypeName = null;
    this._type = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ContactAddress.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactAddress.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._address = data.address;
  this._customTypeName = data.customTypeName;
  this._type = data.type;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactAddress.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    address: this._address, 
    customTypeName: this._customTypeName, 
    type: this._type
  };
};

/**
 * The id of the ContactAddress type.
 */
tutao.entity.tutanota.ContactAddress.prototype.TYPE_ID = 54;

/**
 * The id of the address attribute.
 */
tutao.entity.tutanota.ContactAddress.prototype.ADDRESS_ATTRIBUTE_ID = 57;

/**
 * The id of the customTypeName attribute.
 */
tutao.entity.tutanota.ContactAddress.prototype.CUSTOMTYPENAME_ATTRIBUTE_ID = 58;

/**
 * The id of the type attribute.
 */
tutao.entity.tutanota.ContactAddress.prototype.TYPE_ATTRIBUTE_ID = 56;

/**
 * Sets the id of this ContactAddress.
 * @param {string} id The id of this ContactAddress.
 */
tutao.entity.tutanota.ContactAddress.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ContactAddress.
 * @return {string} The id of this ContactAddress.
 */
tutao.entity.tutanota.ContactAddress.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the address of this ContactAddress.
 * @param {string} address The address of this ContactAddress.
 */
tutao.entity.tutanota.ContactAddress.prototype.setAddress = function(address) {
  var dataToEncrypt = address;
  this._address = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the address of this ContactAddress.
 * @return {string} The address of this ContactAddress.
 */
tutao.entity.tutanota.ContactAddress.prototype.getAddress = function() {
  if (this._address == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._address);
  return value;
};

/**
 * Sets the customTypeName of this ContactAddress.
 * @param {string} customTypeName The customTypeName of this ContactAddress.
 */
tutao.entity.tutanota.ContactAddress.prototype.setCustomTypeName = function(customTypeName) {
  var dataToEncrypt = customTypeName;
  this._customTypeName = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the customTypeName of this ContactAddress.
 * @return {string} The customTypeName of this ContactAddress.
 */
tutao.entity.tutanota.ContactAddress.prototype.getCustomTypeName = function() {
  if (this._customTypeName == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._customTypeName);
  return value;
};

/**
 * Sets the type of this ContactAddress.
 * @param {string} type The type of this ContactAddress.
 */
tutao.entity.tutanota.ContactAddress.prototype.setType = function(type) {
  var dataToEncrypt = type;
  this._type = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the type of this ContactAddress.
 * @return {string} The type of this ContactAddress.
 */
tutao.entity.tutanota.ContactAddress.prototype.getType = function() {
  if (this._type == "") {
    return "0";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._type);
  return value;
};
