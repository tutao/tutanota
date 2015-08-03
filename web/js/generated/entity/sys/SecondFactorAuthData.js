"use strict";

tutao.provide('tutao.entity.sys.SecondFactorAuthData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactorAuthData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._language = null;
    this._service = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SecondFactorAuthData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._language = data.language;
  this._service = data.service;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SecondFactorAuthData.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.SecondFactorAuthData.PATH = '/rest/sys/secondfactorauthservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SecondFactorAuthData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    language: this._language, 
    service: this._service
  };
};

/**
 * The id of the SecondFactorAuthData type.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.TYPE_ID = 541;

/**
 * The id of the language attribute.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.LANGUAGE_ATTRIBUTE_ID = 543;

/**
 * The id of the service attribute.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.SERVICE_ATTRIBUTE_ID = 544;

/**
 * Sets the format of this SecondFactorAuthData.
 * @param {string} format The format of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SecondFactorAuthData.
 * @return {string} The format of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the language of this SecondFactorAuthData.
 * @param {string} language The language of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.setLanguage = function(language) {
  this._language = language;
  return this;
};

/**
 * Provides the language of this SecondFactorAuthData.
 * @return {string} The language of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.getLanguage = function() {
  return this._language;
};

/**
 * Sets the service of this SecondFactorAuthData.
 * @param {string} service The service of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.setService = function(service) {
  this._service = service;
  return this;
};

/**
 * Provides the service of this SecondFactorAuthData.
 * @return {string} The service of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.getService = function() {
  return this._service;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.SecondFactorAuthData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
