"use strict";

tutao.provide('tutao.entity.sys.SecondFactorAuthAllowedReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._allowed = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SecondFactorAuthAllowedReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._allowed = data.allowed;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn.PATH = '/rest/sys/secondfactorauthallowedservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    allowed: this._allowed
  };
};

/**
 * Sets the format of this SecondFactorAuthAllowedReturn.
 * @param {string} format The format of this SecondFactorAuthAllowedReturn.
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SecondFactorAuthAllowedReturn.
 * @return {string} The format of this SecondFactorAuthAllowedReturn.
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the allowed of this SecondFactorAuthAllowedReturn.
 * @param {boolean} allowed The allowed of this SecondFactorAuthAllowedReturn.
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn.prototype.setAllowed = function(allowed) {
  this._allowed = allowed ? '1' : '0';
  return this;
};

/**
 * Provides the allowed of this SecondFactorAuthAllowedReturn.
 * @return {boolean} The allowed of this SecondFactorAuthAllowedReturn.
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn.prototype.getAllowed = function() {
  return this._allowed != '0';
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.SecondFactorAuthAllowedReturn>} Resolves to SecondFactorAuthAllowedReturn or an exception if the loading failed.
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.SecondFactorAuthAllowedReturn, tutao.entity.sys.SecondFactorAuthAllowedReturn.PATH, null, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.SecondFactorAuthAllowedReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
