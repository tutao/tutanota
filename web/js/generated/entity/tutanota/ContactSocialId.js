"use strict";

tutao.provide('tutao.entity.tutanota.ContactSocialId');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactSocialId = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._customTypeName = null;
    this._socialId = null;
    this._type = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ContactSocialId.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactSocialId.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._customTypeName = data.customTypeName;
  this._socialId = data.socialId;
  this._type = data.type;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactSocialId.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    customTypeName: this._customTypeName, 
    socialId: this._socialId, 
    type: this._type
  };
};

/**
 * The id of the ContactSocialId type.
 */
tutao.entity.tutanota.ContactSocialId.prototype.TYPE_ID = 59;

/**
 * The id of the customTypeName attribute.
 */
tutao.entity.tutanota.ContactSocialId.prototype.CUSTOMTYPENAME_ATTRIBUTE_ID = 63;

/**
 * The id of the socialId attribute.
 */
tutao.entity.tutanota.ContactSocialId.prototype.SOCIALID_ATTRIBUTE_ID = 62;

/**
 * The id of the type attribute.
 */
tutao.entity.tutanota.ContactSocialId.prototype.TYPE_ATTRIBUTE_ID = 61;

/**
 * Sets the id of this ContactSocialId.
 * @param {string} id The id of this ContactSocialId.
 */
tutao.entity.tutanota.ContactSocialId.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ContactSocialId.
 * @return {string} The id of this ContactSocialId.
 */
tutao.entity.tutanota.ContactSocialId.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the customTypeName of this ContactSocialId.
 * @param {string} customTypeName The customTypeName of this ContactSocialId.
 */
tutao.entity.tutanota.ContactSocialId.prototype.setCustomTypeName = function(customTypeName) {
  var dataToEncrypt = customTypeName;
  this._customTypeName = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the customTypeName of this ContactSocialId.
 * @return {string} The customTypeName of this ContactSocialId.
 */
tutao.entity.tutanota.ContactSocialId.prototype.getCustomTypeName = function() {
  if (this._customTypeName == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._customTypeName);
  return value;
};

/**
 * Sets the socialId of this ContactSocialId.
 * @param {string} socialId The socialId of this ContactSocialId.
 */
tutao.entity.tutanota.ContactSocialId.prototype.setSocialId = function(socialId) {
  var dataToEncrypt = socialId;
  this._socialId = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the socialId of this ContactSocialId.
 * @return {string} The socialId of this ContactSocialId.
 */
tutao.entity.tutanota.ContactSocialId.prototype.getSocialId = function() {
  if (this._socialId == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._socialId);
  return value;
};

/**
 * Sets the type of this ContactSocialId.
 * @param {string} type The type of this ContactSocialId.
 */
tutao.entity.tutanota.ContactSocialId.prototype.setType = function(type) {
  var dataToEncrypt = type;
  this._type = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the type of this ContactSocialId.
 * @return {string} The type of this ContactSocialId.
 */
tutao.entity.tutanota.ContactSocialId.prototype.getType = function() {
  if (this._type == "") {
    return "0";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._type);
  return value;
};
