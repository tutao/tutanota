"use strict";

tutao.provide('tutao.entity.sys.ExternalPropertiesReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ExternalPropertiesReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._accountType = null;
    this._message = null;
    this._bigLogo = null;
    this._smallLogo = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.ExternalPropertiesReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._accountType = data.accountType;
  this._message = data.message;
  this._bigLogo = (data.bigLogo) ? new tutao.entity.sys.File(this, data.bigLogo) : null;
  this._smallLogo = (data.smallLogo) ? new tutao.entity.sys.File(this, data.smallLogo) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.ExternalPropertiesReturn.MODEL_VERSION = '21';

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
    message: this._message, 
    bigLogo: tutao.entity.EntityHelper.aggregatesToJsonData(this._bigLogo), 
    smallLogo: tutao.entity.EntityHelper.aggregatesToJsonData(this._smallLogo)
  };
};

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
 * Sets the bigLogo of this ExternalPropertiesReturn.
 * @param {tutao.entity.sys.File} bigLogo The bigLogo of this ExternalPropertiesReturn.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.setBigLogo = function(bigLogo) {
  this._bigLogo = bigLogo;
  return this;
};

/**
 * Provides the bigLogo of this ExternalPropertiesReturn.
 * @return {tutao.entity.sys.File} The bigLogo of this ExternalPropertiesReturn.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.getBigLogo = function() {
  return this._bigLogo;
};

/**
 * Sets the smallLogo of this ExternalPropertiesReturn.
 * @param {tutao.entity.sys.File} smallLogo The smallLogo of this ExternalPropertiesReturn.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.setSmallLogo = function(smallLogo) {
  this._smallLogo = smallLogo;
  return this;
};

/**
 * Provides the smallLogo of this ExternalPropertiesReturn.
 * @return {tutao.entity.sys.File} The smallLogo of this ExternalPropertiesReturn.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.getSmallLogo = function() {
  return this._smallLogo;
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
  parameters["v"] = "21";
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.ExternalPropertiesReturn, tutao.entity.sys.ExternalPropertiesReturn.PATH, null, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.ExternalPropertiesReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
