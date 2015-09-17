"use strict";

tutao.provide('tutao.entity.sys.TimeRangeConfigValue');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.TimeRangeConfigValue = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._end = null;
    this._identifier = null;
    this._start = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.TimeRangeConfigValue.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._end = data.end;
  this._identifier = data.identifier;
  this._start = data.start;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    end: this._end, 
    identifier: this._identifier, 
    start: this._start
  };
};

/**
 * The id of the TimeRangeConfigValue type.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.TYPE_ID = 519;

/**
 * The id of the end attribute.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.END_ATTRIBUTE_ID = 523;

/**
 * The id of the identifier attribute.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.IDENTIFIER_ATTRIBUTE_ID = 521;

/**
 * The id of the start attribute.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.START_ATTRIBUTE_ID = 522;

/**
 * Sets the id of this TimeRangeConfigValue.
 * @param {string} id The id of this TimeRangeConfigValue.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this TimeRangeConfigValue.
 * @return {string} The id of this TimeRangeConfigValue.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the end of this TimeRangeConfigValue.
 * @param {Date} end The end of this TimeRangeConfigValue.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.setEnd = function(end) {
  if (end == null) {
    this._end = null;
  } else {
    this._end = String(end.getTime());
  }
  return this;
};

/**
 * Provides the end of this TimeRangeConfigValue.
 * @return {Date} The end of this TimeRangeConfigValue.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.getEnd = function() {
  if (this._end == null) {
    return null;
  }
  if (isNaN(this._end)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._end);
  }
  return new Date(Number(this._end));
};

/**
 * Sets the identifier of this TimeRangeConfigValue.
 * @param {string} identifier The identifier of this TimeRangeConfigValue.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.setIdentifier = function(identifier) {
  this._identifier = identifier;
  return this;
};

/**
 * Provides the identifier of this TimeRangeConfigValue.
 * @return {string} The identifier of this TimeRangeConfigValue.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.getIdentifier = function() {
  return this._identifier;
};

/**
 * Sets the start of this TimeRangeConfigValue.
 * @param {Date} start The start of this TimeRangeConfigValue.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.setStart = function(start) {
  if (start == null) {
    this._start = null;
  } else {
    this._start = String(start.getTime());
  }
  return this;
};

/**
 * Provides the start of this TimeRangeConfigValue.
 * @return {Date} The start of this TimeRangeConfigValue.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.getStart = function() {
  if (this._start == null) {
    return null;
  }
  if (isNaN(this._start)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._start);
  }
  return new Date(Number(this._start));
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.TimeRangeConfigValue.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
