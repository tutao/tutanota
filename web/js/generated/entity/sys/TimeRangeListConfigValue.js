"use strict";

tutao.provide('tutao.entity.sys.TimeRangeListConfigValue');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.TimeRangeListConfigValue = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._name = null;
    this._timeRanges = [];
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.TimeRangeListConfigValue.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.TimeRangeListConfigValue.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._name = data.name;
  this._timeRanges = [];
  for (var i=0; i < data.timeRanges.length; i++) {
    this._timeRanges.push(new tutao.entity.sys.TimeRangeConfigValue(parent, data.timeRanges[i]));
  }
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.TimeRangeListConfigValue.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    name: this._name, 
    timeRanges: tutao.entity.EntityHelper.aggregatesToJsonData(this._timeRanges)
  };
};

/**
 * The id of the TimeRangeListConfigValue type.
 */
tutao.entity.sys.TimeRangeListConfigValue.prototype.TYPE_ID = 524;

/**
 * The id of the name attribute.
 */
tutao.entity.sys.TimeRangeListConfigValue.prototype.NAME_ATTRIBUTE_ID = 526;

/**
 * The id of the timeRanges attribute.
 */
tutao.entity.sys.TimeRangeListConfigValue.prototype.TIMERANGES_ATTRIBUTE_ID = 527;

/**
 * Sets the id of this TimeRangeListConfigValue.
 * @param {string} id The id of this TimeRangeListConfigValue.
 */
tutao.entity.sys.TimeRangeListConfigValue.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this TimeRangeListConfigValue.
 * @return {string} The id of this TimeRangeListConfigValue.
 */
tutao.entity.sys.TimeRangeListConfigValue.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the name of this TimeRangeListConfigValue.
 * @param {string} name The name of this TimeRangeListConfigValue.
 */
tutao.entity.sys.TimeRangeListConfigValue.prototype.setName = function(name) {
  this._name = name;
  return this;
};

/**
 * Provides the name of this TimeRangeListConfigValue.
 * @return {string} The name of this TimeRangeListConfigValue.
 */
tutao.entity.sys.TimeRangeListConfigValue.prototype.getName = function() {
  return this._name;
};

/**
 * Provides the timeRanges of this TimeRangeListConfigValue.
 * @return {Array.<tutao.entity.sys.TimeRangeConfigValue>} The timeRanges of this TimeRangeListConfigValue.
 */
tutao.entity.sys.TimeRangeListConfigValue.prototype.getTimeRanges = function() {
  return this._timeRanges;
};
