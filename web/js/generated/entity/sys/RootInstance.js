"use strict";

tutao.provide('tutao.entity.sys.RootInstance');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RootInstance = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._reference = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.RootInstance.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RootInstance.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._reference = data.reference;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.RootInstance.MODEL_VERSION = '23';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.RootInstance.PATH = '/rest/sys/rootinstance';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.RootInstance.ROOT_INSTANCE_ID = 'A3N5cwAA5w';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.RootInstance.GENERATED_ID = false;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.RootInstance.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.RootInstance.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    reference: this._reference
  };
};

/**
 * Sets the custom id of this RootInstance.
 * @param {Array.<string>} id The custom id of this RootInstance.
 */
tutao.entity.sys.RootInstance.prototype.setId = function(id) {
  this.__id = id;
};

/**
 * Provides the id of this RootInstance.
 * @return {Array.<string>} The id of this RootInstance.
 */
tutao.entity.sys.RootInstance.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this RootInstance.
 * @param {string} format The format of this RootInstance.
 */
tutao.entity.sys.RootInstance.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this RootInstance.
 * @return {string} The format of this RootInstance.
 */
tutao.entity.sys.RootInstance.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this RootInstance.
 * @param {string} ownerGroup The ownerGroup of this RootInstance.
 */
tutao.entity.sys.RootInstance.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this RootInstance.
 * @return {string} The ownerGroup of this RootInstance.
 */
tutao.entity.sys.RootInstance.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this RootInstance.
 * @param {string} permissions The permissions of this RootInstance.
 */
tutao.entity.sys.RootInstance.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this RootInstance.
 * @return {string} The permissions of this RootInstance.
 */
tutao.entity.sys.RootInstance.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the reference of this RootInstance.
 * @param {string} reference The reference of this RootInstance.
 */
tutao.entity.sys.RootInstance.prototype.setReference = function(reference) {
  this._reference = reference;
  return this;
};

/**
 * Provides the reference of this RootInstance.
 * @return {string} The reference of this RootInstance.
 */
tutao.entity.sys.RootInstance.prototype.getReference = function() {
  return this._reference;
};

/**
 * Loads a RootInstance from the server.
 * @param {Array.<string>} id The id of the RootInstance.
 * @return {Promise.<tutao.entity.sys.RootInstance>} Resolves to the RootInstance or an exception if the loading failed.
 */
tutao.entity.sys.RootInstance.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.RootInstance, tutao.entity.sys.RootInstance.PATH, id[1], id[0], {"v" : "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple RootInstances from the server.
 * @param {Array.<Array.<string>>} ids The ids of the RootInstances to load.
 * @return {Promise.<Array.<tutao.entity.sys.RootInstance>>} Resolves to an array of RootInstance or rejects with an exception if the loading failed.
 */
tutao.entity.sys.RootInstance.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.RootInstance, tutao.entity.sys.RootInstance.PATH, ids, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this RootInstance on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.RootInstance.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.RootInstance.PATH, this, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of RootInstances loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.RootInstance>>} Resolves to an array of RootInstance or rejects with an exception if the loading failed.
 */
tutao.entity.sys.RootInstance.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.RootInstance, tutao.entity.sys.RootInstance.PATH, listId, start, count, reverse, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.RootInstance.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.RootInstance.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.RootInstance.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
