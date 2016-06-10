"use strict";

tutao.provide('tutao.entity.sys.Version');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Version = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._operation = null;
    this._timestamp = null;
    this._version = null;
    this._author = null;
    this._authorGroupInfo = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.Version.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Version.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._operation = data.operation;
  this._timestamp = data.timestamp;
  this._version = data.version;
  this._author = data.author;
  this._authorGroupInfo = data.authorGroupInfo;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Version.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    operation: this._operation, 
    timestamp: this._timestamp, 
    version: this._version, 
    author: this._author, 
    authorGroupInfo: this._authorGroupInfo
  };
};

/**
 * Sets the id of this Version.
 * @param {string} id The id of this Version.
 */
tutao.entity.sys.Version.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Version.
 * @return {string} The id of this Version.
 */
tutao.entity.sys.Version.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the operation of this Version.
 * @param {string} operation The operation of this Version.
 */
tutao.entity.sys.Version.prototype.setOperation = function(operation) {
  this._operation = operation;
  return this;
};

/**
 * Provides the operation of this Version.
 * @return {string} The operation of this Version.
 */
tutao.entity.sys.Version.prototype.getOperation = function() {
  return this._operation;
};

/**
 * Sets the timestamp of this Version.
 * @param {Date} timestamp The timestamp of this Version.
 */
tutao.entity.sys.Version.prototype.setTimestamp = function(timestamp) {
  this._timestamp = String(timestamp.getTime());
  return this;
};

/**
 * Provides the timestamp of this Version.
 * @return {Date} The timestamp of this Version.
 */
tutao.entity.sys.Version.prototype.getTimestamp = function() {
  if (isNaN(this._timestamp)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._timestamp);
  }
  return new Date(Number(this._timestamp));
};

/**
 * Sets the version of this Version.
 * @param {string} version The version of this Version.
 */
tutao.entity.sys.Version.prototype.setVersion = function(version) {
  this._version = version;
  return this;
};

/**
 * Provides the version of this Version.
 * @return {string} The version of this Version.
 */
tutao.entity.sys.Version.prototype.getVersion = function() {
  return this._version;
};

/**
 * Sets the author of this Version.
 * @param {string} author The author of this Version.
 */
tutao.entity.sys.Version.prototype.setAuthor = function(author) {
  this._author = author;
  return this;
};

/**
 * Provides the author of this Version.
 * @return {string} The author of this Version.
 */
tutao.entity.sys.Version.prototype.getAuthor = function() {
  return this._author;
};

/**
 * Loads the author of this Version.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded author of this Version or an exception if the loading failed.
 */
tutao.entity.sys.Version.prototype.loadAuthor = function() {
  return tutao.entity.sys.Group.load(this._author);
};

/**
 * Sets the authorGroupInfo of this Version.
 * @param {Array.<string>} authorGroupInfo The authorGroupInfo of this Version.
 */
tutao.entity.sys.Version.prototype.setAuthorGroupInfo = function(authorGroupInfo) {
  this._authorGroupInfo = authorGroupInfo;
  return this;
};

/**
 * Provides the authorGroupInfo of this Version.
 * @return {Array.<string>} The authorGroupInfo of this Version.
 */
tutao.entity.sys.Version.prototype.getAuthorGroupInfo = function() {
  return this._authorGroupInfo;
};

/**
 * Loads the authorGroupInfo of this Version.
 * @return {Promise.<tutao.entity.sys.GroupInfo>} Resolves to the loaded authorGroupInfo of this Version or an exception if the loading failed.
 */
tutao.entity.sys.Version.prototype.loadAuthorGroupInfo = function() {
  return tutao.entity.sys.GroupInfo.load(this._authorGroupInfo);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.Version.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
