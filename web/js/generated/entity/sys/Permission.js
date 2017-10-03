"use strict";

tutao.provide('tutao.entity.sys.Permission');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Permission = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._bucketEncSessionKey = null;
    this._ops = null;
    this._symEncSessionKey = null;
    this._type = null;
    this._bucket = null;
    this._group = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.Permission.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Permission.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._bucketEncSessionKey = data.bucketEncSessionKey;
  this._ops = data.ops;
  this._symEncSessionKey = data.symEncSessionKey;
  this._type = data.type;
  this._bucket = (data.bucket) ? new tutao.entity.sys.Bucket(this, data.bucket) : null;
  this._group = data.group;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.Permission.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.Permission.PATH = '/rest/sys/permission';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.Permission.ROOT_INSTANCE_ID = 'A3N5cwAAhA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.Permission.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.Permission.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Permission.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    bucketEncSessionKey: this._bucketEncSessionKey, 
    ops: this._ops, 
    symEncSessionKey: this._symEncSessionKey, 
    type: this._type, 
    bucket: tutao.entity.EntityHelper.aggregatesToJsonData(this._bucket), 
    group: this._group
  };
};

/**
 * Provides the id of this Permission.
 * @return {Array.<string>} The id of this Permission.
 */
tutao.entity.sys.Permission.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this Permission.
 * @param {string} format The format of this Permission.
 */
tutao.entity.sys.Permission.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Permission.
 * @return {string} The format of this Permission.
 */
tutao.entity.sys.Permission.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this Permission.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this Permission.
 */
tutao.entity.sys.Permission.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this Permission.
 * @return {string} The ownerEncSessionKey of this Permission.
 */
tutao.entity.sys.Permission.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this Permission.
 * @param {string} ownerGroup The ownerGroup of this Permission.
 */
tutao.entity.sys.Permission.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this Permission.
 * @return {string} The ownerGroup of this Permission.
 */
tutao.entity.sys.Permission.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this Permission.
 * @param {string} permissions The permissions of this Permission.
 */
tutao.entity.sys.Permission.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Permission.
 * @return {string} The permissions of this Permission.
 */
tutao.entity.sys.Permission.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the bucketEncSessionKey of this Permission.
 * @param {string} bucketEncSessionKey The bucketEncSessionKey of this Permission.
 */
tutao.entity.sys.Permission.prototype.setBucketEncSessionKey = function(bucketEncSessionKey) {
  this._bucketEncSessionKey = bucketEncSessionKey;
  return this;
};

/**
 * Provides the bucketEncSessionKey of this Permission.
 * @return {string} The bucketEncSessionKey of this Permission.
 */
tutao.entity.sys.Permission.prototype.getBucketEncSessionKey = function() {
  return this._bucketEncSessionKey;
};

/**
 * Sets the ops of this Permission.
 * @param {string} ops The ops of this Permission.
 */
tutao.entity.sys.Permission.prototype.setOps = function(ops) {
  this._ops = ops;
  return this;
};

/**
 * Provides the ops of this Permission.
 * @return {string} The ops of this Permission.
 */
tutao.entity.sys.Permission.prototype.getOps = function() {
  return this._ops;
};

/**
 * Sets the symEncSessionKey of this Permission.
 * @param {string} symEncSessionKey The symEncSessionKey of this Permission.
 */
tutao.entity.sys.Permission.prototype.setSymEncSessionKey = function(symEncSessionKey) {
  this._symEncSessionKey = symEncSessionKey;
  return this;
};

/**
 * Provides the symEncSessionKey of this Permission.
 * @return {string} The symEncSessionKey of this Permission.
 */
tutao.entity.sys.Permission.prototype.getSymEncSessionKey = function() {
  return this._symEncSessionKey;
};

/**
 * Sets the type of this Permission.
 * @param {string} type The type of this Permission.
 */
tutao.entity.sys.Permission.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this Permission.
 * @return {string} The type of this Permission.
 */
tutao.entity.sys.Permission.prototype.getType = function() {
  return this._type;
};

/**
 * Sets the bucket of this Permission.
 * @param {tutao.entity.sys.Bucket} bucket The bucket of this Permission.
 */
tutao.entity.sys.Permission.prototype.setBucket = function(bucket) {
  this._bucket = bucket;
  return this;
};

/**
 * Provides the bucket of this Permission.
 * @return {tutao.entity.sys.Bucket} The bucket of this Permission.
 */
tutao.entity.sys.Permission.prototype.getBucket = function() {
  return this._bucket;
};

/**
 * Sets the group of this Permission.
 * @param {string} group The group of this Permission.
 */
tutao.entity.sys.Permission.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this Permission.
 * @return {string} The group of this Permission.
 */
tutao.entity.sys.Permission.prototype.getGroup = function() {
  return this._group;
};

/**
 * Loads the group of this Permission.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded group of this Permission or an exception if the loading failed.
 */
tutao.entity.sys.Permission.prototype.loadGroup = function() {
  return tutao.entity.sys.Group.load(this._group);
};

/**
 * Loads a Permission from the server.
 * @param {Array.<string>} id The id of the Permission.
 * @return {Promise.<tutao.entity.sys.Permission>} Resolves to the Permission or an exception if the loading failed.
 */
tutao.entity.sys.Permission.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.Permission, tutao.entity.sys.Permission.PATH, id[1], id[0], {"v" : "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple Permissions from the server.
 * @param {Array.<Array.<string>>} ids The ids of the Permissions to load.
 * @return {Promise.<Array.<tutao.entity.sys.Permission>>} Resolves to an array of Permission or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Permission.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.Permission, tutao.entity.sys.Permission.PATH, ids, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this Permission on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.Permission.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.Permission.PATH, this, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of Permissions loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.Permission>>} Resolves to an array of Permission or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Permission.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.Permission, tutao.entity.sys.Permission.PATH, listId, start, count, reverse, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.Permission.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.Permission.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.Permission.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
