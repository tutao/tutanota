"use strict";

tutao.provide('tutao.entity.sys.UpdatePermissionKeyData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UpdatePermissionKeyData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._ownerEncSessionKey = null;
    this._symEncSessionKey = null;
    this._bucketPermission = null;
    this._permission = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.UpdatePermissionKeyData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._ownerEncSessionKey = data.ownerEncSessionKey;
  this._symEncSessionKey = data.symEncSessionKey;
  this._bucketPermission = data.bucketPermission;
  this._permission = data.permission;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.UpdatePermissionKeyData.MODEL_VERSION = '18';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.UpdatePermissionKeyData.PATH = '/rest/sys/updatepermissionkeyservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    ownerEncSessionKey: this._ownerEncSessionKey, 
    symEncSessionKey: this._symEncSessionKey, 
    bucketPermission: this._bucketPermission, 
    permission: this._permission
  };
};

/**
 * Sets the format of this UpdatePermissionKeyData.
 * @param {string} format The format of this UpdatePermissionKeyData.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this UpdatePermissionKeyData.
 * @return {string} The format of this UpdatePermissionKeyData.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this UpdatePermissionKeyData.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this UpdatePermissionKeyData.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this._ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this UpdatePermissionKeyData.
 * @return {string} The ownerEncSessionKey of this UpdatePermissionKeyData.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.getOwnerEncSessionKey = function() {
  return this._ownerEncSessionKey;
};

/**
 * Sets the symEncSessionKey of this UpdatePermissionKeyData.
 * @param {string} symEncSessionKey The symEncSessionKey of this UpdatePermissionKeyData.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.setSymEncSessionKey = function(symEncSessionKey) {
  this._symEncSessionKey = symEncSessionKey;
  return this;
};

/**
 * Provides the symEncSessionKey of this UpdatePermissionKeyData.
 * @return {string} The symEncSessionKey of this UpdatePermissionKeyData.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.getSymEncSessionKey = function() {
  return this._symEncSessionKey;
};

/**
 * Sets the bucketPermission of this UpdatePermissionKeyData.
 * @param {Array.<string>} bucketPermission The bucketPermission of this UpdatePermissionKeyData.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.setBucketPermission = function(bucketPermission) {
  this._bucketPermission = bucketPermission;
  return this;
};

/**
 * Provides the bucketPermission of this UpdatePermissionKeyData.
 * @return {Array.<string>} The bucketPermission of this UpdatePermissionKeyData.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.getBucketPermission = function() {
  return this._bucketPermission;
};

/**
 * Loads the bucketPermission of this UpdatePermissionKeyData.
 * @return {Promise.<tutao.entity.sys.BucketPermission>} Resolves to the loaded bucketPermission of this UpdatePermissionKeyData or an exception if the loading failed.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.loadBucketPermission = function() {
  return tutao.entity.sys.BucketPermission.load(this._bucketPermission);
};

/**
 * Sets the permission of this UpdatePermissionKeyData.
 * @param {Array.<string>} permission The permission of this UpdatePermissionKeyData.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.setPermission = function(permission) {
  this._permission = permission;
  return this;
};

/**
 * Provides the permission of this UpdatePermissionKeyData.
 * @return {Array.<string>} The permission of this UpdatePermissionKeyData.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.getPermission = function() {
  return this._permission;
};

/**
 * Loads the permission of this UpdatePermissionKeyData.
 * @return {Promise.<tutao.entity.sys.Permission>} Resolves to the loaded permission of this UpdatePermissionKeyData or an exception if the loading failed.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.loadPermission = function() {
  return tutao.entity.sys.Permission.load(this._permission);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "18";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.UpdatePermissionKeyData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.UpdatePermissionKeyData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
