"use strict";

tutao.provide('tutao.entity.sys.SendRegistrationCodeData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SendRegistrationCodeData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._accountType = null;
    this._authToken = null;
    this._language = null;
    this._mobilePhoneNumber = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SendRegistrationCodeData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._accountType = data.accountType;
  this._authToken = data.authToken;
  this._language = data.language;
  this._mobilePhoneNumber = data.mobilePhoneNumber;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SendRegistrationCodeData.MODEL_VERSION = '8';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.SendRegistrationCodeData.PATH = '/rest/sys/sendregistrationcodeservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    accountType: this._accountType, 
    authToken: this._authToken, 
    language: this._language, 
    mobilePhoneNumber: this._mobilePhoneNumber
  };
};

/**
 * The id of the SendRegistrationCodeData type.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.TYPE_ID = 341;

/**
 * The id of the accountType attribute.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.ACCOUNTTYPE_ATTRIBUTE_ID = 345;

/**
 * The id of the authToken attribute.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.AUTHTOKEN_ATTRIBUTE_ID = 343;

/**
 * The id of the language attribute.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.LANGUAGE_ATTRIBUTE_ID = 344;

/**
 * The id of the mobilePhoneNumber attribute.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.MOBILEPHONENUMBER_ATTRIBUTE_ID = 346;

/**
 * Sets the format of this SendRegistrationCodeData.
 * @param {string} format The format of this SendRegistrationCodeData.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SendRegistrationCodeData.
 * @return {string} The format of this SendRegistrationCodeData.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the accountType of this SendRegistrationCodeData.
 * @param {string} accountType The accountType of this SendRegistrationCodeData.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.setAccountType = function(accountType) {
  this._accountType = accountType;
  return this;
};

/**
 * Provides the accountType of this SendRegistrationCodeData.
 * @return {string} The accountType of this SendRegistrationCodeData.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.getAccountType = function() {
  return this._accountType;
};

/**
 * Sets the authToken of this SendRegistrationCodeData.
 * @param {string} authToken The authToken of this SendRegistrationCodeData.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.setAuthToken = function(authToken) {
  this._authToken = authToken;
  return this;
};

/**
 * Provides the authToken of this SendRegistrationCodeData.
 * @return {string} The authToken of this SendRegistrationCodeData.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.getAuthToken = function() {
  return this._authToken;
};

/**
 * Sets the language of this SendRegistrationCodeData.
 * @param {string} language The language of this SendRegistrationCodeData.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.setLanguage = function(language) {
  this._language = language;
  return this;
};

/**
 * Provides the language of this SendRegistrationCodeData.
 * @return {string} The language of this SendRegistrationCodeData.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.getLanguage = function() {
  return this._language;
};

/**
 * Sets the mobilePhoneNumber of this SendRegistrationCodeData.
 * @param {string} mobilePhoneNumber The mobilePhoneNumber of this SendRegistrationCodeData.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.setMobilePhoneNumber = function(mobilePhoneNumber) {
  this._mobilePhoneNumber = mobilePhoneNumber;
  return this;
};

/**
 * Provides the mobilePhoneNumber of this SendRegistrationCodeData.
 * @return {string} The mobilePhoneNumber of this SendRegistrationCodeData.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.getMobilePhoneNumber = function() {
  return this._mobilePhoneNumber;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.SendRegistrationCodeReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.SendRegistrationCodeData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 8;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.SendRegistrationCodeData.PATH, this, parameters, headers, tutao.entity.sys.SendRegistrationCodeReturn);
};
