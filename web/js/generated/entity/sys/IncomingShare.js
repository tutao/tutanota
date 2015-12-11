"use strict";

tutao.provide('tutao.entity.sys.IncomingShare');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.IncomingShare = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._app = null;
    this._referenceId = null;
    this._referenceListId = null;
    this._shareType = null;
    this._bucketPermission = null;
    this._ownerGroup = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.IncomingShare.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.IncomingShare.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._app = data.app;
  this._referenceId = data.referenceId;
  this._referenceListId = data.referenceListId;
  this._shareType = data.shareType;
  this._bucketPermission = data.bucketPermission;
  this._ownerGroup = data.ownerGroup;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.IncomingShare.MODEL_VERSION = '14';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.IncomingShare.PATH = '/rest/sys/incomingshare';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.IncomingShare.ROOT_INSTANCE_ID = 'A3N5cwABBA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.IncomingShare.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.IncomingShare.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.IncomingShare.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    app: this._app, 
    referenceId: this._referenceId, 
    referenceListId: this._referenceListId, 
    shareType: this._shareType, 
    bucketPermission: this._bucketPermission, 
    ownerGroup: this._ownerGroup
  };
};

/**
 * The id of the IncomingShare type.
 */
tutao.entity.sys.IncomingShare.prototype.TYPE_ID = 260;

/**
 * The id of the app attribute.
 */
tutao.entity.sys.IncomingShare.prototype.APP_ATTRIBUTE_ID = 265;

/**
 * The id of the referenceId attribute.
 */
tutao.entity.sys.IncomingShare.prototype.REFERENCEID_ATTRIBUTE_ID = 268;

/**
 * The id of the referenceListId attribute.
 */
tutao.entity.sys.IncomingShare.prototype.REFERENCELISTID_ATTRIBUTE_ID = 267;

/**
 * The id of the shareType attribute.
 */
tutao.entity.sys.IncomingShare.prototype.SHARETYPE_ATTRIBUTE_ID = 266;

/**
 * The id of the bucketPermission attribute.
 */
tutao.entity.sys.IncomingShare.prototype.BUCKETPERMISSION_ATTRIBUTE_ID = 270;

/**
 * The id of the ownerGroup attribute.
 */
tutao.entity.sys.IncomingShare.prototype.OWNERGROUP_ATTRIBUTE_ID = 269;

/**
 * Provides the id of this IncomingShare.
 * @return {Array.<string>} The id of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this IncomingShare.
 * @param {string} format The format of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this IncomingShare.
 * @return {string} The format of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this IncomingShare.
 * @param {string} permissions The permissions of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this IncomingShare.
 * @return {string} The permissions of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the app of this IncomingShare.
 * @param {string} app The app of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.setApp = function(app) {
  this._app = app;
  return this;
};

/**
 * Provides the app of this IncomingShare.
 * @return {string} The app of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.getApp = function() {
  return this._app;
};

/**
 * Sets the referenceId of this IncomingShare.
 * @param {string} referenceId The referenceId of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.setReferenceId = function(referenceId) {
  this._referenceId = referenceId;
  return this;
};

/**
 * Provides the referenceId of this IncomingShare.
 * @return {string} The referenceId of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.getReferenceId = function() {
  return this._referenceId;
};

/**
 * Sets the referenceListId of this IncomingShare.
 * @param {string} referenceListId The referenceListId of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.setReferenceListId = function(referenceListId) {
  this._referenceListId = referenceListId;
  return this;
};

/**
 * Provides the referenceListId of this IncomingShare.
 * @return {string} The referenceListId of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.getReferenceListId = function() {
  return this._referenceListId;
};

/**
 * Sets the shareType of this IncomingShare.
 * @param {string} shareType The shareType of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.setShareType = function(shareType) {
  this._shareType = shareType;
  return this;
};

/**
 * Provides the shareType of this IncomingShare.
 * @return {string} The shareType of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.getShareType = function() {
  return this._shareType;
};

/**
 * Sets the bucketPermission of this IncomingShare.
 * @param {Array.<string>} bucketPermission The bucketPermission of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.setBucketPermission = function(bucketPermission) {
  this._bucketPermission = bucketPermission;
  return this;
};

/**
 * Provides the bucketPermission of this IncomingShare.
 * @return {Array.<string>} The bucketPermission of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.getBucketPermission = function() {
  return this._bucketPermission;
};

/**
 * Loads the bucketPermission of this IncomingShare.
 * @return {Promise.<tutao.entity.sys.BucketPermission>} Resolves to the loaded bucketPermission of this IncomingShare or an exception if the loading failed.
 */
tutao.entity.sys.IncomingShare.prototype.loadBucketPermission = function() {
  return tutao.entity.sys.BucketPermission.load(this._bucketPermission);
};

/**
 * Sets the ownerGroup of this IncomingShare.
 * @param {string} ownerGroup The ownerGroup of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.setOwnerGroup = function(ownerGroup) {
  this._ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this IncomingShare.
 * @return {string} The ownerGroup of this IncomingShare.
 */
tutao.entity.sys.IncomingShare.prototype.getOwnerGroup = function() {
  return this._ownerGroup;
};

/**
 * Loads the ownerGroup of this IncomingShare.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded ownerGroup of this IncomingShare or an exception if the loading failed.
 */
tutao.entity.sys.IncomingShare.prototype.loadOwnerGroup = function() {
  return tutao.entity.sys.Group.load(this._ownerGroup);
};

/**
 * Loads a IncomingShare from the server.
 * @param {Array.<string>} id The id of the IncomingShare.
 * @return {Promise.<tutao.entity.sys.IncomingShare>} Resolves to the IncomingShare or an exception if the loading failed.
 */
tutao.entity.sys.IncomingShare.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.IncomingShare, tutao.entity.sys.IncomingShare.PATH, id[1], id[0], {"v" : 14}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple IncomingShares from the server.
 * @param {Array.<Array.<string>>} ids The ids of the IncomingShares to load.
 * @return {Promise.<Array.<tutao.entity.sys.IncomingShare>>} Resolves to an array of IncomingShare or rejects with an exception if the loading failed.
 */
tutao.entity.sys.IncomingShare.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.IncomingShare, tutao.entity.sys.IncomingShare.PATH, ids, {"v": 14}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.IncomingShare.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 14;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.IncomingShare.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of IncomingShares loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.IncomingShare>>} Resolves to an array of IncomingShare or rejects with an exception if the loading failed.
 */
tutao.entity.sys.IncomingShare.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.IncomingShare, tutao.entity.sys.IncomingShare.PATH, listId, start, count, reverse, {"v": 14}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.IncomingShare.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.IncomingShare.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.IncomingShare.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
