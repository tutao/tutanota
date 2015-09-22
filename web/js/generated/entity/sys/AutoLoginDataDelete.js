"use strict";

tutao.provide('tutao.entity.sys.AutoLoginDataDelete');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AutoLoginDataDelete = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._deviceToken = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.AutoLoginDataDelete.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AutoLoginDataDelete.prototype.updateData = function(data) {
  this.__format = data._format;
  this._deviceToken = data.deviceToken;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.AutoLoginDataDelete.MODEL_VERSION = '10';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.AutoLoginDataDelete.PATH = '/rest/sys/autologinservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.AutoLoginDataDelete.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.AutoLoginDataDelete.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    deviceToken: this._deviceToken
  };
};

/**
 * The id of the AutoLoginDataDelete type.
 */
tutao.entity.sys.AutoLoginDataDelete.prototype.TYPE_ID = 435;

/**
 * The id of the deviceToken attribute.
 */
tutao.entity.sys.AutoLoginDataDelete.prototype.DEVICETOKEN_ATTRIBUTE_ID = 437;

/**
 * Sets the format of this AutoLoginDataDelete.
 * @param {string} format The format of this AutoLoginDataDelete.
 */
tutao.entity.sys.AutoLoginDataDelete.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this AutoLoginDataDelete.
 * @return {string} The format of this AutoLoginDataDelete.
 */
tutao.entity.sys.AutoLoginDataDelete.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the deviceToken of this AutoLoginDataDelete.
 * @param {string} deviceToken The deviceToken of this AutoLoginDataDelete.
 */
tutao.entity.sys.AutoLoginDataDelete.prototype.setDeviceToken = function(deviceToken) {
  this._deviceToken = deviceToken;
  return this;
};

/**
 * Provides the deviceToken of this AutoLoginDataDelete.
 * @return {string} The deviceToken of this AutoLoginDataDelete.
 */
tutao.entity.sys.AutoLoginDataDelete.prototype.getDeviceToken = function() {
  return this._deviceToken;
};

/**
 * Invokes DELETE on a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.AutoLoginDataDelete=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.AutoLoginDataDelete.prototype.erase = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 10;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.deleteService(tutao.entity.sys.AutoLoginDataDelete.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.AutoLoginDataDelete.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
