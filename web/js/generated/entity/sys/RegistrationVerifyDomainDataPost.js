"use strict";

tutao.provide('tutao.entity.sys.RegistrationVerifyDomainDataPost');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._currentAdminMailAddress = null;
    this._language = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype.updateData = function(data) {
  this.__format = data._format;
  this._currentAdminMailAddress = data.currentAdminMailAddress;
  this._language = data.language;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.PATH = '/rest/sys/registrationverifydomainservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    currentAdminMailAddress: this._currentAdminMailAddress, 
    language: this._language
  };
};

/**
 * Sets the format of this RegistrationVerifyDomainDataPost.
 * @param {string} format The format of this RegistrationVerifyDomainDataPost.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this RegistrationVerifyDomainDataPost.
 * @return {string} The format of this RegistrationVerifyDomainDataPost.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the currentAdminMailAddress of this RegistrationVerifyDomainDataPost.
 * @param {string} currentAdminMailAddress The currentAdminMailAddress of this RegistrationVerifyDomainDataPost.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype.setCurrentAdminMailAddress = function(currentAdminMailAddress) {
  this._currentAdminMailAddress = currentAdminMailAddress;
  return this;
};

/**
 * Provides the currentAdminMailAddress of this RegistrationVerifyDomainDataPost.
 * @return {string} The currentAdminMailAddress of this RegistrationVerifyDomainDataPost.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype.getCurrentAdminMailAddress = function() {
  return this._currentAdminMailAddress;
};

/**
 * Sets the language of this RegistrationVerifyDomainDataPost.
 * @param {string} language The language of this RegistrationVerifyDomainDataPost.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype.setLanguage = function(language) {
  this._language = language;
  return this;
};

/**
 * Provides the language of this RegistrationVerifyDomainDataPost.
 * @return {string} The language of this RegistrationVerifyDomainDataPost.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype.getLanguage = function() {
  return this._language;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.RegistrationVerifyDomainPostReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "20";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.RegistrationVerifyDomainDataPost.PATH, this, parameters, headers, tutao.entity.sys.RegistrationVerifyDomainPostReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.RegistrationVerifyDomainDataPost.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
