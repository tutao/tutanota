"use strict";

tutao.provide('tutao.entity.sys.AutoLoginDataReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AutoLoginDataReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._deviceKey = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.AutoLoginDataReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AutoLoginDataReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._deviceKey = data.deviceKey;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.AutoLoginDataReturn.MODEL_VERSION = '13';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.AutoLoginDataReturn.PATH = '/rest/sys/autologinservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.AutoLoginDataReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.AutoLoginDataReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    deviceKey: this._deviceKey
  };
};

/**
 * The id of the AutoLoginDataReturn type.
 */
tutao.entity.sys.AutoLoginDataReturn.prototype.TYPE_ID = 438;

/**
 * The id of the deviceKey attribute.
 */
tutao.entity.sys.AutoLoginDataReturn.prototype.DEVICEKEY_ATTRIBUTE_ID = 440;

/**
 * Sets the format of this AutoLoginDataReturn.
 * @param {string} format The format of this AutoLoginDataReturn.
 */
tutao.entity.sys.AutoLoginDataReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this AutoLoginDataReturn.
 * @return {string} The format of this AutoLoginDataReturn.
 */
tutao.entity.sys.AutoLoginDataReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the deviceKey of this AutoLoginDataReturn.
 * @param {string} deviceKey The deviceKey of this AutoLoginDataReturn.
 */
tutao.entity.sys.AutoLoginDataReturn.prototype.setDeviceKey = function(deviceKey) {
  this._deviceKey = deviceKey;
  return this;
};

/**
 * Provides the deviceKey of this AutoLoginDataReturn.
 * @return {string} The deviceKey of this AutoLoginDataReturn.
 */
tutao.entity.sys.AutoLoginDataReturn.prototype.getDeviceKey = function() {
  return this._deviceKey;
};

/**
 * Loads from the service.
 * @param {tutao.entity.sys.AutoLoginDataGet} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.AutoLoginDataReturn>} Resolves to AutoLoginDataReturn or an exception if the loading failed.
 */
tutao.entity.sys.AutoLoginDataReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 13;
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.AutoLoginDataReturn, tutao.entity.sys.AutoLoginDataReturn.PATH, entity, parameters, headers);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.AutoLoginPostReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.AutoLoginDataReturn.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 13;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.AutoLoginDataReturn.PATH, this, parameters, headers, tutao.entity.sys.AutoLoginPostReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.AutoLoginDataReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
