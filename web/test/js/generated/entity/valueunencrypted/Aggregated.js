"use strict";

tutao.provide('tutao.entity.valueunencrypted.Aggregated');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueunencrypted.Aggregated = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._bool = null;
    this._bytes = null;
    this._date = null;
    this._number = null;
    this._string = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.valueunencrypted.Aggregated.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._bool = data.bool;
  this._bytes = data.bytes;
  this._date = data.date;
  this._number = data.number;
  this._string = data.string;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    bool: this._bool, 
    bytes: this._bytes, 
    date: this._date, 
    number: this._number, 
    string: this._string
  };
};

/**
 * The id of the Aggregated type.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.TYPE_ID = 37;

/**
 * The id of the bool attribute.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.BOOL_ATTRIBUTE_ID = 43;

/**
 * The id of the bytes attribute.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.BYTES_ATTRIBUTE_ID = 39;

/**
 * The id of the date attribute.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.DATE_ATTRIBUTE_ID = 42;

/**
 * The id of the number attribute.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.NUMBER_ATTRIBUTE_ID = 41;

/**
 * The id of the string attribute.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.STRING_ATTRIBUTE_ID = 40;

/**
 * Sets the id of this Aggregated.
 * @param {string} id The id of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Aggregated.
 * @return {string} The id of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the bool of this Aggregated.
 * @param {boolean} bool The bool of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.setBool = function(bool) {
  this._bool = bool ? '1' : '0';
  return this;
};

/**
 * Provides the bool of this Aggregated.
 * @return {boolean} The bool of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.getBool = function() {
  return this._bool == '1';
};

/**
 * Sets the bytes of this Aggregated.
 * @param {string} bytes The bytes of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.setBytes = function(bytes) {
  this._bytes = bytes;
  return this;
};

/**
 * Provides the bytes of this Aggregated.
 * @return {string} The bytes of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.getBytes = function() {
  return this._bytes;
};

/**
 * Sets the date of this Aggregated.
 * @param {Date} date The date of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.setDate = function(date) {
  this._date = String(date.getTime());
  return this;
};

/**
 * Provides the date of this Aggregated.
 * @return {Date} The date of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.getDate = function() {
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the number of this Aggregated.
 * @param {string} number The number of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.setNumber = function(number) {
  this._number = number;
  return this;
};

/**
 * Provides the number of this Aggregated.
 * @return {string} The number of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.getNumber = function() {
  return this._number;
};

/**
 * Sets the string of this Aggregated.
 * @param {string} string The string of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.setString = function(string) {
  this._string = string;
  return this;
};

/**
 * Provides the string of this Aggregated.
 * @return {string} The string of this Aggregated.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.getString = function() {
  return this._string;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.valueunencrypted.Aggregated.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
