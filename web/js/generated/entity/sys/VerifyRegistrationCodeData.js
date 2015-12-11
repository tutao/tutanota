"use strict";

tutao.provide('tutao.entity.sys.VerifyRegistrationCodeData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.VerifyRegistrationCodeData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._authToken = null;
    this._code = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.VerifyRegistrationCodeData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._authToken = data.authToken;
  this._code = data.code;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.VerifyRegistrationCodeData.MODEL_VERSION = '14';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.VerifyRegistrationCodeData.PATH = '/rest/sys/verifyregistrationcodeservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    authToken: this._authToken, 
    code: this._code
  };
};

/**
 * The id of the VerifyRegistrationCodeData type.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.TYPE_ID = 351;

/**
 * The id of the authToken attribute.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.AUTHTOKEN_ATTRIBUTE_ID = 353;

/**
 * The id of the code attribute.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.CODE_ATTRIBUTE_ID = 354;

/**
 * Sets the format of this VerifyRegistrationCodeData.
 * @param {string} format The format of this VerifyRegistrationCodeData.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this VerifyRegistrationCodeData.
 * @return {string} The format of this VerifyRegistrationCodeData.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the authToken of this VerifyRegistrationCodeData.
 * @param {string} authToken The authToken of this VerifyRegistrationCodeData.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.setAuthToken = function(authToken) {
  this._authToken = authToken;
  return this;
};

/**
 * Provides the authToken of this VerifyRegistrationCodeData.
 * @return {string} The authToken of this VerifyRegistrationCodeData.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.getAuthToken = function() {
  return this._authToken;
};

/**
 * Sets the code of this VerifyRegistrationCodeData.
 * @param {string} code The code of this VerifyRegistrationCodeData.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.setCode = function(code) {
  this._code = code;
  return this;
};

/**
 * Provides the code of this VerifyRegistrationCodeData.
 * @return {string} The code of this VerifyRegistrationCodeData.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.getCode = function() {
  return this._code;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 14;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.VerifyRegistrationCodeData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.VerifyRegistrationCodeData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
