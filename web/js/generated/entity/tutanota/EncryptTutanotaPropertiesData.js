"use strict";

tutao.provide('tutao.entity.tutanota.EncryptTutanotaPropertiesData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._symEncSessionKey = null;
    this._properties = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._symEncSessionKey = data.symEncSessionKey;
  this._properties = data.properties;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.PATH = '/rest/tutanota/encrypttutanotapropertiesservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    symEncSessionKey: this._symEncSessionKey, 
    properties: this._properties
  };
};

/**
 * The id of the EncryptTutanotaPropertiesData type.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.TYPE_ID = 473;

/**
 * The id of the symEncSessionKey attribute.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.SYMENCSESSIONKEY_ATTRIBUTE_ID = 476;

/**
 * The id of the properties attribute.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.PROPERTIES_ATTRIBUTE_ID = 475;

/**
 * Sets the format of this EncryptTutanotaPropertiesData.
 * @param {string} format The format of this EncryptTutanotaPropertiesData.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this EncryptTutanotaPropertiesData.
 * @return {string} The format of this EncryptTutanotaPropertiesData.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the symEncSessionKey of this EncryptTutanotaPropertiesData.
 * @param {string} symEncSessionKey The symEncSessionKey of this EncryptTutanotaPropertiesData.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.setSymEncSessionKey = function(symEncSessionKey) {
  this._symEncSessionKey = symEncSessionKey;
  return this;
};

/**
 * Provides the symEncSessionKey of this EncryptTutanotaPropertiesData.
 * @return {string} The symEncSessionKey of this EncryptTutanotaPropertiesData.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.getSymEncSessionKey = function() {
  return this._symEncSessionKey;
};

/**
 * Sets the properties of this EncryptTutanotaPropertiesData.
 * @param {string} properties The properties of this EncryptTutanotaPropertiesData.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.setProperties = function(properties) {
  this._properties = properties;
  return this;
};

/**
 * Provides the properties of this EncryptTutanotaPropertiesData.
 * @return {string} The properties of this EncryptTutanotaPropertiesData.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.getProperties = function() {
  return this._properties;
};

/**
 * Loads the properties of this EncryptTutanotaPropertiesData.
 * @return {Promise.<tutao.entity.tutanota.TutanotaProperties>} Resolves to the loaded properties of this EncryptTutanotaPropertiesData or an exception if the loading failed.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.loadProperties = function() {
  return tutao.entity.tutanota.TutanotaProperties.load(this._properties);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.EncryptTutanotaPropertiesData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.EncryptTutanotaPropertiesData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
