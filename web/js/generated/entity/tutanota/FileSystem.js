"use strict";

tutao.provide('tutao.entity.tutanota.FileSystem');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FileSystem = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._files = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.FileSystem.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FileSystem.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._files = data.files;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.FileSystem.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.FileSystem.PATH = '/rest/tutanota/filesystem';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.FileSystem.ROOT_INSTANCE_ID = 'CHR1dGFub3RhABw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.FileSystem.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.FileSystem.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.FileSystem.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    files: this._files
  };
};

/**
 * Provides the id of this FileSystem.
 * @return {string} The id of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this FileSystem.
 * @param {string} format The format of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this FileSystem.
 * @return {string} The format of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this FileSystem.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this FileSystem.
 * @return {string} The ownerEncSessionKey of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this FileSystem.
 * @param {string} ownerGroup The ownerGroup of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this FileSystem.
 * @return {string} The ownerGroup of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this FileSystem.
 * @param {string} permissions The permissions of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this FileSystem.
 * @return {string} The permissions of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the files of this FileSystem.
 * @param {string} files The files of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.setFiles = function(files) {
  this._files = files;
  return this;
};

/**
 * Provides the files of this FileSystem.
 * @return {string} The files of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.getFiles = function() {
  return this._files;
};

/**
 * Loads a FileSystem from the server.
 * @param {string} id The id of the FileSystem.
 * @return {Promise.<tutao.entity.tutanota.FileSystem>} Resolves to the FileSystem or an exception if the loading failed.
 */
tutao.entity.tutanota.FileSystem.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.FileSystem, tutao.entity.tutanota.FileSystem.PATH, id, null, {"v" : "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple FileSystems from the server.
 * @param {Array.<string>} ids The ids of the FileSystems to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.FileSystem>>} Resolves to an array of FileSystem or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.FileSystem.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.FileSystem, tutao.entity.tutanota.FileSystem.PATH, ids, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.FileSystem.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "20";
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.FileSystem.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this FileSystem on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.FileSystem.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.FileSystem.PATH, this, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.FileSystem.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.FileSystem.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.FileSystem.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
