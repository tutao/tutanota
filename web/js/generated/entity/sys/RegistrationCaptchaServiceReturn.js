"use strict";

tutao.provide('tutao.entity.sys.RegistrationCaptchaServiceReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._challenge = null;
    this._token = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._challenge = data.challenge;
  this._token = data.token;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.MODEL_VERSION = '17';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.PATH = '/rest/sys/registrationcaptchaservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    challenge: this._challenge, 
    token: this._token
  };
};

/**
 * The id of the RegistrationCaptchaServiceReturn type.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.TYPE_ID = 678;

/**
 * The id of the challenge attribute.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.CHALLENGE_ATTRIBUTE_ID = 681;

/**
 * The id of the token attribute.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.TOKEN_ATTRIBUTE_ID = 680;

/**
 * Sets the format of this RegistrationCaptchaServiceReturn.
 * @param {string} format The format of this RegistrationCaptchaServiceReturn.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this RegistrationCaptchaServiceReturn.
 * @return {string} The format of this RegistrationCaptchaServiceReturn.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the challenge of this RegistrationCaptchaServiceReturn.
 * @param {string} challenge The challenge of this RegistrationCaptchaServiceReturn.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.setChallenge = function(challenge) {
  this._challenge = challenge;
  return this;
};

/**
 * Provides the challenge of this RegistrationCaptchaServiceReturn.
 * @return {string} The challenge of this RegistrationCaptchaServiceReturn.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.getChallenge = function() {
  return this._challenge;
};

/**
 * Sets the token of this RegistrationCaptchaServiceReturn.
 * @param {string} token The token of this RegistrationCaptchaServiceReturn.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.setToken = function(token) {
  this._token = token;
  return this;
};

/**
 * Provides the token of this RegistrationCaptchaServiceReturn.
 * @return {string} The token of this RegistrationCaptchaServiceReturn.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.getToken = function() {
  return this._token;
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.RegistrationCaptchaServiceReturn>} Resolves to RegistrationCaptchaServiceReturn or an exception if the loading failed.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "17";
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.RegistrationCaptchaServiceReturn, tutao.entity.sys.RegistrationCaptchaServiceReturn.PATH, null, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.RegistrationCaptchaServiceReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
