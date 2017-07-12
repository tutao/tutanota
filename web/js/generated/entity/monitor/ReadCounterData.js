"use strict";

tutao.provide('tutao.entity.monitor.ReadCounterData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.monitor.ReadCounterData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._monitor = null;
    this._owner = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.monitor.ReadCounterData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.monitor.ReadCounterData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._monitor = data.monitor;
  this._owner = data.owner;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.monitor.ReadCounterData.MODEL_VERSION = '5';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.monitor.ReadCounterData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.monitor.ReadCounterData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    monitor: this._monitor, 
    owner: this._owner
  };
};

/**
 * Sets the format of this ReadCounterData.
 * @param {string} format The format of this ReadCounterData.
 */
tutao.entity.monitor.ReadCounterData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ReadCounterData.
 * @return {string} The format of this ReadCounterData.
 */
tutao.entity.monitor.ReadCounterData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the monitor of this ReadCounterData.
 * @param {string} monitor The monitor of this ReadCounterData.
 */
tutao.entity.monitor.ReadCounterData.prototype.setMonitor = function(monitor) {
  this._monitor = monitor;
  return this;
};

/**
 * Provides the monitor of this ReadCounterData.
 * @return {string} The monitor of this ReadCounterData.
 */
tutao.entity.monitor.ReadCounterData.prototype.getMonitor = function() {
  return this._monitor;
};

/**
 * Sets the owner of this ReadCounterData.
 * @param {string} owner The owner of this ReadCounterData.
 */
tutao.entity.monitor.ReadCounterData.prototype.setOwner = function(owner) {
  this._owner = owner;
  return this;
};

/**
 * Provides the owner of this ReadCounterData.
 * @return {string} The owner of this ReadCounterData.
 */
tutao.entity.monitor.ReadCounterData.prototype.getOwner = function() {
  return this._owner;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.monitor.ReadCounterData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
