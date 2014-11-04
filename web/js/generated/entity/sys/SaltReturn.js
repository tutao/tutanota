"use strict";

tutao.provide('tutao.entity.sys.SaltReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SaltReturn = function(data) {
  if (data) {
    this.__format = data._format;
    this._salt = data.salt;
  } else {
    this.__format = "0";
    this._salt = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SaltReturn.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SaltReturn.MODEL_VERSION = '5';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.SaltReturn.PATH = '/rest/sys/saltservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SaltReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SaltReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    salt: this._salt
  };
};

/**
 * The id of the SaltReturn type.
 */
tutao.entity.sys.SaltReturn.prototype.TYPE_ID = 420;

/**
 * The id of the salt attribute.
 */
tutao.entity.sys.SaltReturn.prototype.SALT_ATTRIBUTE_ID = 422;

/**
 * Sets the format of this SaltReturn.
 * @param {string} format The format of this SaltReturn.
 */
tutao.entity.sys.SaltReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SaltReturn.
 * @return {string} The format of this SaltReturn.
 */
tutao.entity.sys.SaltReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the salt of this SaltReturn.
 * @param {string} salt The salt of this SaltReturn.
 */
tutao.entity.sys.SaltReturn.prototype.setSalt = function(salt) {
  this._salt = salt;
  return this;
};

/**
 * Provides the salt of this SaltReturn.
 * @return {string} The salt of this SaltReturn.
 */
tutao.entity.sys.SaltReturn.prototype.getSalt = function() {
  return this._salt;
};

/**
 * Loads from the service.
 * @param {tutao.entity.sys.SaltData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.SaltReturn>} Resolves to SaltReturn or an exception if the loading failed.
 */
tutao.entity.sys.SaltReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 5;
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.SaltReturn, tutao.entity.sys.SaltReturn.PATH, entity, parameters, headers);
};
