"use strict";

tutao.provide('tutao.entity.sys.UserIdData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserIdData = function(data) {
  if (data) {
    this.__format = data._format;
    this._mailAddress = data.mailAddress;
  } else {
    this.__format = "0";
    this._mailAddress = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.UserIdData.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.UserIdData.MODEL_VERSION = '7';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.UserIdData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.UserIdData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    mailAddress: this._mailAddress
  };
};

/**
 * The id of the UserIdData type.
 */
tutao.entity.sys.UserIdData.prototype.TYPE_ID = 424;

/**
 * The id of the mailAddress attribute.
 */
tutao.entity.sys.UserIdData.prototype.MAILADDRESS_ATTRIBUTE_ID = 426;

/**
 * Sets the format of this UserIdData.
 * @param {string} format The format of this UserIdData.
 */
tutao.entity.sys.UserIdData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this UserIdData.
 * @return {string} The format of this UserIdData.
 */
tutao.entity.sys.UserIdData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the mailAddress of this UserIdData.
 * @param {string} mailAddress The mailAddress of this UserIdData.
 */
tutao.entity.sys.UserIdData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this UserIdData.
 * @return {string} The mailAddress of this UserIdData.
 */
tutao.entity.sys.UserIdData.prototype.getMailAddress = function() {
  return this._mailAddress;
};
