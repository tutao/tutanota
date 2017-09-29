"use strict";

tutao.provide('tutao.entity.sys.RegistrationVerifyDomainDataPut');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._authToken = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.RegistrationVerifyDomainDataPut.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut.prototype.updateData = function(data) {
  this.__format = data._format;
  this._authToken = data.authToken;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut.PATH = '/rest/sys/registrationverifydomainservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    authToken: this._authToken
  };
};

/**
 * Sets the format of this RegistrationVerifyDomainDataPut.
 * @param {string} format The format of this RegistrationVerifyDomainDataPut.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this RegistrationVerifyDomainDataPut.
 * @return {string} The format of this RegistrationVerifyDomainDataPut.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the authToken of this RegistrationVerifyDomainDataPut.
 * @param {string} authToken The authToken of this RegistrationVerifyDomainDataPut.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut.prototype.setAuthToken = function(authToken) {
  this._authToken = authToken;
  return this;
};

/**
 * Provides the authToken of this RegistrationVerifyDomainDataPut.
 * @return {string} The authToken of this RegistrationVerifyDomainDataPut.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut.prototype.getAuthToken = function() {
  return this._authToken;
};

/**
 * Updates this service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut.prototype.update = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "20";
  return tutao.locator.entityRestClient.putService(tutao.entity.sys.RegistrationVerifyDomainDataPut.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPut.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
