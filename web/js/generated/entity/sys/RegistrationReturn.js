"use strict";

tutao.provide('tutao.entity.sys.RegistrationReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._authToken = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.RegistrationReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._authToken = data.authToken;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.RegistrationReturn.MODEL_VERSION = '23';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.RegistrationReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.RegistrationReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    authToken: this._authToken
  };
};

/**
 * Sets the format of this RegistrationReturn.
 * @param {string} format The format of this RegistrationReturn.
 */
tutao.entity.sys.RegistrationReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this RegistrationReturn.
 * @return {string} The format of this RegistrationReturn.
 */
tutao.entity.sys.RegistrationReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the authToken of this RegistrationReturn.
 * @param {string} authToken The authToken of this RegistrationReturn.
 */
tutao.entity.sys.RegistrationReturn.prototype.setAuthToken = function(authToken) {
  this._authToken = authToken;
  return this;
};

/**
 * Provides the authToken of this RegistrationReturn.
 * @return {string} The authToken of this RegistrationReturn.
 */
tutao.entity.sys.RegistrationReturn.prototype.getAuthToken = function() {
  return this._authToken;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.RegistrationReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
