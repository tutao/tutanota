"use strict";

goog.provide('tutao.entity.monitor.CounterSnapshot');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.monitor.CounterSnapshot = function(data) {
  if (data) {
    this.__format = data._format;
    this.__id = data._id;
    this.__permissions = data._permissions;
    this._value = data.value;
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._value = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.monitor.CounterSnapshot.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.monitor.CounterSnapshot.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.monitor.CounterSnapshot.PATH = '/rest/monitor/countersnapshot';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.monitor.CounterSnapshot.ROOT_INSTANCE_ID = 'B21vbml0b3IAAA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.monitor.CounterSnapshot.GENERATED_ID = false;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.monitor.CounterSnapshot.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.monitor.CounterSnapshot.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    value: this._value
  };
};

/**
 * The id of the CounterSnapshot type.
 */
tutao.entity.monitor.CounterSnapshot.prototype.TYPE_ID = 0;

/**
 * The id of the value attribute.
 */
tutao.entity.monitor.CounterSnapshot.prototype.VALUE_ATTRIBUTE_ID = 5;

/**
 * Sets the custom id of this CounterSnapshot.
 * @param {Array.<string>} id The custom id of this CounterSnapshot.
 */
tutao.entity.monitor.CounterSnapshot.prototype.setId = function(id) {
  this.__id = id;
};

/**
 * Provides the id of this CounterSnapshot.
 * @return {Array.<string>} The id of this CounterSnapshot.
 */
tutao.entity.monitor.CounterSnapshot.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this CounterSnapshot.
 * @param {string} format The format of this CounterSnapshot.
 */
tutao.entity.monitor.CounterSnapshot.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CounterSnapshot.
 * @return {string} The format of this CounterSnapshot.
 */
tutao.entity.monitor.CounterSnapshot.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this CounterSnapshot.
 * @param {string} permissions The permissions of this CounterSnapshot.
 */
tutao.entity.monitor.CounterSnapshot.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this CounterSnapshot.
 * @return {string} The permissions of this CounterSnapshot.
 */
tutao.entity.monitor.CounterSnapshot.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the value of this CounterSnapshot.
 * @param {string} value The value of this CounterSnapshot.
 */
tutao.entity.monitor.CounterSnapshot.prototype.setValue = function(value) {
  this._value = value;
  return this;
};

/**
 * Provides the value of this CounterSnapshot.
 * @return {string} The value of this CounterSnapshot.
 */
tutao.entity.monitor.CounterSnapshot.prototype.getValue = function() {
  return this._value;
};

/**
 * Loads a CounterSnapshot from the server.
 * @param {Array.<string>} id The id of the CounterSnapshot.
 * @return {Promise.<tutao.entity.monitor.CounterSnapshot>} Resolves to the CounterSnapshot or an exception if the loading failed.
 */
tutao.entity.monitor.CounterSnapshot.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.monitor.CounterSnapshot, tutao.entity.monitor.CounterSnapshot.PATH, id[1], id[0], {"v" : 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple CounterSnapshots from the server.
 * @param {Array.<Array.<string>>} ids The ids of the CounterSnapshots to load.
 * @return {Promise.<Array.<tutao.entity.monitor.CounterSnapshot>>} Resolves to an array of CounterSnapshot or rejects with an exception if the loading failed.
 */
tutao.entity.monitor.CounterSnapshot.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.monitor.CounterSnapshot, tutao.entity.monitor.CounterSnapshot.PATH, ids, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.monitor.CounterSnapshot.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 1;
  return tutao.locator.entityRestClient.putElement(tutao.entity.monitor.CounterSnapshot.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of CounterSnapshots loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.monitor.CounterSnapshot>>} Resolves to an array of CounterSnapshot or rejects with an exception if the loading failed.
 */
tutao.entity.monitor.CounterSnapshot.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.monitor.CounterSnapshot, tutao.entity.monitor.CounterSnapshot.PATH, listId, start, count, reverse, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.monitor.CounterSnapshot.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.monitor.CounterSnapshot.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
