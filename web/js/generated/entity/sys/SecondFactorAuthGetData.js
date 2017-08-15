"use strict";

tutao.provide('tutao.entity.sys.SecondFactorAuthGetData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactorAuthGetData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._accessToken = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SecondFactorAuthGetData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactorAuthGetData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._accessToken = data.accessToken;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SecondFactorAuthGetData.MODEL_VERSION = '23';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SecondFactorAuthGetData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SecondFactorAuthGetData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    accessToken: this._accessToken
  };
};

/**
 * Sets the format of this SecondFactorAuthGetData.
 * @param {string} format The format of this SecondFactorAuthGetData.
 */
tutao.entity.sys.SecondFactorAuthGetData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SecondFactorAuthGetData.
 * @return {string} The format of this SecondFactorAuthGetData.
 */
tutao.entity.sys.SecondFactorAuthGetData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the accessToken of this SecondFactorAuthGetData.
 * @param {string} accessToken The accessToken of this SecondFactorAuthGetData.
 */
tutao.entity.sys.SecondFactorAuthGetData.prototype.setAccessToken = function(accessToken) {
  this._accessToken = accessToken;
  return this;
};

/**
 * Provides the accessToken of this SecondFactorAuthGetData.
 * @return {string} The accessToken of this SecondFactorAuthGetData.
 */
tutao.entity.sys.SecondFactorAuthGetData.prototype.getAccessToken = function() {
  return this._accessToken;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.SecondFactorAuthGetData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
