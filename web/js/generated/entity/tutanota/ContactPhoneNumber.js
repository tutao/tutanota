"use strict";

tutao.provide('tutao.entity.tutanota.ContactPhoneNumber');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactPhoneNumber = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._customTypeName = null;
    this._customTypeName_ = null;
    this._number = null;
    this._number_ = null;
    this._type = null;
    this._type_ = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ContactPhoneNumber.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._customTypeName = data.customTypeName;
  this._customTypeName_ = null;
  this._number = data.number;
  this._number_ = null;
  this._type = data.type;
  this._type_ = null;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    customTypeName: this._customTypeName, 
    number: this._number, 
    type: this._type
  };
};

/**
 * The id of the ContactPhoneNumber type.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.TYPE_ID = 49;

/**
 * The id of the customTypeName attribute.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.CUSTOMTYPENAME_ATTRIBUTE_ID = 53;

/**
 * The id of the number attribute.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.NUMBER_ATTRIBUTE_ID = 52;

/**
 * The id of the type attribute.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.TYPE_ATTRIBUTE_ID = 51;

/**
 * Sets the id of this ContactPhoneNumber.
 * @param {string} id The id of this ContactPhoneNumber.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ContactPhoneNumber.
 * @return {string} The id of this ContactPhoneNumber.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the customTypeName of this ContactPhoneNumber.
 * @param {string} customTypeName The customTypeName of this ContactPhoneNumber.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.setCustomTypeName = function(customTypeName) {
  var dataToEncrypt = customTypeName;
  this._customTypeName = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._customTypeName_ = customTypeName;
  return this;
};

/**
 * Provides the customTypeName of this ContactPhoneNumber.
 * @return {string} The customTypeName of this ContactPhoneNumber.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.getCustomTypeName = function() {
  if (this._customTypeName_ != null) {
    return this._customTypeName_;
  }
  if (this._customTypeName == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._customTypeName);
    this._customTypeName_ = value;
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
 * Sets the number of this ContactPhoneNumber.
 * @param {string} number The number of this ContactPhoneNumber.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.setNumber = function(number) {
  var dataToEncrypt = number;
  this._number = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._number_ = number;
  return this;
};

/**
 * Provides the number of this ContactPhoneNumber.
 * @return {string} The number of this ContactPhoneNumber.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.getNumber = function() {
  if (this._number_ != null) {
    return this._number_;
  }
  if (this._number == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._number);
    this._number_ = value;
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
 * Sets the type of this ContactPhoneNumber.
 * @param {string} type The type of this ContactPhoneNumber.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.setType = function(type) {
  var dataToEncrypt = type;
  this._type = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._type_ = type;
  return this;
};

/**
 * Provides the type of this ContactPhoneNumber.
 * @return {string} The type of this ContactPhoneNumber.
 */
tutao.entity.tutanota.ContactPhoneNumber.prototype.getType = function() {
  if (this._type_ != null) {
    return this._type_;
  }
  if (this._type == "" || !this._parent._entityHelper.getSessionKey()) {
    return "0";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._type);
    this._type_ = value;
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
tutao.entity.tutanota.ContactPhoneNumber.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
