"use strict";

tutao.provide('tutao.entity.sys.PhoneNumberTypeReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PhoneNumberTypeReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._type = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PhoneNumberTypeReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PhoneNumberTypeReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._type = data.type;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PhoneNumberTypeReturn.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.PhoneNumberTypeReturn.PATH = '/rest/sys/phonenumbertypeservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PhoneNumberTypeReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PhoneNumberTypeReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    type: this._type
  };
};

/**
 * The id of the PhoneNumberTypeReturn type.
 */
tutao.entity.sys.PhoneNumberTypeReturn.prototype.TYPE_ID = 620;

/**
 * The id of the type attribute.
 */
tutao.entity.sys.PhoneNumberTypeReturn.prototype.TYPE_ATTRIBUTE_ID = 622;

/**
 * Sets the format of this PhoneNumberTypeReturn.
 * @param {string} format The format of this PhoneNumberTypeReturn.
 */
tutao.entity.sys.PhoneNumberTypeReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PhoneNumberTypeReturn.
 * @return {string} The format of this PhoneNumberTypeReturn.
 */
tutao.entity.sys.PhoneNumberTypeReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the type of this PhoneNumberTypeReturn.
 * @param {string} type The type of this PhoneNumberTypeReturn.
 */
tutao.entity.sys.PhoneNumberTypeReturn.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this PhoneNumberTypeReturn.
 * @return {string} The type of this PhoneNumberTypeReturn.
 */
tutao.entity.sys.PhoneNumberTypeReturn.prototype.getType = function() {
  return this._type;
};

/**
 * Loads from the service.
 * @param {tutao.entity.sys.PhoneNumberTypeData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.PhoneNumberTypeReturn>} Resolves to PhoneNumberTypeReturn or an exception if the loading failed.
 */
tutao.entity.sys.PhoneNumberTypeReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.PhoneNumberTypeReturn, tutao.entity.sys.PhoneNumberTypeReturn.PATH, entity, parameters, headers);
};
