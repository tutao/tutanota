"use strict";

tutao.provide('tutao.entity.sys.Login');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Login = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._time = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.Login.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Login.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._time = data.time;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.Login.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.Login.PATH = '/rest/sys/login';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.Login.ROOT_INSTANCE_ID = 'A3N5cwAw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.Login.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.Login.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Login.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    time: this._time
  };
};

/**
 * The id of the Login type.
 */
tutao.entity.sys.Login.prototype.TYPE_ID = 48;

/**
 * The id of the time attribute.
 */
tutao.entity.sys.Login.prototype.TIME_ATTRIBUTE_ID = 53;

/**
 * Provides the id of this Login.
 * @return {Array.<string>} The id of this Login.
 */
tutao.entity.sys.Login.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this Login.
 * @param {string} format The format of this Login.
 */
tutao.entity.sys.Login.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Login.
 * @return {string} The format of this Login.
 */
tutao.entity.sys.Login.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this Login.
 * @param {string} permissions The permissions of this Login.
 */
tutao.entity.sys.Login.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Login.
 * @return {string} The permissions of this Login.
 */
tutao.entity.sys.Login.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the time of this Login.
 * @param {Date} time The time of this Login.
 */
tutao.entity.sys.Login.prototype.setTime = function(time) {
  this._time = String(time.getTime());
  return this;
};

/**
 * Provides the time of this Login.
 * @return {Date} The time of this Login.
 */
tutao.entity.sys.Login.prototype.getTime = function() {
  if (isNaN(this._time)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._time);
  }
  return new Date(Number(this._time));
};

/**
 * Loads a Login from the server.
 * @param {Array.<string>} id The id of the Login.
 * @return {Promise.<tutao.entity.sys.Login>} Resolves to the Login or an exception if the loading failed.
 */
tutao.entity.sys.Login.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.Login, tutao.entity.sys.Login.PATH, id[1], id[0], {"v" : 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple Logins from the server.
 * @param {Array.<Array.<string>>} ids The ids of the Logins to load.
 * @return {Promise.<Array.<tutao.entity.sys.Login>>} Resolves to an array of Login or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Login.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.Login, tutao.entity.sys.Login.PATH, ids, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.Login.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 9;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.Login.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of Logins loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.Login>>} Resolves to an array of Login or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Login.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.Login, tutao.entity.sys.Login.PATH, listId, start, count, reverse, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.Login.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.Login.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.Login.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
