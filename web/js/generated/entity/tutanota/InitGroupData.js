"use strict";

tutao.provide('tutao.entity.tutanota.InitGroupData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.InitGroupData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._groupEncEntropy = null;
    this._groupId = null;
    this._symEncContactListSessionKey = null;
    this._symEncExternalGroupInfoListKey = null;
    this._symEncFileSystemSessionKey = null;
    this._symEncMailBoxSessionKey = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.InitGroupData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.InitGroupData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._groupEncEntropy = data.groupEncEntropy;
  this._groupId = data.groupId;
  this._symEncContactListSessionKey = data.symEncContactListSessionKey;
  this._symEncExternalGroupInfoListKey = data.symEncExternalGroupInfoListKey;
  this._symEncFileSystemSessionKey = data.symEncFileSystemSessionKey;
  this._symEncMailBoxSessionKey = data.symEncMailBoxSessionKey;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.InitGroupData.MODEL_VERSION = '13';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.InitGroupData.PATH = '/rest/tutanota/initgroupservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.InitGroupData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.InitGroupData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    groupEncEntropy: this._groupEncEntropy, 
    groupId: this._groupId, 
    symEncContactListSessionKey: this._symEncContactListSessionKey, 
    symEncExternalGroupInfoListKey: this._symEncExternalGroupInfoListKey, 
    symEncFileSystemSessionKey: this._symEncFileSystemSessionKey, 
    symEncMailBoxSessionKey: this._symEncMailBoxSessionKey
  };
};

/**
 * The id of the InitGroupData type.
 */
tutao.entity.tutanota.InitGroupData.prototype.TYPE_ID = 385;

/**
 * The id of the groupEncEntropy attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.GROUPENCENTROPY_ATTRIBUTE_ID = 411;

/**
 * The id of the groupId attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.GROUPID_ATTRIBUTE_ID = 387;

/**
 * The id of the symEncContactListSessionKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCCONTACTLISTSESSIONKEY_ATTRIBUTE_ID = 391;

/**
 * The id of the symEncExternalGroupInfoListKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCEXTERNALGROUPINFOLISTKEY_ATTRIBUTE_ID = 397;

/**
 * The id of the symEncFileSystemSessionKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCFILESYSTEMSESSIONKEY_ATTRIBUTE_ID = 394;

/**
 * The id of the symEncMailBoxSessionKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCMAILBOXSESSIONKEY_ATTRIBUTE_ID = 388;

/**
 * Sets the format of this InitGroupData.
 * @param {string} format The format of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this InitGroupData.
 * @return {string} The format of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the groupEncEntropy of this InitGroupData.
 * @param {string} groupEncEntropy The groupEncEntropy of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setGroupEncEntropy = function(groupEncEntropy) {
  this._groupEncEntropy = groupEncEntropy;
  return this;
};

/**
 * Provides the groupEncEntropy of this InitGroupData.
 * @return {string} The groupEncEntropy of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getGroupEncEntropy = function() {
  return this._groupEncEntropy;
};

/**
 * Sets the groupId of this InitGroupData.
 * @param {string} groupId The groupId of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setGroupId = function(groupId) {
  this._groupId = groupId;
  return this;
};

/**
 * Provides the groupId of this InitGroupData.
 * @return {string} The groupId of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getGroupId = function() {
  return this._groupId;
};

/**
 * Sets the symEncContactListSessionKey of this InitGroupData.
 * @param {string} symEncContactListSessionKey The symEncContactListSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setSymEncContactListSessionKey = function(symEncContactListSessionKey) {
  this._symEncContactListSessionKey = symEncContactListSessionKey;
  return this;
};

/**
 * Provides the symEncContactListSessionKey of this InitGroupData.
 * @return {string} The symEncContactListSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getSymEncContactListSessionKey = function() {
  return this._symEncContactListSessionKey;
};

/**
 * Sets the symEncExternalGroupInfoListKey of this InitGroupData.
 * @param {string} symEncExternalGroupInfoListKey The symEncExternalGroupInfoListKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setSymEncExternalGroupInfoListKey = function(symEncExternalGroupInfoListKey) {
  this._symEncExternalGroupInfoListKey = symEncExternalGroupInfoListKey;
  return this;
};

/**
 * Provides the symEncExternalGroupInfoListKey of this InitGroupData.
 * @return {string} The symEncExternalGroupInfoListKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getSymEncExternalGroupInfoListKey = function() {
  return this._symEncExternalGroupInfoListKey;
};

/**
 * Sets the symEncFileSystemSessionKey of this InitGroupData.
 * @param {string} symEncFileSystemSessionKey The symEncFileSystemSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setSymEncFileSystemSessionKey = function(symEncFileSystemSessionKey) {
  this._symEncFileSystemSessionKey = symEncFileSystemSessionKey;
  return this;
};

/**
 * Provides the symEncFileSystemSessionKey of this InitGroupData.
 * @return {string} The symEncFileSystemSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getSymEncFileSystemSessionKey = function() {
  return this._symEncFileSystemSessionKey;
};

/**
 * Sets the symEncMailBoxSessionKey of this InitGroupData.
 * @param {string} symEncMailBoxSessionKey The symEncMailBoxSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setSymEncMailBoxSessionKey = function(symEncMailBoxSessionKey) {
  this._symEncMailBoxSessionKey = symEncMailBoxSessionKey;
  return this;
};

/**
 * Provides the symEncMailBoxSessionKey of this InitGroupData.
 * @return {string} The symEncMailBoxSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getSymEncMailBoxSessionKey = function() {
  return this._symEncMailBoxSessionKey;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.InitGroupData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "13";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.InitGroupData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.InitGroupData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
