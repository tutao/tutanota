"use strict";

tutao.provide('tutao.entity.tutanota.Attachment');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Attachment = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._bucketEncFileSessionKey = null;
    this._fileName = null;
    this._ownerEncFileSessionKey = null;
    this._mimeType = null;
    this._file = null;
    this._fileData = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.Attachment.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Attachment.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._bucketEncFileSessionKey = data.bucketEncFileSessionKey;
  this._fileName = data.fileName;
  this._ownerEncFileSessionKey = data.ownerEncFileSessionKey;
  this._mimeType = data.mimeType;
  this._file = data.file;
  this._fileData = data.fileData;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.Attachment.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    bucketEncFileSessionKey: this._bucketEncFileSessionKey, 
    fileName: this._fileName, 
    ownerEncFileSessionKey: this._ownerEncFileSessionKey, 
    mimeType: this._mimeType, 
    file: this._file, 
    fileData: this._fileData
  };
};

/**
 * The id of the Attachment type.
 */
tutao.entity.tutanota.Attachment.prototype.TYPE_ID = 175;

/**
 * The id of the bucketEncFileSessionKey attribute.
 */
tutao.entity.tutanota.Attachment.prototype.BUCKETENCFILESESSIONKEY_ATTRIBUTE_ID = 178;

/**
 * The id of the fileName attribute.
 */
tutao.entity.tutanota.Attachment.prototype.FILENAME_ATTRIBUTE_ID = 180;

/**
 * The id of the ownerEncFileSessionKey attribute.
 */
tutao.entity.tutanota.Attachment.prototype.OWNERENCFILESESSIONKEY_ATTRIBUTE_ID = 177;

/**
 * The id of the mimeType attribute.
 */
tutao.entity.tutanota.Attachment.prototype.MIMETYPE_ATTRIBUTE_ID = 181;

/**
 * The id of the file attribute.
 */
tutao.entity.tutanota.Attachment.prototype.FILE_ATTRIBUTE_ID = 179;

/**
 * The id of the fileData attribute.
 */
tutao.entity.tutanota.Attachment.prototype.FILEDATA_ATTRIBUTE_ID = 182;

/**
 * Sets the id of this Attachment.
 * @param {string} id The id of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Attachment.
 * @return {string} The id of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the bucketEncFileSessionKey of this Attachment.
 * @param {string} bucketEncFileSessionKey The bucketEncFileSessionKey of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.setBucketEncFileSessionKey = function(bucketEncFileSessionKey) {
  this._bucketEncFileSessionKey = bucketEncFileSessionKey;
  return this;
};

/**
 * Provides the bucketEncFileSessionKey of this Attachment.
 * @return {string} The bucketEncFileSessionKey of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.getBucketEncFileSessionKey = function() {
  return this._bucketEncFileSessionKey;
};

/**
 * Sets the fileName of this Attachment.
 * @param {string} fileName The fileName of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.setFileName = function(fileName) {
  this._fileName = fileName;
  return this;
};

/**
 * Provides the fileName of this Attachment.
 * @return {string} The fileName of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.getFileName = function() {
  return this._fileName;
};

/**
 * Sets the ownerEncFileSessionKey of this Attachment.
 * @param {string} ownerEncFileSessionKey The ownerEncFileSessionKey of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.setOwnerEncFileSessionKey = function(ownerEncFileSessionKey) {
  this._ownerEncFileSessionKey = ownerEncFileSessionKey;
  return this;
};

/**
 * Provides the ownerEncFileSessionKey of this Attachment.
 * @return {string} The ownerEncFileSessionKey of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.getOwnerEncFileSessionKey = function() {
  return this._ownerEncFileSessionKey;
};

/**
 * Sets the mimeType of this Attachment.
 * @param {string} mimeType The mimeType of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.setMimeType = function(mimeType) {
  this._mimeType = mimeType;
  return this;
};

/**
 * Provides the mimeType of this Attachment.
 * @return {string} The mimeType of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.getMimeType = function() {
  return this._mimeType;
};

/**
 * Sets the file of this Attachment.
 * @param {Array.<string>} file The file of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.setFile = function(file) {
  this._file = file;
  return this;
};

/**
 * Provides the file of this Attachment.
 * @return {Array.<string>} The file of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.getFile = function() {
  return this._file;
};

/**
 * Loads the file of this Attachment.
 * @return {Promise.<tutao.entity.tutanota.File>} Resolves to the loaded file of this Attachment or an exception if the loading failed.
 */
tutao.entity.tutanota.Attachment.prototype.loadFile = function() {
  return tutao.entity.tutanota.File.load(this._file);
};

/**
 * Sets the fileData of this Attachment.
 * @param {string} fileData The fileData of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.setFileData = function(fileData) {
  this._fileData = fileData;
  return this;
};

/**
 * Provides the fileData of this Attachment.
 * @return {string} The fileData of this Attachment.
 */
tutao.entity.tutanota.Attachment.prototype.getFileData = function() {
  return this._fileData;
};

/**
 * Loads the fileData of this Attachment.
 * @return {Promise.<tutao.entity.tutanota.FileData>} Resolves to the loaded fileData of this Attachment or an exception if the loading failed.
 */
tutao.entity.tutanota.Attachment.prototype.loadFileData = function() {
  return tutao.entity.tutanota.FileData.load(this._fileData);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.Attachment.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
