"use strict";

tutao.provide('tutao.entity.monitor.ReadCounterReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.monitor.ReadCounterReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._value = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.monitor.ReadCounterReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.monitor.ReadCounterReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._value = data.value;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.monitor.ReadCounterReturn.MODEL_VERSION = '4';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.monitor.ReadCounterReturn.PATH = '/rest/monitor/counterservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.monitor.ReadCounterReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.monitor.ReadCounterReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    value: this._value
  };
};

/**
 * Sets the format of this ReadCounterReturn.
 * @param {string} format The format of this ReadCounterReturn.
 */
tutao.entity.monitor.ReadCounterReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ReadCounterReturn.
 * @return {string} The format of this ReadCounterReturn.
 */
tutao.entity.monitor.ReadCounterReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the value of this ReadCounterReturn.
 * @param {string} value The value of this ReadCounterReturn.
 */
tutao.entity.monitor.ReadCounterReturn.prototype.setValue = function(value) {
  this._value = value;
  return this;
};

/**
 * Provides the value of this ReadCounterReturn.
 * @return {string} The value of this ReadCounterReturn.
 */
tutao.entity.monitor.ReadCounterReturn.prototype.getValue = function() {
  return this._value;
};

/**
 * Loads from the service.
 * @param {tutao.entity.monitor.ReadCounterData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.monitor.ReadCounterReturn>} Resolves to ReadCounterReturn or an exception if the loading failed.
 */
tutao.entity.monitor.ReadCounterReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "4";
  return tutao.locator.entityRestClient.getService(tutao.entity.monitor.ReadCounterReturn, tutao.entity.monitor.ReadCounterReturn.PATH, entity, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.monitor.ReadCounterReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
