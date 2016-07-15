"use strict";

tutao.provide('tutao.entity.sys.OutgoingShare');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.OutgoingShare = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._app = null;
    this._referenceId = null;
    this._referenceListId = null;
    this._shareType = null;
    this._shareholderMailAddress = null;
    this._bucketPermission = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.OutgoingShare.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.OutgoingShare.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._app = data.app;
  this._referenceId = data.referenceId;
  this._referenceListId = data.referenceListId;
  this._shareType = data.shareType;
  this._shareholderMailAddress = data.shareholderMailAddress;
  this._bucketPermission = data.bucketPermission;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.OutgoingShare.MODEL_VERSION = '18';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.OutgoingShare.PATH = '/rest/sys/outgoingshare';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.OutgoingShare.ROOT_INSTANCE_ID = 'A3N5cwABDw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.OutgoingShare.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.OutgoingShare.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.OutgoingShare.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    app: this._app, 
    referenceId: this._referenceId, 
    referenceListId: this._referenceListId, 
    shareType: this._shareType, 
    shareholderMailAddress: this._shareholderMailAddress, 
    bucketPermission: this._bucketPermission
  };
};

/**
 * Provides the id of this OutgoingShare.
 * @return {Array.<string>} The id of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this OutgoingShare.
 * @param {string} format The format of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this OutgoingShare.
 * @return {string} The format of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this OutgoingShare.
 * @param {string} ownerGroup The ownerGroup of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this OutgoingShare.
 * @return {string} The ownerGroup of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this OutgoingShare.
 * @param {string} permissions The permissions of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this OutgoingShare.
 * @return {string} The permissions of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the app of this OutgoingShare.
 * @param {string} app The app of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.setApp = function(app) {
  this._app = app;
  return this;
};

/**
 * Provides the app of this OutgoingShare.
 * @return {string} The app of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.getApp = function() {
  return this._app;
};

/**
 * Sets the referenceId of this OutgoingShare.
 * @param {string} referenceId The referenceId of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.setReferenceId = function(referenceId) {
  this._referenceId = referenceId;
  return this;
};

/**
 * Provides the referenceId of this OutgoingShare.
 * @return {string} The referenceId of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.getReferenceId = function() {
  return this._referenceId;
};

/**
 * Sets the referenceListId of this OutgoingShare.
 * @param {string} referenceListId The referenceListId of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.setReferenceListId = function(referenceListId) {
  this._referenceListId = referenceListId;
  return this;
};

/**
 * Provides the referenceListId of this OutgoingShare.
 * @return {string} The referenceListId of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.getReferenceListId = function() {
  return this._referenceListId;
};

/**
 * Sets the shareType of this OutgoingShare.
 * @param {string} shareType The shareType of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.setShareType = function(shareType) {
  this._shareType = shareType;
  return this;
};

/**
 * Provides the shareType of this OutgoingShare.
 * @return {string} The shareType of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.getShareType = function() {
  return this._shareType;
};

/**
 * Sets the shareholderMailAddress of this OutgoingShare.
 * @param {string} shareholderMailAddress The shareholderMailAddress of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.setShareholderMailAddress = function(shareholderMailAddress) {
  this._shareholderMailAddress = shareholderMailAddress;
  return this;
};

/**
 * Provides the shareholderMailAddress of this OutgoingShare.
 * @return {string} The shareholderMailAddress of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.getShareholderMailAddress = function() {
  return this._shareholderMailAddress;
};

/**
 * Sets the bucketPermission of this OutgoingShare.
 * @param {Array.<string>} bucketPermission The bucketPermission of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.setBucketPermission = function(bucketPermission) {
  this._bucketPermission = bucketPermission;
  return this;
};

/**
 * Provides the bucketPermission of this OutgoingShare.
 * @return {Array.<string>} The bucketPermission of this OutgoingShare.
 */
tutao.entity.sys.OutgoingShare.prototype.getBucketPermission = function() {
  return this._bucketPermission;
};

/**
 * Loads the bucketPermission of this OutgoingShare.
 * @return {Promise.<tutao.entity.sys.BucketPermission>} Resolves to the loaded bucketPermission of this OutgoingShare or an exception if the loading failed.
 */
tutao.entity.sys.OutgoingShare.prototype.loadBucketPermission = function() {
  return tutao.entity.sys.BucketPermission.load(this._bucketPermission);
};

/**
 * Loads a OutgoingShare from the server.
 * @param {Array.<string>} id The id of the OutgoingShare.
 * @return {Promise.<tutao.entity.sys.OutgoingShare>} Resolves to the OutgoingShare or an exception if the loading failed.
 */
tutao.entity.sys.OutgoingShare.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.OutgoingShare, tutao.entity.sys.OutgoingShare.PATH, id[1], id[0], {"v" : "18"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple OutgoingShares from the server.
 * @param {Array.<Array.<string>>} ids The ids of the OutgoingShares to load.
 * @return {Promise.<Array.<tutao.entity.sys.OutgoingShare>>} Resolves to an array of OutgoingShare or rejects with an exception if the loading failed.
 */
tutao.entity.sys.OutgoingShare.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.OutgoingShare, tutao.entity.sys.OutgoingShare.PATH, ids, {"v": "18"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this OutgoingShare on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.OutgoingShare.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.OutgoingShare.PATH, this, {"v": "18"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of OutgoingShares loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.OutgoingShare>>} Resolves to an array of OutgoingShare or rejects with an exception if the loading failed.
 */
tutao.entity.sys.OutgoingShare.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.OutgoingShare, tutao.entity.sys.OutgoingShare.PATH, listId, start, count, reverse, {"v": "18"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.OutgoingShare.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.OutgoingShare.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.OutgoingShare.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
