"use strict";

tutao.provide('tutao.entity.sys.RegistrationConfigReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationConfigReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._freeEnabled = null;
    this._starterEnabled = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.RegistrationConfigReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._freeEnabled = data.freeEnabled;
  this._starterEnabled = data.starterEnabled;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.RegistrationConfigReturn.MODEL_VERSION = '15';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.RegistrationConfigReturn.PATH = '/rest/sys/registrationconfigservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    freeEnabled: this._freeEnabled, 
    starterEnabled: this._starterEnabled
  };
};

/**
 * The id of the RegistrationConfigReturn type.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.TYPE_ID = 606;

/**
 * The id of the freeEnabled attribute.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.FREEENABLED_ATTRIBUTE_ID = 609;

/**
 * The id of the starterEnabled attribute.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.STARTERENABLED_ATTRIBUTE_ID = 608;

/**
 * Sets the format of this RegistrationConfigReturn.
 * @param {string} format The format of this RegistrationConfigReturn.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this RegistrationConfigReturn.
 * @return {string} The format of this RegistrationConfigReturn.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the freeEnabled of this RegistrationConfigReturn.
 * @param {boolean} freeEnabled The freeEnabled of this RegistrationConfigReturn.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.setFreeEnabled = function(freeEnabled) {
  this._freeEnabled = freeEnabled ? '1' : '0';
  return this;
};

/**
 * Provides the freeEnabled of this RegistrationConfigReturn.
 * @return {boolean} The freeEnabled of this RegistrationConfigReturn.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.getFreeEnabled = function() {
  return this._freeEnabled != '0';
};

/**
 * Sets the starterEnabled of this RegistrationConfigReturn.
 * @param {boolean} starterEnabled The starterEnabled of this RegistrationConfigReturn.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.setStarterEnabled = function(starterEnabled) {
  this._starterEnabled = starterEnabled ? '1' : '0';
  return this;
};

/**
 * Provides the starterEnabled of this RegistrationConfigReturn.
 * @return {boolean} The starterEnabled of this RegistrationConfigReturn.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.getStarterEnabled = function() {
  return this._starterEnabled != '0';
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.RegistrationConfigReturn>} Resolves to RegistrationConfigReturn or an exception if the loading failed.
 */
tutao.entity.sys.RegistrationConfigReturn.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 15;
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.RegistrationConfigReturn, tutao.entity.sys.RegistrationConfigReturn.PATH, null, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.RegistrationConfigReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
