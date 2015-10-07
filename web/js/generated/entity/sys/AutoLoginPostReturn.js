"use strict";

tutao.provide('tutao.entity.sys.AutoLoginPostReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AutoLoginPostReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._deviceToken = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.AutoLoginPostReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AutoLoginPostReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._deviceToken = data.deviceToken;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.AutoLoginPostReturn.MODEL_VERSION = '11';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.AutoLoginPostReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.AutoLoginPostReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    deviceToken: this._deviceToken
  };
};

/**
 * The id of the AutoLoginPostReturn type.
 */
tutao.entity.sys.AutoLoginPostReturn.prototype.TYPE_ID = 441;

/**
 * The id of the deviceToken attribute.
 */
tutao.entity.sys.AutoLoginPostReturn.prototype.DEVICETOKEN_ATTRIBUTE_ID = 443;

/**
 * Sets the format of this AutoLoginPostReturn.
 * @param {string} format The format of this AutoLoginPostReturn.
 */
tutao.entity.sys.AutoLoginPostReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this AutoLoginPostReturn.
 * @return {string} The format of this AutoLoginPostReturn.
 */
tutao.entity.sys.AutoLoginPostReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the deviceToken of this AutoLoginPostReturn.
 * @param {string} deviceToken The deviceToken of this AutoLoginPostReturn.
 */
tutao.entity.sys.AutoLoginPostReturn.prototype.setDeviceToken = function(deviceToken) {
  this._deviceToken = deviceToken;
  return this;
};

/**
 * Provides the deviceToken of this AutoLoginPostReturn.
 * @return {string} The deviceToken of this AutoLoginPostReturn.
 */
tutao.entity.sys.AutoLoginPostReturn.prototype.getDeviceToken = function() {
  return this._deviceToken;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.AutoLoginPostReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
