"use strict";

tutao.provide('tutao.entity.aggregatedtype.At2');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.aggregatedtype.At2 = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this._BooleanValue = null;
    this._BytesValue = null;
    this._DateValue = null;
    this._LongValue = null;
    this._StringValue = null;
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._anyAggregated = [];
    this._anyList = [];
    this._anyResource = [];
    this._oneAggregated = null;
    this._oneList = null;
    this._oneResource = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.aggregatedtype.At2.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.aggregatedtype.At2.prototype.updateData = function(parent, data) {
  this._BooleanValue = data.BooleanValue;
  this._BytesValue = data.BytesValue;
  this._DateValue = data.DateValue;
  this._LongValue = data.LongValue;
  this._StringValue = data.StringValue;
  this.__id = data._id;
  this._anyAggregated = [];
  for (var i=0; i < data.anyAggregated.length; i++) {
    this._anyAggregated.push(new tutao.entity.aggregatedtype.At1(parent, data.anyAggregated[i]));
  }
  this._anyList = data.anyList;
  this._anyResource = data.anyResource;
  this._oneAggregated = (data.oneAggregated) ? new tutao.entity.aggregatedtype.At1(parent, data.oneAggregated) : null;
  this._oneList = data.oneList;
  this._oneResource = data.oneResource;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.aggregatedtype.At2.prototype.toJsonData = function() {
  return {
    BooleanValue: this._BooleanValue, 
    BytesValue: this._BytesValue, 
    DateValue: this._DateValue, 
    LongValue: this._LongValue, 
    StringValue: this._StringValue, 
    _id: this.__id, 
    anyAggregated: tutao.entity.EntityHelper.aggregatesToJsonData(this._anyAggregated), 
    anyList: this._anyList, 
    anyResource: this._anyResource, 
    oneAggregated: tutao.entity.EntityHelper.aggregatesToJsonData(this._oneAggregated), 
    oneList: this._oneList, 
    oneResource: this._oneResource
  };
};

/**
 * The id of the At2 type.
 */
tutao.entity.aggregatedtype.At2.prototype.TYPE_ID = 21;

/**
 * The id of the BooleanValue attribute.
 */
tutao.entity.aggregatedtype.At2.prototype.BOOLEANVALUE_ATTRIBUTE_ID = 27;

/**
 * The id of the BytesValue attribute.
 */
tutao.entity.aggregatedtype.At2.prototype.BYTESVALUE_ATTRIBUTE_ID = 23;

/**
 * The id of the DateValue attribute.
 */
tutao.entity.aggregatedtype.At2.prototype.DATEVALUE_ATTRIBUTE_ID = 26;

/**
 * The id of the LongValue attribute.
 */
tutao.entity.aggregatedtype.At2.prototype.LONGVALUE_ATTRIBUTE_ID = 25;

/**
 * The id of the StringValue attribute.
 */
tutao.entity.aggregatedtype.At2.prototype.STRINGVALUE_ATTRIBUTE_ID = 24;

/**
 * The id of the anyAggregated attribute.
 */
tutao.entity.aggregatedtype.At2.prototype.ANYAGGREGATED_ATTRIBUTE_ID = 31;

/**
 * The id of the anyList attribute.
 */
tutao.entity.aggregatedtype.At2.prototype.ANYLIST_ATTRIBUTE_ID = 33;

/**
 * The id of the anyResource attribute.
 */
tutao.entity.aggregatedtype.At2.prototype.ANYRESOURCE_ATTRIBUTE_ID = 29;

/**
 * The id of the oneAggregated attribute.
 */
tutao.entity.aggregatedtype.At2.prototype.ONEAGGREGATED_ATTRIBUTE_ID = 30;

/**
 * The id of the oneList attribute.
 */
tutao.entity.aggregatedtype.At2.prototype.ONELIST_ATTRIBUTE_ID = 32;

/**
 * The id of the oneResource attribute.
 */
tutao.entity.aggregatedtype.At2.prototype.ONERESOURCE_ATTRIBUTE_ID = 28;

/**
 * Sets the BooleanValue of this At2.
 * @param {boolean} BooleanValue The BooleanValue of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.setBooleanValue = function(BooleanValue) {
  this._BooleanValue = BooleanValue ? '1' : '0';
  return this;
};

/**
 * Provides the BooleanValue of this At2.
 * @return {boolean} The BooleanValue of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getBooleanValue = function() {
  return this._BooleanValue == '1';
};

/**
 * Sets the BytesValue of this At2.
 * @param {string} BytesValue The BytesValue of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.setBytesValue = function(BytesValue) {
  this._BytesValue = BytesValue;
  return this;
};

/**
 * Provides the BytesValue of this At2.
 * @return {string} The BytesValue of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getBytesValue = function() {
  return this._BytesValue;
};

/**
 * Sets the DateValue of this At2.
 * @param {Date} DateValue The DateValue of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.setDateValue = function(DateValue) {
  this._DateValue = String(DateValue.getTime());
  return this;
};

/**
 * Provides the DateValue of this At2.
 * @return {Date} The DateValue of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getDateValue = function() {
  if (isNaN(this._DateValue)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._DateValue);
  }
  return new Date(Number(this._DateValue));
};

/**
 * Sets the LongValue of this At2.
 * @param {string} LongValue The LongValue of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.setLongValue = function(LongValue) {
  this._LongValue = LongValue;
  return this;
};

/**
 * Provides the LongValue of this At2.
 * @return {string} The LongValue of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getLongValue = function() {
  return this._LongValue;
};

/**
 * Sets the StringValue of this At2.
 * @param {string} StringValue The StringValue of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.setStringValue = function(StringValue) {
  this._StringValue = StringValue;
  return this;
};

/**
 * Provides the StringValue of this At2.
 * @return {string} The StringValue of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getStringValue = function() {
  return this._StringValue;
};

/**
 * Sets the id of this At2.
 * @param {string} id The id of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this At2.
 * @return {string} The id of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getId = function() {
  return this.__id;
};

/**
 * Provides the anyAggregated of this At2.
 * @return {Array.<tutao.entity.aggregatedtype.At1>} The anyAggregated of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getAnyAggregated = function() {
  return this._anyAggregated;
};

/**
 * Provides the anyList of this At2.
 * @return {Array.<Array.<string>>} The anyList of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getAnyList = function() {
  return this._anyList;
};

/**
 * Provides the anyResource of this At2.
 * @return {Array.<string>} The anyResource of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getAnyResource = function() {
  return this._anyResource;
};

/**
 * Sets the oneAggregated of this At2.
 * @param {tutao.entity.aggregatedtype.At1} oneAggregated The oneAggregated of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.setOneAggregated = function(oneAggregated) {
  this._oneAggregated = oneAggregated;
  return this;
};

/**
 * Provides the oneAggregated of this At2.
 * @return {tutao.entity.aggregatedtype.At1} The oneAggregated of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getOneAggregated = function() {
  return this._oneAggregated;
};

/**
 * Sets the oneList of this At2.
 * @param {Array.<string>} oneList The oneList of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.setOneList = function(oneList) {
  this._oneList = oneList;
  return this;
};

/**
 * Provides the oneList of this At2.
 * @return {Array.<string>} The oneList of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getOneList = function() {
  return this._oneList;
};

/**
 * Sets the oneResource of this At2.
 * @param {string} oneResource The oneResource of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.setOneResource = function(oneResource) {
  this._oneResource = oneResource;
  return this;
};

/**
 * Provides the oneResource of this At2.
 * @return {string} The oneResource of this At2.
 */
tutao.entity.aggregatedtype.At2.prototype.getOneResource = function() {
  return this._oneResource;
};

/**
 * Loads the oneResource of this At2.
 * @return {Promise.<tutao.entity.aggregatedtype.Et1>} Resolves to the loaded oneResource of this At2 or an exception if the loading failed.
 */
tutao.entity.aggregatedtype.At2.prototype.loadOneResource = function() {
  return tutao.entity.aggregatedtype.Et1.load(this._oneResource);
};
