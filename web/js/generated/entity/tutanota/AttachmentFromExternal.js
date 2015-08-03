"use strict";

tutao.provide('tutao.entity.tutanota.AttachmentFromExternal');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.AttachmentFromExternal = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._fileName = null;
    this._mimeType = null;
    this._recipientBucketEncFileSessionKey = null;
    this._senderBucketEncFileSessionKey = null;
    this._fileData = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.AttachmentFromExternal.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._fileName = data.fileName;
  this._mimeType = data.mimeType;
  this._recipientBucketEncFileSessionKey = data.recipientBucketEncFileSessionKey;
  this._senderBucketEncFileSessionKey = data.senderBucketEncFileSessionKey;
  this._fileData = data.fileData;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    fileName: this._fileName, 
    mimeType: this._mimeType, 
    recipientBucketEncFileSessionKey: this._recipientBucketEncFileSessionKey, 
    senderBucketEncFileSessionKey: this._senderBucketEncFileSessionKey, 
    fileData: this._fileData
  };
};

/**
 * The id of the AttachmentFromExternal type.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.TYPE_ID = 253;

/**
 * The id of the fileName attribute.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.FILENAME_ATTRIBUTE_ID = 257;

/**
 * The id of the mimeType attribute.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.MIMETYPE_ATTRIBUTE_ID = 258;

/**
 * The id of the recipientBucketEncFileSessionKey attribute.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.RECIPIENTBUCKETENCFILESESSIONKEY_ATTRIBUTE_ID = 256;

/**
 * The id of the senderBucketEncFileSessionKey attribute.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.SENDERBUCKETENCFILESESSIONKEY_ATTRIBUTE_ID = 255;

/**
 * The id of the fileData attribute.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.FILEDATA_ATTRIBUTE_ID = 259;

/**
 * Sets the id of this AttachmentFromExternal.
 * @param {string} id The id of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this AttachmentFromExternal.
 * @return {string} The id of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the fileName of this AttachmentFromExternal.
 * @param {string} fileName The fileName of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.setFileName = function(fileName) {
  this._fileName = fileName;
  return this;
};

/**
 * Provides the fileName of this AttachmentFromExternal.
 * @return {string} The fileName of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.getFileName = function() {
  return this._fileName;
};

/**
 * Sets the mimeType of this AttachmentFromExternal.
 * @param {string} mimeType The mimeType of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.setMimeType = function(mimeType) {
  this._mimeType = mimeType;
  return this;
};

/**
 * Provides the mimeType of this AttachmentFromExternal.
 * @return {string} The mimeType of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.getMimeType = function() {
  return this._mimeType;
};

/**
 * Sets the recipientBucketEncFileSessionKey of this AttachmentFromExternal.
 * @param {string} recipientBucketEncFileSessionKey The recipientBucketEncFileSessionKey of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.setRecipientBucketEncFileSessionKey = function(recipientBucketEncFileSessionKey) {
  this._recipientBucketEncFileSessionKey = recipientBucketEncFileSessionKey;
  return this;
};

/**
 * Provides the recipientBucketEncFileSessionKey of this AttachmentFromExternal.
 * @return {string} The recipientBucketEncFileSessionKey of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.getRecipientBucketEncFileSessionKey = function() {
  return this._recipientBucketEncFileSessionKey;
};

/**
 * Sets the senderBucketEncFileSessionKey of this AttachmentFromExternal.
 * @param {string} senderBucketEncFileSessionKey The senderBucketEncFileSessionKey of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.setSenderBucketEncFileSessionKey = function(senderBucketEncFileSessionKey) {
  this._senderBucketEncFileSessionKey = senderBucketEncFileSessionKey;
  return this;
};

/**
 * Provides the senderBucketEncFileSessionKey of this AttachmentFromExternal.
 * @return {string} The senderBucketEncFileSessionKey of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.getSenderBucketEncFileSessionKey = function() {
  return this._senderBucketEncFileSessionKey;
};

/**
 * Sets the fileData of this AttachmentFromExternal.
 * @param {string} fileData The fileData of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.setFileData = function(fileData) {
  this._fileData = fileData;
  return this;
};

/**
 * Provides the fileData of this AttachmentFromExternal.
 * @return {string} The fileData of this AttachmentFromExternal.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.getFileData = function() {
  return this._fileData;
};

/**
 * Loads the fileData of this AttachmentFromExternal.
 * @return {Promise.<tutao.entity.tutanota.FileData>} Resolves to the loaded fileData of this AttachmentFromExternal or an exception if the loading failed.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.loadFileData = function() {
  return tutao.entity.tutanota.FileData.load(this._fileData);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.AttachmentFromExternal.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
