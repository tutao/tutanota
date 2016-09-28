"use strict";

tutao.provide('tutao.entity.sys.Shares');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Shares = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._incoming = null;
    this._outgoing = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.Shares.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Shares.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._incoming = data.incoming;
  this._outgoing = data.outgoing;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.Shares.MODEL_VERSION = '19';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.Shares.PATH = '/rest/sys/shares';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.Shares.ROOT_INSTANCE_ID = 'A3N5cwABGg';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.Shares.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.Shares.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Shares.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    incoming: this._incoming, 
    outgoing: this._outgoing
  };
};

/**
 * Provides the id of this Shares.
 * @return {string} The id of this Shares.
 */
tutao.entity.sys.Shares.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this Shares.
 * @param {string} format The format of this Shares.
 */
tutao.entity.sys.Shares.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Shares.
 * @return {string} The format of this Shares.
 */
tutao.entity.sys.Shares.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this Shares.
 * @param {string} ownerGroup The ownerGroup of this Shares.
 */
tutao.entity.sys.Shares.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this Shares.
 * @return {string} The ownerGroup of this Shares.
 */
tutao.entity.sys.Shares.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this Shares.
 * @param {string} permissions The permissions of this Shares.
 */
tutao.entity.sys.Shares.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Shares.
 * @return {string} The permissions of this Shares.
 */
tutao.entity.sys.Shares.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the incoming of this Shares.
 * @param {string} incoming The incoming of this Shares.
 */
tutao.entity.sys.Shares.prototype.setIncoming = function(incoming) {
  this._incoming = incoming;
  return this;
};

/**
 * Provides the incoming of this Shares.
 * @return {string} The incoming of this Shares.
 */
tutao.entity.sys.Shares.prototype.getIncoming = function() {
  return this._incoming;
};

/**
 * Sets the outgoing of this Shares.
 * @param {string} outgoing The outgoing of this Shares.
 */
tutao.entity.sys.Shares.prototype.setOutgoing = function(outgoing) {
  this._outgoing = outgoing;
  return this;
};

/**
 * Provides the outgoing of this Shares.
 * @return {string} The outgoing of this Shares.
 */
tutao.entity.sys.Shares.prototype.getOutgoing = function() {
  return this._outgoing;
};

/**
 * Loads a Shares from the server.
 * @param {string} id The id of the Shares.
 * @return {Promise.<tutao.entity.sys.Shares>} Resolves to the Shares or an exception if the loading failed.
 */
tutao.entity.sys.Shares.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.Shares, tutao.entity.sys.Shares.PATH, id, null, {"v" : "19"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple Sharess from the server.
 * @param {Array.<string>} ids The ids of the Sharess to load.
 * @return {Promise.<Array.<tutao.entity.sys.Shares>>} Resolves to an array of Shares or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Shares.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.Shares, tutao.entity.sys.Shares.PATH, ids, {"v": "19"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this Shares on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.Shares.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.Shares.PATH, this, {"v": "19"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.Shares.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.Shares.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.Shares.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
