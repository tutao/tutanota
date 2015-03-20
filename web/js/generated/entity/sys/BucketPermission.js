"use strict";

tutao.provide('tutao.entity.sys.BucketPermission');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BucketPermission = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._ops = null;
    this._pubEncBucketKey = null;
    this._pubKeyVersion = null;
    this._symEncBucketKey = null;
    this._type = null;
    this._group = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.BucketPermission.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BucketPermission.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._ops = data.ops;
  this._pubEncBucketKey = data.pubEncBucketKey;
  this._pubKeyVersion = data.pubKeyVersion;
  this._symEncBucketKey = data.symEncBucketKey;
  this._type = data.type;
  this._group = data.group;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.BucketPermission.MODEL_VERSION = '8';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.BucketPermission.PATH = '/rest/sys/bucketpermission';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.BucketPermission.ROOT_INSTANCE_ID = 'A3N5cwB2';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.BucketPermission.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.BucketPermission.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.BucketPermission.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    ops: this._ops, 
    pubEncBucketKey: this._pubEncBucketKey, 
    pubKeyVersion: this._pubKeyVersion, 
    symEncBucketKey: this._symEncBucketKey, 
    type: this._type, 
    group: this._group
  };
};

/**
 * The id of the BucketPermission type.
 */
tutao.entity.sys.BucketPermission.prototype.TYPE_ID = 118;

/**
 * The id of the ops attribute.
 */
tutao.entity.sys.BucketPermission.prototype.OPS_ATTRIBUTE_ID = 127;

/**
 * The id of the pubEncBucketKey attribute.
 */
tutao.entity.sys.BucketPermission.prototype.PUBENCBUCKETKEY_ATTRIBUTE_ID = 125;

/**
 * The id of the pubKeyVersion attribute.
 */
tutao.entity.sys.BucketPermission.prototype.PUBKEYVERSION_ATTRIBUTE_ID = 126;

/**
 * The id of the symEncBucketKey attribute.
 */
tutao.entity.sys.BucketPermission.prototype.SYMENCBUCKETKEY_ATTRIBUTE_ID = 124;

/**
 * The id of the type attribute.
 */
tutao.entity.sys.BucketPermission.prototype.TYPE_ATTRIBUTE_ID = 123;

/**
 * The id of the group attribute.
 */
tutao.entity.sys.BucketPermission.prototype.GROUP_ATTRIBUTE_ID = 128;

/**
 * Provides the id of this BucketPermission.
 * @return {Array.<string>} The id of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this BucketPermission.
 * @param {string} format The format of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this BucketPermission.
 * @return {string} The format of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this BucketPermission.
 * @param {string} permissions The permissions of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this BucketPermission.
 * @return {string} The permissions of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the ops of this BucketPermission.
 * @param {string} ops The ops of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.setOps = function(ops) {
  this._ops = ops;
  return this;
};

/**
 * Provides the ops of this BucketPermission.
 * @return {string} The ops of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.getOps = function() {
  return this._ops;
};

/**
 * Sets the pubEncBucketKey of this BucketPermission.
 * @param {string} pubEncBucketKey The pubEncBucketKey of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.setPubEncBucketKey = function(pubEncBucketKey) {
  this._pubEncBucketKey = pubEncBucketKey;
  return this;
};

/**
 * Provides the pubEncBucketKey of this BucketPermission.
 * @return {string} The pubEncBucketKey of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.getPubEncBucketKey = function() {
  return this._pubEncBucketKey;
};

/**
 * Sets the pubKeyVersion of this BucketPermission.
 * @param {string} pubKeyVersion The pubKeyVersion of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.setPubKeyVersion = function(pubKeyVersion) {
  this._pubKeyVersion = pubKeyVersion;
  return this;
};

/**
 * Provides the pubKeyVersion of this BucketPermission.
 * @return {string} The pubKeyVersion of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.getPubKeyVersion = function() {
  return this._pubKeyVersion;
};

/**
 * Sets the symEncBucketKey of this BucketPermission.
 * @param {string} symEncBucketKey The symEncBucketKey of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.setSymEncBucketKey = function(symEncBucketKey) {
  this._symEncBucketKey = symEncBucketKey;
  return this;
};

/**
 * Provides the symEncBucketKey of this BucketPermission.
 * @return {string} The symEncBucketKey of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.getSymEncBucketKey = function() {
  return this._symEncBucketKey;
};

/**
 * Sets the type of this BucketPermission.
 * @param {string} type The type of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this BucketPermission.
 * @return {string} The type of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.getType = function() {
  return this._type;
};

/**
 * Sets the group of this BucketPermission.
 * @param {string} group The group of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this BucketPermission.
 * @return {string} The group of this BucketPermission.
 */
tutao.entity.sys.BucketPermission.prototype.getGroup = function() {
  return this._group;
};

/**
 * Loads the group of this BucketPermission.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded group of this BucketPermission or an exception if the loading failed.
 */
tutao.entity.sys.BucketPermission.prototype.loadGroup = function() {
  return tutao.entity.sys.Group.load(this._group);
};

/**
 * Loads a BucketPermission from the server.
 * @param {Array.<string>} id The id of the BucketPermission.
 * @return {Promise.<tutao.entity.sys.BucketPermission>} Resolves to the BucketPermission or an exception if the loading failed.
 */
tutao.entity.sys.BucketPermission.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.BucketPermission, tutao.entity.sys.BucketPermission.PATH, id[1], id[0], {"v" : 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple BucketPermissions from the server.
 * @param {Array.<Array.<string>>} ids The ids of the BucketPermissions to load.
 * @return {Promise.<Array.<tutao.entity.sys.BucketPermission>>} Resolves to an array of BucketPermission or rejects with an exception if the loading failed.
 */
tutao.entity.sys.BucketPermission.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.BucketPermission, tutao.entity.sys.BucketPermission.PATH, ids, {"v": 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.BucketPermission.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 8;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.BucketPermission.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of BucketPermissions loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.BucketPermission>>} Resolves to an array of BucketPermission or rejects with an exception if the loading failed.
 */
tutao.entity.sys.BucketPermission.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.BucketPermission, tutao.entity.sys.BucketPermission.PATH, listId, start, count, reverse, {"v": 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.BucketPermission.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.BucketPermission.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
