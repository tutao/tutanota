"use strict";

tutao.provide('tutao.entity.sys.ShareData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ShareData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._app = null;
    this._bucket = null;
    this._instancePermissions = null;
    this._shareOwnerGroupId = null;
    this._pubEncBucketKey = null;
    this._pubKeyVersion = null;
    this._shareType = null;
    this._shareholderMailAddress = null;
    this._writePermission = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.ShareData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ShareData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._app = data.app;
  this._bucket = data.bucket;
  this._instancePermissions = data.instancePermissions;
  this._shareOwnerGroupId = data.shareOwnerGroupId;
  this._pubEncBucketKey = data.pubEncBucketKey;
  this._pubKeyVersion = data.pubKeyVersion;
  this._shareType = data.shareType;
  this._shareholderMailAddress = data.shareholderMailAddress;
  this._writePermission = data.writePermission;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.ShareData.MODEL_VERSION = '17';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.ShareData.PATH = '/rest/sys/shareservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.ShareData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.ShareData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    app: this._app, 
    bucket: this._bucket, 
    instancePermissions: this._instancePermissions, 
    shareOwnerGroupId: this._shareOwnerGroupId, 
    pubEncBucketKey: this._pubEncBucketKey, 
    pubKeyVersion: this._pubKeyVersion, 
    shareType: this._shareType, 
    shareholderMailAddress: this._shareholderMailAddress, 
    writePermission: this._writePermission
  };
};

/**
 * Sets the format of this ShareData.
 * @param {string} format The format of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ShareData.
 * @return {string} The format of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the app of this ShareData.
 * @param {string} app The app of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.setApp = function(app) {
  this._app = app;
  return this;
};

/**
 * Provides the app of this ShareData.
 * @return {string} The app of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.getApp = function() {
  return this._app;
};

/**
 * Sets the bucket of this ShareData.
 * @param {string} bucket The bucket of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.setBucket = function(bucket) {
  this._bucket = bucket;
  return this;
};

/**
 * Provides the bucket of this ShareData.
 * @return {string} The bucket of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.getBucket = function() {
  return this._bucket;
};

/**
 * Sets the instancePermissions of this ShareData.
 * @param {string} instancePermissions The instancePermissions of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.setInstancePermissions = function(instancePermissions) {
  this._instancePermissions = instancePermissions;
  return this;
};

/**
 * Provides the instancePermissions of this ShareData.
 * @return {string} The instancePermissions of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.getInstancePermissions = function() {
  return this._instancePermissions;
};

/**
 * Sets the shareOwnerGroupId of this ShareData.
 * @param {string} shareOwnerGroupId The shareOwnerGroupId of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.setShareOwnerGroupId = function(shareOwnerGroupId) {
  this._shareOwnerGroupId = shareOwnerGroupId;
  return this;
};

/**
 * Provides the shareOwnerGroupId of this ShareData.
 * @return {string} The shareOwnerGroupId of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.getShareOwnerGroupId = function() {
  return this._shareOwnerGroupId;
};

/**
 * Sets the pubEncBucketKey of this ShareData.
 * @param {string} pubEncBucketKey The pubEncBucketKey of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.setPubEncBucketKey = function(pubEncBucketKey) {
  this._pubEncBucketKey = pubEncBucketKey;
  return this;
};

/**
 * Provides the pubEncBucketKey of this ShareData.
 * @return {string} The pubEncBucketKey of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.getPubEncBucketKey = function() {
  return this._pubEncBucketKey;
};

/**
 * Sets the pubKeyVersion of this ShareData.
 * @param {string} pubKeyVersion The pubKeyVersion of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.setPubKeyVersion = function(pubKeyVersion) {
  this._pubKeyVersion = pubKeyVersion;
  return this;
};

/**
 * Provides the pubKeyVersion of this ShareData.
 * @return {string} The pubKeyVersion of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.getPubKeyVersion = function() {
  return this._pubKeyVersion;
};

/**
 * Sets the shareType of this ShareData.
 * @param {string} shareType The shareType of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.setShareType = function(shareType) {
  this._shareType = shareType;
  return this;
};

/**
 * Provides the shareType of this ShareData.
 * @return {string} The shareType of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.getShareType = function() {
  return this._shareType;
};

/**
 * Sets the shareholderMailAddress of this ShareData.
 * @param {string} shareholderMailAddress The shareholderMailAddress of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.setShareholderMailAddress = function(shareholderMailAddress) {
  this._shareholderMailAddress = shareholderMailAddress;
  return this;
};

/**
 * Provides the shareholderMailAddress of this ShareData.
 * @return {string} The shareholderMailAddress of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.getShareholderMailAddress = function() {
  return this._shareholderMailAddress;
};

/**
 * Sets the writePermission of this ShareData.
 * @param {boolean} writePermission The writePermission of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.setWritePermission = function(writePermission) {
  this._writePermission = writePermission ? '1' : '0';
  return this;
};

/**
 * Provides the writePermission of this ShareData.
 * @return {boolean} The writePermission of this ShareData.
 */
tutao.entity.sys.ShareData.prototype.getWritePermission = function() {
  return this._writePermission != '0';
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.ShareData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "17";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.ShareData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.ShareData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
