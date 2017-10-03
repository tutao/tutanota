"use strict";

tutao.provide('tutao.entity.sys.EntityEventBatch');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.EntityEventBatch = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._events = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.EntityEventBatch.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.EntityEventBatch.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._events = [];
  for (var i=0; i < data.events.length; i++) {
    this._events.push(new tutao.entity.sys.EntityUpdate(this, data.events[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.EntityEventBatch.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.EntityEventBatch.PATH = '/rest/sys/entityeventbatch';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.EntityEventBatch.ROOT_INSTANCE_ID = 'A3N5cwAENw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.EntityEventBatch.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.EntityEventBatch.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.EntityEventBatch.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    events: tutao.entity.EntityHelper.aggregatesToJsonData(this._events)
  };
};

/**
 * Provides the id of this EntityEventBatch.
 * @return {Array.<string>} The id of this EntityEventBatch.
 */
tutao.entity.sys.EntityEventBatch.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this EntityEventBatch.
 * @param {string} format The format of this EntityEventBatch.
 */
tutao.entity.sys.EntityEventBatch.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this EntityEventBatch.
 * @return {string} The format of this EntityEventBatch.
 */
tutao.entity.sys.EntityEventBatch.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this EntityEventBatch.
 * @param {string} ownerGroup The ownerGroup of this EntityEventBatch.
 */
tutao.entity.sys.EntityEventBatch.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this EntityEventBatch.
 * @return {string} The ownerGroup of this EntityEventBatch.
 */
tutao.entity.sys.EntityEventBatch.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this EntityEventBatch.
 * @param {string} permissions The permissions of this EntityEventBatch.
 */
tutao.entity.sys.EntityEventBatch.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this EntityEventBatch.
 * @return {string} The permissions of this EntityEventBatch.
 */
tutao.entity.sys.EntityEventBatch.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Provides the events of this EntityEventBatch.
 * @return {Array.<tutao.entity.sys.EntityUpdate>} The events of this EntityEventBatch.
 */
tutao.entity.sys.EntityEventBatch.prototype.getEvents = function() {
  return this._events;
};

/**
 * Loads a EntityEventBatch from the server.
 * @param {Array.<string>} id The id of the EntityEventBatch.
 * @return {Promise.<tutao.entity.sys.EntityEventBatch>} Resolves to the EntityEventBatch or an exception if the loading failed.
 */
tutao.entity.sys.EntityEventBatch.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.EntityEventBatch, tutao.entity.sys.EntityEventBatch.PATH, id[1], id[0], {"v" : "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple EntityEventBatchs from the server.
 * @param {Array.<Array.<string>>} ids The ids of the EntityEventBatchs to load.
 * @return {Promise.<Array.<tutao.entity.sys.EntityEventBatch>>} Resolves to an array of EntityEventBatch or rejects with an exception if the loading failed.
 */
tutao.entity.sys.EntityEventBatch.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.EntityEventBatch, tutao.entity.sys.EntityEventBatch.PATH, ids, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this EntityEventBatch on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.EntityEventBatch.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.EntityEventBatch.PATH, this, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of EntityEventBatchs loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.EntityEventBatch>>} Resolves to an array of EntityEventBatch or rejects with an exception if the loading failed.
 */
tutao.entity.sys.EntityEventBatch.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.EntityEventBatch, tutao.entity.sys.EntityEventBatch.PATH, listId, start, count, reverse, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.EntityEventBatch.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.EntityEventBatch.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.EntityEventBatch.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
