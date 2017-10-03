"use strict";

tutao.provide('tutao.entity.sys.UserIdData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserIdData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._mailAddress = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.UserIdData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserIdData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._mailAddress = data.mailAddress;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.UserIdData.MODEL_VERSION = '20';

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
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.UserIdData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
