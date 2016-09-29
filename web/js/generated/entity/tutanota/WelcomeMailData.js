"use strict";

tutao.provide('tutao.entity.tutanota.WelcomeMailData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.WelcomeMailData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._language = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.WelcomeMailData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.WelcomeMailData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._language = data.language;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.WelcomeMailData.MODEL_VERSION = '15';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.WelcomeMailData.PATH = '/rest/tutanota/welcomemailservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.WelcomeMailData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.WelcomeMailData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    language: this._language
  };
};

/**
 * Sets the format of this WelcomeMailData.
 * @param {string} format The format of this WelcomeMailData.
 */
tutao.entity.tutanota.WelcomeMailData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this WelcomeMailData.
 * @return {string} The format of this WelcomeMailData.
 */
tutao.entity.tutanota.WelcomeMailData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the language of this WelcomeMailData.
 * @param {string} language The language of this WelcomeMailData.
 */
tutao.entity.tutanota.WelcomeMailData.prototype.setLanguage = function(language) {
  this._language = language;
  return this;
};

/**
 * Provides the language of this WelcomeMailData.
 * @return {string} The language of this WelcomeMailData.
 */
tutao.entity.tutanota.WelcomeMailData.prototype.getLanguage = function() {
  return this._language;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.WelcomeMailData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "15";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.WelcomeMailData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.WelcomeMailData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
