"use strict";

tutao.provide('tutao.entity.sys.AutoLoginDataGet');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AutoLoginDataGet = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._deviceToken = null;
    this._userId = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.AutoLoginDataGet.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AutoLoginDataGet.prototype.updateData = function(data) {
  this.__format = data._format;
  this._deviceToken = data.deviceToken;
  this._userId = data.userId;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.AutoLoginDataGet.MODEL_VERSION = '17';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.AutoLoginDataGet.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.AutoLoginDataGet.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    deviceToken: this._deviceToken, 
    userId: this._userId
  };
};

/**
 * Sets the format of this AutoLoginDataGet.
 * @param {string} format The format of this AutoLoginDataGet.
 */
tutao.entity.sys.AutoLoginDataGet.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this AutoLoginDataGet.
 * @return {string} The format of this AutoLoginDataGet.
 */
tutao.entity.sys.AutoLoginDataGet.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the deviceToken of this AutoLoginDataGet.
 * @param {string} deviceToken The deviceToken of this AutoLoginDataGet.
 */
tutao.entity.sys.AutoLoginDataGet.prototype.setDeviceToken = function(deviceToken) {
  this._deviceToken = deviceToken;
  return this;
};

/**
 * Provides the deviceToken of this AutoLoginDataGet.
 * @return {string} The deviceToken of this AutoLoginDataGet.
 */
tutao.entity.sys.AutoLoginDataGet.prototype.getDeviceToken = function() {
  return this._deviceToken;
};

/**
 * Sets the userId of this AutoLoginDataGet.
 * @param {string} userId The userId of this AutoLoginDataGet.
 */
tutao.entity.sys.AutoLoginDataGet.prototype.setUserId = function(userId) {
  this._userId = userId;
  return this;
};

/**
 * Provides the userId of this AutoLoginDataGet.
 * @return {string} The userId of this AutoLoginDataGet.
 */
tutao.entity.sys.AutoLoginDataGet.prototype.getUserId = function() {
  return this._userId;
};

/**
 * Loads the userId of this AutoLoginDataGet.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded userId of this AutoLoginDataGet or an exception if the loading failed.
 */
tutao.entity.sys.AutoLoginDataGet.prototype.loadUserId = function() {
  return tutao.entity.sys.User.load(this._userId);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.AutoLoginDataGet.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
