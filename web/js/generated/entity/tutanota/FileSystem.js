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
    this.__permissions = null;
    this._shareBucketId = null;
    this._symEncShareBucketKey = null;
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
  this.__permissions = data._permissions;
  this._shareBucketId = data.shareBucketId;
  this._symEncShareBucketKey = data.symEncShareBucketKey;
  this._files = data.files;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.FileSystem.MODEL_VERSION = '11';

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
    _permissions: this.__permissions, 
    shareBucketId: this._shareBucketId, 
    symEncShareBucketKey: this._symEncShareBucketKey, 
    files: this._files
  };
};

/**
 * The id of the FileSystem type.
 */
tutao.entity.tutanota.FileSystem.prototype.TYPE_ID = 28;

/**
 * The id of the shareBucketId attribute.
 */
tutao.entity.tutanota.FileSystem.prototype.SHAREBUCKETID_ATTRIBUTE_ID = 33;

/**
 * The id of the symEncShareBucketKey attribute.
 */
tutao.entity.tutanota.FileSystem.prototype.SYMENCSHAREBUCKETKEY_ATTRIBUTE_ID = 34;

/**
 * The id of the files attribute.
 */
tutao.entity.tutanota.FileSystem.prototype.FILES_ATTRIBUTE_ID = 35;

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
 * Sets the shareBucketId of this FileSystem.
 * @param {string} shareBucketId The shareBucketId of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.setShareBucketId = function(shareBucketId) {
  this._shareBucketId = shareBucketId;
  return this;
};

/**
 * Provides the shareBucketId of this FileSystem.
 * @return {string} The shareBucketId of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.getShareBucketId = function() {
  return this._shareBucketId;
};

/**
 * Sets the symEncShareBucketKey of this FileSystem.
 * @param {string} symEncShareBucketKey The symEncShareBucketKey of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.setSymEncShareBucketKey = function(symEncShareBucketKey) {
  this._symEncShareBucketKey = symEncShareBucketKey;
  return this;
};

/**
 * Provides the symEncShareBucketKey of this FileSystem.
 * @return {string} The symEncShareBucketKey of this FileSystem.
 */
tutao.entity.tutanota.FileSystem.prototype.getSymEncShareBucketKey = function() {
  return this._symEncShareBucketKey;
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
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.FileSystem, tutao.entity.tutanota.FileSystem.PATH, id, null, {"v" : 11}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple FileSystems from the server.
 * @param {Array.<string>} ids The ids of the FileSystems to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.FileSystem>>} Resolves to an array of FileSystem or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.FileSystem.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.FileSystem, tutao.entity.tutanota.FileSystem.PATH, ids, {"v": 11}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
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
