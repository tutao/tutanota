"use strict";

goog.provide('tutao.entity.monitor.LogEntry');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.monitor.LogEntry = function(data) {
  if (data) {
    this.__format = data._format;
    this.__id = data._id;
    this.__permissions = data._permissions;
    this._agent = data.agent;
    this._date = data.date;
    this._level = data.level;
    this._logger = data.logger;
    this._message = data.message;
    this._server = data.server;
    this._source = data.source;
    this._thread = data.thread;
    this._url = data.url;
    this._userId = data.userId;
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._agent = null;
    this._date = null;
    this._level = null;
    this._logger = null;
    this._message = null;
    this._server = null;
    this._source = null;
    this._thread = null;
    this._url = null;
    this._userId = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.monitor.LogEntry.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.monitor.LogEntry.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.monitor.LogEntry.PATH = '/rest/monitor/logentry';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.monitor.LogEntry.ROOT_INSTANCE_ID = 'B21vbml0b3IAGw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.monitor.LogEntry.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.monitor.LogEntry.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.monitor.LogEntry.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    agent: this._agent, 
    date: this._date, 
    level: this._level, 
    logger: this._logger, 
    message: this._message, 
    server: this._server, 
    source: this._source, 
    thread: this._thread, 
    url: this._url, 
    userId: this._userId
  };
};

/**
 * The id of the LogEntry type.
 */
tutao.entity.monitor.LogEntry.prototype.TYPE_ID = 27;

/**
 * The id of the agent attribute.
 */
tutao.entity.monitor.LogEntry.prototype.AGENT_ATTRIBUTE_ID = 37;

/**
 * The id of the date attribute.
 */
tutao.entity.monitor.LogEntry.prototype.DATE_ATTRIBUTE_ID = 33;

/**
 * The id of the level attribute.
 */
tutao.entity.monitor.LogEntry.prototype.LEVEL_ATTRIBUTE_ID = 34;

/**
 * The id of the logger attribute.
 */
tutao.entity.monitor.LogEntry.prototype.LOGGER_ATTRIBUTE_ID = 38;

/**
 * The id of the message attribute.
 */
tutao.entity.monitor.LogEntry.prototype.MESSAGE_ATTRIBUTE_ID = 41;

/**
 * The id of the server attribute.
 */
tutao.entity.monitor.LogEntry.prototype.SERVER_ATTRIBUTE_ID = 32;

/**
 * The id of the source attribute.
 */
tutao.entity.monitor.LogEntry.prototype.SOURCE_ATTRIBUTE_ID = 39;

/**
 * The id of the thread attribute.
 */
tutao.entity.monitor.LogEntry.prototype.THREAD_ATTRIBUTE_ID = 40;

/**
 * The id of the url attribute.
 */
tutao.entity.monitor.LogEntry.prototype.URL_ATTRIBUTE_ID = 36;

/**
 * The id of the userId attribute.
 */
tutao.entity.monitor.LogEntry.prototype.USERID_ATTRIBUTE_ID = 35;

/**
 * Provides the id of this LogEntry.
 * @return {Array.<string>} The id of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this LogEntry.
 * @param {string} format The format of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this LogEntry.
 * @return {string} The format of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this LogEntry.
 * @param {string} permissions The permissions of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this LogEntry.
 * @return {string} The permissions of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the agent of this LogEntry.
 * @param {string} agent The agent of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setAgent = function(agent) {
  this._agent = agent;
  return this;
};

/**
 * Provides the agent of this LogEntry.
 * @return {string} The agent of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getAgent = function() {
  return this._agent;
};

/**
 * Sets the date of this LogEntry.
 * @param {Date} date The date of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setDate = function(date) {
  this._date = String(date.getTime());
  return this;
};

/**
 * Provides the date of this LogEntry.
 * @return {Date} The date of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getDate = function() {
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the level of this LogEntry.
 * @param {string} level The level of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setLevel = function(level) {
  this._level = level;
  return this;
};

/**
 * Provides the level of this LogEntry.
 * @return {string} The level of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getLevel = function() {
  return this._level;
};

/**
 * Sets the logger of this LogEntry.
 * @param {string} logger The logger of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setLogger = function(logger) {
  this._logger = logger;
  return this;
};

/**
 * Provides the logger of this LogEntry.
 * @return {string} The logger of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getLogger = function() {
  return this._logger;
};

/**
 * Sets the message of this LogEntry.
 * @param {string} message The message of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setMessage = function(message) {
  this._message = message;
  return this;
};

/**
 * Provides the message of this LogEntry.
 * @return {string} The message of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getMessage = function() {
  return this._message;
};

/**
 * Sets the server of this LogEntry.
 * @param {string} server The server of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setServer = function(server) {
  this._server = server;
  return this;
};

/**
 * Provides the server of this LogEntry.
 * @return {string} The server of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getServer = function() {
  return this._server;
};

/**
 * Sets the source of this LogEntry.
 * @param {string} source The source of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setSource = function(source) {
  this._source = source;
  return this;
};

/**
 * Provides the source of this LogEntry.
 * @return {string} The source of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getSource = function() {
  return this._source;
};

/**
 * Sets the thread of this LogEntry.
 * @param {string} thread The thread of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setThread = function(thread) {
  this._thread = thread;
  return this;
};

/**
 * Provides the thread of this LogEntry.
 * @return {string} The thread of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getThread = function() {
  return this._thread;
};

/**
 * Sets the url of this LogEntry.
 * @param {string} url The url of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setUrl = function(url) {
  this._url = url;
  return this;
};

/**
 * Provides the url of this LogEntry.
 * @return {string} The url of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getUrl = function() {
  return this._url;
};

/**
 * Sets the userId of this LogEntry.
 * @param {string} userId The userId of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.setUserId = function(userId) {
  this._userId = userId;
  return this;
};

/**
 * Provides the userId of this LogEntry.
 * @return {string} The userId of this LogEntry.
 */
tutao.entity.monitor.LogEntry.prototype.getUserId = function() {
  return this._userId;
};

/**
 * Loads a LogEntry from the server.
 * @param {Array.<string>} id The id of the LogEntry.
 * @return {Promise.<tutao.entity.monitor.LogEntry>} Resolves to the LogEntry or an exception if the loading failed.
 */
tutao.entity.monitor.LogEntry.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.monitor.LogEntry, tutao.entity.monitor.LogEntry.PATH, id[1], id[0], {"v" : 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple LogEntrys from the server.
 * @param {Array.<Array.<string>>} ids The ids of the LogEntrys to load.
 * @return {Promise.<Array.<tutao.entity.monitor.LogEntry>>} Resolves to an array of LogEntry or rejects with an exception if the loading failed.
 */
tutao.entity.monitor.LogEntry.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.monitor.LogEntry, tutao.entity.monitor.LogEntry.PATH, ids, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.monitor.LogEntry.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 1;
  return tutao.locator.entityRestClient.putElement(tutao.entity.monitor.LogEntry.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of LogEntrys loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.monitor.LogEntry>>} Resolves to an array of LogEntry or rejects with an exception if the loading failed.
 */
tutao.entity.monitor.LogEntry.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.monitor.LogEntry, tutao.entity.monitor.LogEntry.PATH, listId, start, count, reverse, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.monitor.LogEntry.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.monitor.LogEntry.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
