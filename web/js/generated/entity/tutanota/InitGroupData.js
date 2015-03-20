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
    this._contactShareBucketEncContactListSessionKey = null;
    this._fileShareBucketEncFileSystemSessionKey = null;
    this._groupEncEntropy = null;
    this._groupId = null;
    this._groupShareBucketEncExternalGroupInfoListKey = null;
    this._mailShareBucketEncMailBoxSessionKey = null;
    this._symEncContactListSessionKey = null;
    this._symEncContactShareBucketKey = null;
    this._symEncExternalGroupInfoListKey = null;
    this._symEncFileShareBucketKey = null;
    this._symEncFileSystemSessionKey = null;
    this._symEncGroupShareBucketKey = null;
    this._symEncMailBoxSessionKey = null;
    this._symEncMailShareBucketKey = null;
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
  this._contactShareBucketEncContactListSessionKey = data.contactShareBucketEncContactListSessionKey;
  this._fileShareBucketEncFileSystemSessionKey = data.fileShareBucketEncFileSystemSessionKey;
  this._groupEncEntropy = data.groupEncEntropy;
  this._groupId = data.groupId;
  this._groupShareBucketEncExternalGroupInfoListKey = data.groupShareBucketEncExternalGroupInfoListKey;
  this._mailShareBucketEncMailBoxSessionKey = data.mailShareBucketEncMailBoxSessionKey;
  this._symEncContactListSessionKey = data.symEncContactListSessionKey;
  this._symEncContactShareBucketKey = data.symEncContactShareBucketKey;
  this._symEncExternalGroupInfoListKey = data.symEncExternalGroupInfoListKey;
  this._symEncFileShareBucketKey = data.symEncFileShareBucketKey;
  this._symEncFileSystemSessionKey = data.symEncFileSystemSessionKey;
  this._symEncGroupShareBucketKey = data.symEncGroupShareBucketKey;
  this._symEncMailBoxSessionKey = data.symEncMailBoxSessionKey;
  this._symEncMailShareBucketKey = data.symEncMailShareBucketKey;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.InitGroupData.MODEL_VERSION = '8';

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
    contactShareBucketEncContactListSessionKey: this._contactShareBucketEncContactListSessionKey, 
    fileShareBucketEncFileSystemSessionKey: this._fileShareBucketEncFileSystemSessionKey, 
    groupEncEntropy: this._groupEncEntropy, 
    groupId: this._groupId, 
    groupShareBucketEncExternalGroupInfoListKey: this._groupShareBucketEncExternalGroupInfoListKey, 
    mailShareBucketEncMailBoxSessionKey: this._mailShareBucketEncMailBoxSessionKey, 
    symEncContactListSessionKey: this._symEncContactListSessionKey, 
    symEncContactShareBucketKey: this._symEncContactShareBucketKey, 
    symEncExternalGroupInfoListKey: this._symEncExternalGroupInfoListKey, 
    symEncFileShareBucketKey: this._symEncFileShareBucketKey, 
    symEncFileSystemSessionKey: this._symEncFileSystemSessionKey, 
    symEncGroupShareBucketKey: this._symEncGroupShareBucketKey, 
    symEncMailBoxSessionKey: this._symEncMailBoxSessionKey, 
    symEncMailShareBucketKey: this._symEncMailShareBucketKey
  };
};

/**
 * The id of the InitGroupData type.
 */
tutao.entity.tutanota.InitGroupData.prototype.TYPE_ID = 385;

/**
 * The id of the contactShareBucketEncContactListSessionKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.CONTACTSHAREBUCKETENCCONTACTLISTSESSIONKEY_ATTRIBUTE_ID = 392;

/**
 * The id of the fileShareBucketEncFileSystemSessionKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.FILESHAREBUCKETENCFILESYSTEMSESSIONKEY_ATTRIBUTE_ID = 395;

/**
 * The id of the groupEncEntropy attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.GROUPENCENTROPY_ATTRIBUTE_ID = 411;

/**
 * The id of the groupId attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.GROUPID_ATTRIBUTE_ID = 387;

/**
 * The id of the groupShareBucketEncExternalGroupInfoListKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.GROUPSHAREBUCKETENCEXTERNALGROUPINFOLISTKEY_ATTRIBUTE_ID = 399;

/**
 * The id of the mailShareBucketEncMailBoxSessionKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.MAILSHAREBUCKETENCMAILBOXSESSIONKEY_ATTRIBUTE_ID = 389;

/**
 * The id of the symEncContactListSessionKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCCONTACTLISTSESSIONKEY_ATTRIBUTE_ID = 391;

/**
 * The id of the symEncContactShareBucketKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCCONTACTSHAREBUCKETKEY_ATTRIBUTE_ID = 393;

/**
 * The id of the symEncExternalGroupInfoListKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCEXTERNALGROUPINFOLISTKEY_ATTRIBUTE_ID = 397;

/**
 * The id of the symEncFileShareBucketKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCFILESHAREBUCKETKEY_ATTRIBUTE_ID = 396;

/**
 * The id of the symEncFileSystemSessionKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCFILESYSTEMSESSIONKEY_ATTRIBUTE_ID = 394;

/**
 * The id of the symEncGroupShareBucketKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCGROUPSHAREBUCKETKEY_ATTRIBUTE_ID = 398;

/**
 * The id of the symEncMailBoxSessionKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCMAILBOXSESSIONKEY_ATTRIBUTE_ID = 388;

/**
 * The id of the symEncMailShareBucketKey attribute.
 */
tutao.entity.tutanota.InitGroupData.prototype.SYMENCMAILSHAREBUCKETKEY_ATTRIBUTE_ID = 390;

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
 * Sets the contactShareBucketEncContactListSessionKey of this InitGroupData.
 * @param {string} contactShareBucketEncContactListSessionKey The contactShareBucketEncContactListSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setContactShareBucketEncContactListSessionKey = function(contactShareBucketEncContactListSessionKey) {
  this._contactShareBucketEncContactListSessionKey = contactShareBucketEncContactListSessionKey;
  return this;
};

/**
 * Provides the contactShareBucketEncContactListSessionKey of this InitGroupData.
 * @return {string} The contactShareBucketEncContactListSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getContactShareBucketEncContactListSessionKey = function() {
  return this._contactShareBucketEncContactListSessionKey;
};

/**
 * Sets the fileShareBucketEncFileSystemSessionKey of this InitGroupData.
 * @param {string} fileShareBucketEncFileSystemSessionKey The fileShareBucketEncFileSystemSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setFileShareBucketEncFileSystemSessionKey = function(fileShareBucketEncFileSystemSessionKey) {
  this._fileShareBucketEncFileSystemSessionKey = fileShareBucketEncFileSystemSessionKey;
  return this;
};

/**
 * Provides the fileShareBucketEncFileSystemSessionKey of this InitGroupData.
 * @return {string} The fileShareBucketEncFileSystemSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getFileShareBucketEncFileSystemSessionKey = function() {
  return this._fileShareBucketEncFileSystemSessionKey;
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
 * Sets the groupShareBucketEncExternalGroupInfoListKey of this InitGroupData.
 * @param {string} groupShareBucketEncExternalGroupInfoListKey The groupShareBucketEncExternalGroupInfoListKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setGroupShareBucketEncExternalGroupInfoListKey = function(groupShareBucketEncExternalGroupInfoListKey) {
  this._groupShareBucketEncExternalGroupInfoListKey = groupShareBucketEncExternalGroupInfoListKey;
  return this;
};

/**
 * Provides the groupShareBucketEncExternalGroupInfoListKey of this InitGroupData.
 * @return {string} The groupShareBucketEncExternalGroupInfoListKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getGroupShareBucketEncExternalGroupInfoListKey = function() {
  return this._groupShareBucketEncExternalGroupInfoListKey;
};

/**
 * Sets the mailShareBucketEncMailBoxSessionKey of this InitGroupData.
 * @param {string} mailShareBucketEncMailBoxSessionKey The mailShareBucketEncMailBoxSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setMailShareBucketEncMailBoxSessionKey = function(mailShareBucketEncMailBoxSessionKey) {
  this._mailShareBucketEncMailBoxSessionKey = mailShareBucketEncMailBoxSessionKey;
  return this;
};

/**
 * Provides the mailShareBucketEncMailBoxSessionKey of this InitGroupData.
 * @return {string} The mailShareBucketEncMailBoxSessionKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getMailShareBucketEncMailBoxSessionKey = function() {
  return this._mailShareBucketEncMailBoxSessionKey;
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
 * Sets the symEncContactShareBucketKey of this InitGroupData.
 * @param {string} symEncContactShareBucketKey The symEncContactShareBucketKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setSymEncContactShareBucketKey = function(symEncContactShareBucketKey) {
  this._symEncContactShareBucketKey = symEncContactShareBucketKey;
  return this;
};

/**
 * Provides the symEncContactShareBucketKey of this InitGroupData.
 * @return {string} The symEncContactShareBucketKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getSymEncContactShareBucketKey = function() {
  return this._symEncContactShareBucketKey;
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
 * Sets the symEncFileShareBucketKey of this InitGroupData.
 * @param {string} symEncFileShareBucketKey The symEncFileShareBucketKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setSymEncFileShareBucketKey = function(symEncFileShareBucketKey) {
  this._symEncFileShareBucketKey = symEncFileShareBucketKey;
  return this;
};

/**
 * Provides the symEncFileShareBucketKey of this InitGroupData.
 * @return {string} The symEncFileShareBucketKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getSymEncFileShareBucketKey = function() {
  return this._symEncFileShareBucketKey;
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
 * Sets the symEncGroupShareBucketKey of this InitGroupData.
 * @param {string} symEncGroupShareBucketKey The symEncGroupShareBucketKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setSymEncGroupShareBucketKey = function(symEncGroupShareBucketKey) {
  this._symEncGroupShareBucketKey = symEncGroupShareBucketKey;
  return this;
};

/**
 * Provides the symEncGroupShareBucketKey of this InitGroupData.
 * @return {string} The symEncGroupShareBucketKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getSymEncGroupShareBucketKey = function() {
  return this._symEncGroupShareBucketKey;
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
 * Sets the symEncMailShareBucketKey of this InitGroupData.
 * @param {string} symEncMailShareBucketKey The symEncMailShareBucketKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.setSymEncMailShareBucketKey = function(symEncMailShareBucketKey) {
  this._symEncMailShareBucketKey = symEncMailShareBucketKey;
  return this;
};

/**
 * Provides the symEncMailShareBucketKey of this InitGroupData.
 * @return {string} The symEncMailShareBucketKey of this InitGroupData.
 */
tutao.entity.tutanota.InitGroupData.prototype.getSymEncMailShareBucketKey = function() {
  return this._symEncMailShareBucketKey;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.InitGroupData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 8;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.InitGroupData.PATH, this, parameters, headers, null);
};
