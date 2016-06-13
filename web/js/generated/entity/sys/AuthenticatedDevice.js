"use strict";

tutao.provide('tutao.entity.sys.AuthenticatedDevice');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AuthenticatedDevice = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._authType = null;
    this._deviceKey = null;
    this._deviceToken = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.AuthenticatedDevice.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AuthenticatedDevice.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._authType = data.authType;
  this._deviceKey = data.deviceKey;
  this._deviceToken = data.deviceToken;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.AuthenticatedDevice.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    authType: this._authType, 
    deviceKey: this._deviceKey, 
    deviceToken: this._deviceToken
  };
};

/**
 * Sets the id of this AuthenticatedDevice.
 * @param {string} id The id of this AuthenticatedDevice.
 */
tutao.entity.sys.AuthenticatedDevice.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this AuthenticatedDevice.
 * @return {string} The id of this AuthenticatedDevice.
 */
tutao.entity.sys.AuthenticatedDevice.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the authType of this AuthenticatedDevice.
 * @param {string} authType The authType of this AuthenticatedDevice.
 */
tutao.entity.sys.AuthenticatedDevice.prototype.setAuthType = function(authType) {
  this._authType = authType;
  return this;
};

/**
 * Provides the authType of this AuthenticatedDevice.
 * @return {string} The authType of this AuthenticatedDevice.
 */
tutao.entity.sys.AuthenticatedDevice.prototype.getAuthType = function() {
  return this._authType;
};

/**
 * Sets the deviceKey of this AuthenticatedDevice.
 * @param {string} deviceKey The deviceKey of this AuthenticatedDevice.
 */
tutao.entity.sys.AuthenticatedDevice.prototype.setDeviceKey = function(deviceKey) {
  this._deviceKey = deviceKey;
  return this;
};

/**
 * Provides the deviceKey of this AuthenticatedDevice.
 * @return {string} The deviceKey of this AuthenticatedDevice.
 */
tutao.entity.sys.AuthenticatedDevice.prototype.getDeviceKey = function() {
  return this._deviceKey;
};

/**
 * Sets the deviceToken of this AuthenticatedDevice.
 * @param {string} deviceToken The deviceToken of this AuthenticatedDevice.
 */
tutao.entity.sys.AuthenticatedDevice.prototype.setDeviceToken = function(deviceToken) {
  this._deviceToken = deviceToken;
  return this;
};

/**
 * Provides the deviceToken of this AuthenticatedDevice.
 * @return {string} The deviceToken of this AuthenticatedDevice.
 */
tutao.entity.sys.AuthenticatedDevice.prototype.getDeviceToken = function() {
  return this._deviceToken;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.AuthenticatedDevice.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
