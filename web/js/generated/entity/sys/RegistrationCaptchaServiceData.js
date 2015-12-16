"use strict";

tutao.provide('tutao.entity.sys.RegistrationCaptchaServiceData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationCaptchaServiceData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._response = null;
    this._token = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.RegistrationCaptchaServiceData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._response = data.response;
  this._token = data.token;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.RegistrationCaptchaServiceData.MODEL_VERSION = '15';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.RegistrationCaptchaServiceData.PATH = '/rest/sys/registrationcaptchaservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    response: this._response, 
    token: this._token
  };
};

/**
 * The id of the RegistrationCaptchaServiceData type.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.TYPE_ID = 674;

/**
 * The id of the response attribute.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.RESPONSE_ATTRIBUTE_ID = 677;

/**
 * The id of the token attribute.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.TOKEN_ATTRIBUTE_ID = 676;

/**
 * Sets the format of this RegistrationCaptchaServiceData.
 * @param {string} format The format of this RegistrationCaptchaServiceData.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this RegistrationCaptchaServiceData.
 * @return {string} The format of this RegistrationCaptchaServiceData.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the response of this RegistrationCaptchaServiceData.
 * @param {string} response The response of this RegistrationCaptchaServiceData.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.setResponse = function(response) {
  this._response = response;
  return this;
};

/**
 * Provides the response of this RegistrationCaptchaServiceData.
 * @return {string} The response of this RegistrationCaptchaServiceData.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.getResponse = function() {
  return this._response;
};

/**
 * Sets the token of this RegistrationCaptchaServiceData.
 * @param {string} token The token of this RegistrationCaptchaServiceData.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.setToken = function(token) {
  this._token = token;
  return this;
};

/**
 * Provides the token of this RegistrationCaptchaServiceData.
 * @return {string} The token of this RegistrationCaptchaServiceData.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.getToken = function() {
  return this._token;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 15;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.RegistrationCaptchaServiceData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.RegistrationCaptchaServiceData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
