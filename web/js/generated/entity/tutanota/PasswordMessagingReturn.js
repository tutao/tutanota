"use strict";

tutao.provide('tutao.entity.tutanota.PasswordMessagingReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.PasswordMessagingReturn = function(data) {
  if (data) {
    this.__format = data._format;
    this._autoAuthenticationId = data.autoAuthenticationId;
  } else {
    this.__format = "0";
    this._autoAuthenticationId = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.PasswordMessagingReturn.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.PasswordMessagingReturn.MODEL_VERSION = '6';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.PasswordMessagingReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.PasswordMessagingReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    autoAuthenticationId: this._autoAuthenticationId
  };
};

/**
 * The id of the PasswordMessagingReturn type.
 */
tutao.entity.tutanota.PasswordMessagingReturn.prototype.TYPE_ID = 313;

/**
 * The id of the autoAuthenticationId attribute.
 */
tutao.entity.tutanota.PasswordMessagingReturn.prototype.AUTOAUTHENTICATIONID_ATTRIBUTE_ID = 315;

/**
 * Sets the format of this PasswordMessagingReturn.
 * @param {string} format The format of this PasswordMessagingReturn.
 */
tutao.entity.tutanota.PasswordMessagingReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PasswordMessagingReturn.
 * @return {string} The format of this PasswordMessagingReturn.
 */
tutao.entity.tutanota.PasswordMessagingReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the autoAuthenticationId of this PasswordMessagingReturn.
 * @param {string} autoAuthenticationId The autoAuthenticationId of this PasswordMessagingReturn.
 */
tutao.entity.tutanota.PasswordMessagingReturn.prototype.setAutoAuthenticationId = function(autoAuthenticationId) {
  this._autoAuthenticationId = autoAuthenticationId;
  return this;
};

/**
 * Provides the autoAuthenticationId of this PasswordMessagingReturn.
 * @return {string} The autoAuthenticationId of this PasswordMessagingReturn.
 */
tutao.entity.tutanota.PasswordMessagingReturn.prototype.getAutoAuthenticationId = function() {
  return this._autoAuthenticationId;
};
