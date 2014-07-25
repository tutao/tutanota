"use strict";

goog.provide('tutao.entity.monitor.CreateCounterMonitor');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.monitor.CreateCounterMonitor = function(parent, data) {
  if (data) {
    this.__id = data._id;
    this._monitor = data.monitor;
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._monitor = null;
  };
  this._parent = parent;
  this.prototype = tutao.entity.monitor.CreateCounterMonitor.prototype;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.monitor.CreateCounterMonitor.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    monitor: this._monitor
  };
};

/**
 * The id of the CreateCounterMonitor type.
 */
tutao.entity.monitor.CreateCounterMonitor.prototype.TYPE_ID = 20;

/**
 * The id of the monitor attribute.
 */
tutao.entity.monitor.CreateCounterMonitor.prototype.MONITOR_ATTRIBUTE_ID = 22;

/**
 * Sets the id of this CreateCounterMonitor.
 * @param {string} id The id of this CreateCounterMonitor.
 */
tutao.entity.monitor.CreateCounterMonitor.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this CreateCounterMonitor.
 * @return {string} The id of this CreateCounterMonitor.
 */
tutao.entity.monitor.CreateCounterMonitor.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the monitor of this CreateCounterMonitor.
 * @param {string} monitor The monitor of this CreateCounterMonitor.
 */
tutao.entity.monitor.CreateCounterMonitor.prototype.setMonitor = function(monitor) {
  this._monitor = monitor;
  return this;
};

/**
 * Provides the monitor of this CreateCounterMonitor.
 * @return {string} The monitor of this CreateCounterMonitor.
 */
tutao.entity.monitor.CreateCounterMonitor.prototype.getMonitor = function() {
  return this._monitor;
};
