"use strict";

tutao.provide('tutao.entity.tutanota.MailBox');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailBox = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._shareBucketId = null;
    this._symEncShareBucketKey = null;
    this._mails = null;
    this._receivedAttachments = null;
    this._sentAttachments = null;
    this._systemFolders = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.MailBox.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailBox.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._shareBucketId = data.shareBucketId;
  this._symEncShareBucketKey = data.symEncShareBucketKey;
  this._mails = data.mails;
  this._receivedAttachments = data.receivedAttachments;
  this._sentAttachments = data.sentAttachments;
  this._systemFolders = (data.systemFolders) ? new tutao.entity.tutanota.MailFolderRef(this, data.systemFolders) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.MailBox.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.MailBox.PATH = '/rest/tutanota/mailbox';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.MailBox.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAH0';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.MailBox.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.MailBox.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MailBox.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    shareBucketId: this._shareBucketId, 
    symEncShareBucketKey: this._symEncShareBucketKey, 
    mails: this._mails, 
    receivedAttachments: this._receivedAttachments, 
    sentAttachments: this._sentAttachments, 
    systemFolders: tutao.entity.EntityHelper.aggregatesToJsonData(this._systemFolders)
  };
};

/**
 * The id of the MailBox type.
 */
tutao.entity.tutanota.MailBox.prototype.TYPE_ID = 125;

/**
 * The id of the shareBucketId attribute.
 */
tutao.entity.tutanota.MailBox.prototype.SHAREBUCKETID_ATTRIBUTE_ID = 130;

/**
 * The id of the symEncShareBucketKey attribute.
 */
tutao.entity.tutanota.MailBox.prototype.SYMENCSHAREBUCKETKEY_ATTRIBUTE_ID = 131;

/**
 * The id of the mails attribute.
 */
tutao.entity.tutanota.MailBox.prototype.MAILS_ATTRIBUTE_ID = 132;

/**
 * The id of the receivedAttachments attribute.
 */
tutao.entity.tutanota.MailBox.prototype.RECEIVEDATTACHMENTS_ATTRIBUTE_ID = 134;

/**
 * The id of the sentAttachments attribute.
 */
tutao.entity.tutanota.MailBox.prototype.SENTATTACHMENTS_ATTRIBUTE_ID = 133;

/**
 * The id of the systemFolders attribute.
 */
tutao.entity.tutanota.MailBox.prototype.SYSTEMFOLDERS_ATTRIBUTE_ID = 443;

/**
 * Provides the id of this MailBox.
 * @return {string} The id of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this MailBox.
 * @param {string} format The format of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MailBox.
 * @return {string} The format of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this MailBox.
 * @param {string} permissions The permissions of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this MailBox.
 * @return {string} The permissions of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the shareBucketId of this MailBox.
 * @param {string} shareBucketId The shareBucketId of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.setShareBucketId = function(shareBucketId) {
  this._shareBucketId = shareBucketId;
  return this;
};

/**
 * Provides the shareBucketId of this MailBox.
 * @return {string} The shareBucketId of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.getShareBucketId = function() {
  return this._shareBucketId;
};

/**
 * Sets the symEncShareBucketKey of this MailBox.
 * @param {string} symEncShareBucketKey The symEncShareBucketKey of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.setSymEncShareBucketKey = function(symEncShareBucketKey) {
  this._symEncShareBucketKey = symEncShareBucketKey;
  return this;
};

/**
 * Provides the symEncShareBucketKey of this MailBox.
 * @return {string} The symEncShareBucketKey of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.getSymEncShareBucketKey = function() {
  return this._symEncShareBucketKey;
};

/**
 * Sets the mails of this MailBox.
 * @param {string} mails The mails of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.setMails = function(mails) {
  this._mails = mails;
  return this;
};

/**
 * Provides the mails of this MailBox.
 * @return {string} The mails of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.getMails = function() {
  return this._mails;
};

/**
 * Sets the receivedAttachments of this MailBox.
 * @param {string} receivedAttachments The receivedAttachments of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.setReceivedAttachments = function(receivedAttachments) {
  this._receivedAttachments = receivedAttachments;
  return this;
};

/**
 * Provides the receivedAttachments of this MailBox.
 * @return {string} The receivedAttachments of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.getReceivedAttachments = function() {
  return this._receivedAttachments;
};

/**
 * Sets the sentAttachments of this MailBox.
 * @param {string} sentAttachments The sentAttachments of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.setSentAttachments = function(sentAttachments) {
  this._sentAttachments = sentAttachments;
  return this;
};

/**
 * Provides the sentAttachments of this MailBox.
 * @return {string} The sentAttachments of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.getSentAttachments = function() {
  return this._sentAttachments;
};

/**
 * Sets the systemFolders of this MailBox.
 * @param {tutao.entity.tutanota.MailFolderRef} systemFolders The systemFolders of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.setSystemFolders = function(systemFolders) {
  this._systemFolders = systemFolders;
  return this;
};

/**
 * Provides the systemFolders of this MailBox.
 * @return {tutao.entity.tutanota.MailFolderRef} The systemFolders of this MailBox.
 */
tutao.entity.tutanota.MailBox.prototype.getSystemFolders = function() {
  return this._systemFolders;
};

/**
 * Loads a MailBox from the server.
 * @param {string} id The id of the MailBox.
 * @return {Promise.<tutao.entity.tutanota.MailBox>} Resolves to the MailBox or an exception if the loading failed.
 */
tutao.entity.tutanota.MailBox.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailBox, tutao.entity.tutanota.MailBox.PATH, id, null, {"v" : 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple MailBoxs from the server.
 * @param {Array.<string>} ids The ids of the MailBoxs to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.MailBox>>} Resolves to an array of MailBox or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.MailBox.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.MailBox, tutao.entity.tutanota.MailBox.PATH, ids, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.MailBox.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.MailBox.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MailBox.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
