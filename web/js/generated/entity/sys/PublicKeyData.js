"use strict";

tutao.provide('tutao.entity.sys.PublicKeyData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PublicKeyData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._mailAddress = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PublicKeyData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PublicKeyData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._mailAddress = data.mailAddress;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PublicKeyData.MODEL_VERSION = '7';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PublicKeyData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PublicKeyData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    mailAddress: this._mailAddress
  };
};

/**
 * The id of the PublicKeyData type.
 */
tutao.entity.sys.PublicKeyData.prototype.TYPE_ID = 409;

/**
 * The id of the mailAddress attribute.
 */
tutao.entity.sys.PublicKeyData.prototype.MAILADDRESS_ATTRIBUTE_ID = 411;

/**
 * Sets the format of this PublicKeyData.
 * @param {string} format The format of this PublicKeyData.
 */
tutao.entity.sys.PublicKeyData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PublicKeyData.
 * @return {string} The format of this PublicKeyData.
 */
tutao.entity.sys.PublicKeyData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the mailAddress of this PublicKeyData.
 * @param {string} mailAddress The mailAddress of this PublicKeyData.
 */
tutao.entity.sys.PublicKeyData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this PublicKeyData.
 * @return {string} The mailAddress of this PublicKeyData.
 */
tutao.entity.sys.PublicKeyData.prototype.getMailAddress = function() {
  return this._mailAddress;
};
