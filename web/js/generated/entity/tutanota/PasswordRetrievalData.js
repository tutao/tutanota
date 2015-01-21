"use strict";

tutao.provide('tutao.entity.tutanota.PasswordRetrievalData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.PasswordRetrievalData = function(data) {
  if (data) {
    this.__format = data._format;
    this._autoAuthenticationId = data.autoAuthenticationId;
  } else {
    this.__format = "0";
    this._autoAuthenticationId = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.PasswordRetrievalData.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.PasswordRetrievalData.MODEL_VERSION = '7';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.PasswordRetrievalData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.PasswordRetrievalData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    autoAuthenticationId: this._autoAuthenticationId
  };
};

/**
 * The id of the PasswordRetrievalData type.
 */
tutao.entity.tutanota.PasswordRetrievalData.prototype.TYPE_ID = 320;

/**
 * The id of the autoAuthenticationId attribute.
 */
tutao.entity.tutanota.PasswordRetrievalData.prototype.AUTOAUTHENTICATIONID_ATTRIBUTE_ID = 322;

/**
 * Sets the format of this PasswordRetrievalData.
 * @param {string} format The format of this PasswordRetrievalData.
 */
tutao.entity.tutanota.PasswordRetrievalData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PasswordRetrievalData.
 * @return {string} The format of this PasswordRetrievalData.
 */
tutao.entity.tutanota.PasswordRetrievalData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the autoAuthenticationId of this PasswordRetrievalData.
 * @param {string} autoAuthenticationId The autoAuthenticationId of this PasswordRetrievalData.
 */
tutao.entity.tutanota.PasswordRetrievalData.prototype.setAutoAuthenticationId = function(autoAuthenticationId) {
  this._autoAuthenticationId = autoAuthenticationId;
  return this;
};

/**
 * Provides the autoAuthenticationId of this PasswordRetrievalData.
 * @return {string} The autoAuthenticationId of this PasswordRetrievalData.
 */
tutao.entity.tutanota.PasswordRetrievalData.prototype.getAutoAuthenticationId = function() {
  return this._autoAuthenticationId;
};
