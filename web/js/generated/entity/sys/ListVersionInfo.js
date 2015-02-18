"use strict";

tutao.provide('tutao.entity.sys.ListVersionInfo');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ListVersionInfo = function(data) {
  if (data) {
    this.__format = data._format;
    this.__id = data._id;
    this.__permissions = data._permissions;
    this._operation = data.operation;
    this._timestamp = data.timestamp;
    this._author = data.author;
    this._authorGroupInfo = data.authorGroupInfo;
    this._version = data.version;
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._operation = null;
    this._timestamp = null;
    this._author = null;
    this._authorGroupInfo = null;
    this._version = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.ListVersionInfo.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.ListVersionInfo.MODEL_VERSION = '7';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.ListVersionInfo.PATH = '/rest/sys/listversioninfo';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.ListVersionInfo.ROOT_INSTANCE_ID = 'A3N5cwAA-g';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.ListVersionInfo.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.ListVersionInfo.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.ListVersionInfo.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    operation: this._operation, 
    timestamp: this._timestamp, 
    author: this._author, 
    authorGroupInfo: this._authorGroupInfo, 
    version: this._version
  };
};

/**
 * The id of the ListVersionInfo type.
 */
tutao.entity.sys.ListVersionInfo.prototype.TYPE_ID = 250;

/**
 * The id of the operation attribute.
 */
tutao.entity.sys.ListVersionInfo.prototype.OPERATION_ATTRIBUTE_ID = 256;

/**
 * The id of the timestamp attribute.
 */
tutao.entity.sys.ListVersionInfo.prototype.TIMESTAMP_ATTRIBUTE_ID = 255;

/**
 * The id of the author attribute.
 */
tutao.entity.sys.ListVersionInfo.prototype.AUTHOR_ATTRIBUTE_ID = 258;

/**
 * The id of the authorGroupInfo attribute.
 */
tutao.entity.sys.ListVersionInfo.prototype.AUTHORGROUPINFO_ATTRIBUTE_ID = 259;

/**
 * The id of the version attribute.
 */
tutao.entity.sys.ListVersionInfo.prototype.VERSION_ATTRIBUTE_ID = 257;

/**
 * Provides the id of this ListVersionInfo.
 * @return {Array.<string>} The id of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this ListVersionInfo.
 * @param {string} format The format of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ListVersionInfo.
 * @return {string} The format of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this ListVersionInfo.
 * @param {string} permissions The permissions of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this ListVersionInfo.
 * @return {string} The permissions of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the operation of this ListVersionInfo.
 * @param {string} operation The operation of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.setOperation = function(operation) {
  this._operation = operation;
  return this;
};

/**
 * Provides the operation of this ListVersionInfo.
 * @return {string} The operation of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.getOperation = function() {
  return this._operation;
};

/**
 * Sets the timestamp of this ListVersionInfo.
 * @param {Date} timestamp The timestamp of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.setTimestamp = function(timestamp) {
  this._timestamp = String(timestamp.getTime());
  return this;
};

/**
 * Provides the timestamp of this ListVersionInfo.
 * @return {Date} The timestamp of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.getTimestamp = function() {
  if (isNaN(this._timestamp)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._timestamp);
  }
  return new Date(Number(this._timestamp));
};

/**
 * Sets the author of this ListVersionInfo.
 * @param {string} author The author of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.setAuthor = function(author) {
  this._author = author;
  return this;
};

/**
 * Provides the author of this ListVersionInfo.
 * @return {string} The author of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.getAuthor = function() {
  return this._author;
};

/**
 * Loads the author of this ListVersionInfo.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded author of this ListVersionInfo or an exception if the loading failed.
 */
tutao.entity.sys.ListVersionInfo.prototype.loadAuthor = function() {
  return tutao.entity.sys.Group.load(this._author);
};

/**
 * Sets the authorGroupInfo of this ListVersionInfo.
 * @param {Array.<string>} authorGroupInfo The authorGroupInfo of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.setAuthorGroupInfo = function(authorGroupInfo) {
  this._authorGroupInfo = authorGroupInfo;
  return this;
};

/**
 * Provides the authorGroupInfo of this ListVersionInfo.
 * @return {Array.<string>} The authorGroupInfo of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.getAuthorGroupInfo = function() {
  return this._authorGroupInfo;
};

/**
 * Loads the authorGroupInfo of this ListVersionInfo.
 * @return {Promise.<tutao.entity.sys.GroupInfo>} Resolves to the loaded authorGroupInfo of this ListVersionInfo or an exception if the loading failed.
 */
tutao.entity.sys.ListVersionInfo.prototype.loadAuthorGroupInfo = function() {
  return tutao.entity.sys.GroupInfo.load(this._authorGroupInfo);
};

/**
 * Sets the version of this ListVersionInfo.
 * @param {Array.<string>} version The version of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.setVersion = function(version) {
  this._version = version;
  return this;
};

/**
 * Provides the version of this ListVersionInfo.
 * @return {Array.<string>} The version of this ListVersionInfo.
 */
tutao.entity.sys.ListVersionInfo.prototype.getVersion = function() {
  return this._version;
};

/**
 * Loads a ListVersionInfo from the server.
 * @param {Array.<string>} id The id of the ListVersionInfo.
 * @return {Promise.<tutao.entity.sys.ListVersionInfo>} Resolves to the ListVersionInfo or an exception if the loading failed.
 */
tutao.entity.sys.ListVersionInfo.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.ListVersionInfo, tutao.entity.sys.ListVersionInfo.PATH, id[1], id[0], {"v" : 7}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple ListVersionInfos from the server.
 * @param {Array.<Array.<string>>} ids The ids of the ListVersionInfos to load.
 * @return {Promise.<Array.<tutao.entity.sys.ListVersionInfo>>} Resolves to an array of ListVersionInfo or rejects with an exception if the loading failed.
 */
tutao.entity.sys.ListVersionInfo.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.ListVersionInfo, tutao.entity.sys.ListVersionInfo.PATH, ids, {"v": 7}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.ListVersionInfo.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 7;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.ListVersionInfo.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of ListVersionInfos loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.ListVersionInfo>>} Resolves to an array of ListVersionInfo or rejects with an exception if the loading failed.
 */
tutao.entity.sys.ListVersionInfo.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.ListVersionInfo, tutao.entity.sys.ListVersionInfo.PATH, listId, start, count, reverse, {"v": 7}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.ListVersionInfo.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.ListVersionInfo.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
