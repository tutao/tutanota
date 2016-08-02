"use strict";

tutao.provide('tutao.entity.tutanota.FileDataDataReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FileDataDataReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._size = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.FileDataDataReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FileDataDataReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._size = data.size;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.FileDataDataReturn.MODEL_VERSION = '14';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.FileDataDataReturn.PATH = '/rest/tutanota/filedataservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.FileDataDataReturn.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.FileDataDataReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    size: this._size
  };
};

/**
 * Sets the format of this FileDataDataReturn.
 * @param {string} format The format of this FileDataDataReturn.
 */
tutao.entity.tutanota.FileDataDataReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this FileDataDataReturn.
 * @return {string} The format of this FileDataDataReturn.
 */
tutao.entity.tutanota.FileDataDataReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the size of this FileDataDataReturn.
 * @param {string} size The size of this FileDataDataReturn.
 */
tutao.entity.tutanota.FileDataDataReturn.prototype.setSize = function(size) {
  this._size = size;
  return this;
};

/**
 * Provides the size of this FileDataDataReturn.
 * @return {string} The size of this FileDataDataReturn.
 */
tutao.entity.tutanota.FileDataDataReturn.prototype.getSize = function() {
  return this._size;
};

/**
 * Updates this service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.FileDataDataReturn.prototype.update = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "14";
  return tutao.locator.entityRestClient.putService(tutao.entity.tutanota.FileDataDataReturn.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.FileDataDataReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
