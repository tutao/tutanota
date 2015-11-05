"use strict";

tutao.provide('tutao.entity.sys.SendRegistrationCodeReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SendRegistrationCodeReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._authToken = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SendRegistrationCodeReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SendRegistrationCodeReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._authToken = data.authToken;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SendRegistrationCodeReturn.MODEL_VERSION = '12';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SendRegistrationCodeReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SendRegistrationCodeReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    authToken: this._authToken
  };
};

/**
 * The id of the SendRegistrationCodeReturn type.
 */
tutao.entity.sys.SendRegistrationCodeReturn.prototype.TYPE_ID = 347;

/**
 * The id of the authToken attribute.
 */
tutao.entity.sys.SendRegistrationCodeReturn.prototype.AUTHTOKEN_ATTRIBUTE_ID = 349;

/**
 * Sets the format of this SendRegistrationCodeReturn.
 * @param {string} format The format of this SendRegistrationCodeReturn.
 */
tutao.entity.sys.SendRegistrationCodeReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SendRegistrationCodeReturn.
 * @return {string} The format of this SendRegistrationCodeReturn.
 */
tutao.entity.sys.SendRegistrationCodeReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the authToken of this SendRegistrationCodeReturn.
 * @param {string} authToken The authToken of this SendRegistrationCodeReturn.
 */
tutao.entity.sys.SendRegistrationCodeReturn.prototype.setAuthToken = function(authToken) {
  this._authToken = authToken;
  return this;
};

/**
 * Provides the authToken of this SendRegistrationCodeReturn.
 * @return {string} The authToken of this SendRegistrationCodeReturn.
 */
tutao.entity.sys.SendRegistrationCodeReturn.prototype.getAuthToken = function() {
  return this._authToken;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.SendRegistrationCodeReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
