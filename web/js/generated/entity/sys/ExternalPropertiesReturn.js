"use strict";

tutao.provide('tutao.entity.sys.ExternalPropertiesReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ExternalPropertiesReturn = function(data) {
  if (data) {
    this.__format = data._format;
    this._accountType = data.accountType;
    this._message = data.message;
  } else {
    this.__format = "0";
    this._accountType = null;
    this._message = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.ExternalPropertiesReturn.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.ExternalPropertiesReturn.MODEL_VERSION = '7';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.ExternalPropertiesReturn.PATH = '/rest/sys/externalpropertiesservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    accountType: this._accountType, 
    message: this._message
  };
};

/**
 * The id of the ExternalPropertiesReturn type.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.TYPE_ID = 663;

/**
 * The id of the accountType attribute.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.ACCOUNTTYPE_ATTRIBUTE_ID = 666;

/**
 * The id of the message attribute.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.MESSAGE_ATTRIBUTE_ID = 665;

/**
 * Sets the format of this ExternalPropertiesReturn.
 * @param {string} format The format of this ExternalPropertiesReturn.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ExternalPropertiesReturn.
 * @return {string} The format of this ExternalPropertiesReturn.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the accountType of this ExternalPropertiesReturn.
 * @param {string} accountType The accountType of this ExternalPropertiesReturn.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.setAccountType = function(accountType) {
  this._accountType = accountType;
  return this;
};

/**
 * Provides the accountType of this ExternalPropertiesReturn.
 * @return {string} The accountType of this ExternalPropertiesReturn.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.getAccountType = function() {
  return this._accountType;
};

/**
 * Sets the message of this ExternalPropertiesReturn.
 * @param {string} message The message of this ExternalPropertiesReturn.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.setMessage = function(message) {
  this._message = message;
  return this;
};

/**
 * Provides the message of this ExternalPropertiesReturn.
 * @return {string} The message of this ExternalPropertiesReturn.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.getMessage = function() {
  return this._message;
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.ExternalPropertiesReturn>} Resolves to ExternalPropertiesReturn or an exception if the loading failed.
 */
tutao.entity.sys.ExternalPropertiesReturn.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 7;
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.ExternalPropertiesReturn, tutao.entity.sys.ExternalPropertiesReturn.PATH, null, null, parameters, headers);
};
