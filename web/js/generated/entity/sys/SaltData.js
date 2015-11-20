"use strict";

tutao.provide('tutao.entity.sys.SaltData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SaltData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._mailAddress = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SaltData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SaltData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._mailAddress = data.mailAddress;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SaltData.MODEL_VERSION = '13';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SaltData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SaltData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    mailAddress: this._mailAddress
  };
};

/**
 * The id of the SaltData type.
 */
tutao.entity.sys.SaltData.prototype.TYPE_ID = 417;

/**
 * The id of the mailAddress attribute.
 */
tutao.entity.sys.SaltData.prototype.MAILADDRESS_ATTRIBUTE_ID = 419;

/**
 * Sets the format of this SaltData.
 * @param {string} format The format of this SaltData.
 */
tutao.entity.sys.SaltData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SaltData.
 * @return {string} The format of this SaltData.
 */
tutao.entity.sys.SaltData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the mailAddress of this SaltData.
 * @param {string} mailAddress The mailAddress of this SaltData.
 */
tutao.entity.sys.SaltData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this SaltData.
 * @return {string} The mailAddress of this SaltData.
 */
tutao.entity.sys.SaltData.prototype.getMailAddress = function() {
  return this._mailAddress;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.SaltData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
