"use strict";

tutao.provide('tutao.entity.tutanota.ContactMailAddress');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactMailAddress = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._address = null;
    this._customTypeName = null;
    this._type = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ContactMailAddress.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._address = data.address;
  this._customTypeName = data.customTypeName;
  this._type = data.type;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    address: this._address, 
    customTypeName: this._customTypeName, 
    type: this._type
  };
};

/**
 * The id of the ContactMailAddress type.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.TYPE_ID = 44;

/**
 * The id of the address attribute.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.ADDRESS_ATTRIBUTE_ID = 47;

/**
 * The id of the customTypeName attribute.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.CUSTOMTYPENAME_ATTRIBUTE_ID = 48;

/**
 * The id of the type attribute.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.TYPE_ATTRIBUTE_ID = 46;

/**
 * Sets the id of this ContactMailAddress.
 * @param {string} id The id of this ContactMailAddress.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ContactMailAddress.
 * @return {string} The id of this ContactMailAddress.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the address of this ContactMailAddress.
 * @param {string} address The address of this ContactMailAddress.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.setAddress = function(address) {
  var dataToEncrypt = address;
  this._address = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the address of this ContactMailAddress.
 * @return {string} The address of this ContactMailAddress.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.getAddress = function() {
  if (this._address == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._address);
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
 * Sets the customTypeName of this ContactMailAddress.
 * @param {string} customTypeName The customTypeName of this ContactMailAddress.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.setCustomTypeName = function(customTypeName) {
  var dataToEncrypt = customTypeName;
  this._customTypeName = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the customTypeName of this ContactMailAddress.
 * @return {string} The customTypeName of this ContactMailAddress.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.getCustomTypeName = function() {
  if (this._customTypeName == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._customTypeName);
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
 * Sets the type of this ContactMailAddress.
 * @param {string} type The type of this ContactMailAddress.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.setType = function(type) {
  var dataToEncrypt = type;
  this._type = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the type of this ContactMailAddress.
 * @return {string} The type of this ContactMailAddress.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.getType = function() {
  if (this._type == "" || !this._parent._entityHelper.getSessionKey()) {
    return "0";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._type);
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "0";
    } else {
      throw e;
    }
  }
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ContactMailAddress.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
