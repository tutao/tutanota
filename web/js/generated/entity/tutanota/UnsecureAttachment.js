"use strict";

tutao.provide('tutao.entity.tutanota.UnsecureAttachment');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UnsecureAttachment = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._fileName = null;
    this._fileSessionKey = null;
    this._listEncFileSessionKey = null;
    this._mimeType = null;
    this._file = null;
    this._fileData = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.UnsecureAttachment.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._fileName = data.fileName;
  this._fileSessionKey = data.fileSessionKey;
  this._listEncFileSessionKey = data.listEncFileSessionKey;
  this._mimeType = data.mimeType;
  this._file = data.file;
  this._fileData = data.fileData;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    fileName: this._fileName, 
    fileSessionKey: this._fileSessionKey, 
    listEncFileSessionKey: this._listEncFileSessionKey, 
    mimeType: this._mimeType, 
    file: this._file, 
    fileData: this._fileData
  };
};

/**
 * The id of the UnsecureAttachment type.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.TYPE_ID = 280;

/**
 * The id of the fileName attribute.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.FILENAME_ATTRIBUTE_ID = 285;

/**
 * The id of the fileSessionKey attribute.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.FILESESSIONKEY_ATTRIBUTE_ID = 282;

/**
 * The id of the listEncFileSessionKey attribute.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.LISTENCFILESESSIONKEY_ATTRIBUTE_ID = 283;

/**
 * The id of the mimeType attribute.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.MIMETYPE_ATTRIBUTE_ID = 286;

/**
 * The id of the file attribute.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.FILE_ATTRIBUTE_ID = 284;

/**
 * The id of the fileData attribute.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.FILEDATA_ATTRIBUTE_ID = 287;

/**
 * Sets the id of this UnsecureAttachment.
 * @param {string} id The id of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this UnsecureAttachment.
 * @return {string} The id of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the fileName of this UnsecureAttachment.
 * @param {string} fileName The fileName of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.setFileName = function(fileName) {
  this._fileName = fileName;
  return this;
};

/**
 * Provides the fileName of this UnsecureAttachment.
 * @return {string} The fileName of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.getFileName = function() {
  return this._fileName;
};

/**
 * Sets the fileSessionKey of this UnsecureAttachment.
 * @param {string} fileSessionKey The fileSessionKey of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.setFileSessionKey = function(fileSessionKey) {
  this._fileSessionKey = fileSessionKey;
  return this;
};

/**
 * Provides the fileSessionKey of this UnsecureAttachment.
 * @return {string} The fileSessionKey of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.getFileSessionKey = function() {
  return this._fileSessionKey;
};

/**
 * Sets the listEncFileSessionKey of this UnsecureAttachment.
 * @param {string} listEncFileSessionKey The listEncFileSessionKey of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.setListEncFileSessionKey = function(listEncFileSessionKey) {
  this._listEncFileSessionKey = listEncFileSessionKey;
  return this;
};

/**
 * Provides the listEncFileSessionKey of this UnsecureAttachment.
 * @return {string} The listEncFileSessionKey of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.getListEncFileSessionKey = function() {
  return this._listEncFileSessionKey;
};

/**
 * Sets the mimeType of this UnsecureAttachment.
 * @param {string} mimeType The mimeType of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.setMimeType = function(mimeType) {
  this._mimeType = mimeType;
  return this;
};

/**
 * Provides the mimeType of this UnsecureAttachment.
 * @return {string} The mimeType of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.getMimeType = function() {
  return this._mimeType;
};

/**
 * Sets the file of this UnsecureAttachment.
 * @param {Array.<string>} file The file of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.setFile = function(file) {
  this._file = file;
  return this;
};

/**
 * Provides the file of this UnsecureAttachment.
 * @return {Array.<string>} The file of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.getFile = function() {
  return this._file;
};

/**
 * Loads the file of this UnsecureAttachment.
 * @return {Promise.<tutao.entity.tutanota.File>} Resolves to the loaded file of this UnsecureAttachment or an exception if the loading failed.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.loadFile = function() {
  return tutao.entity.tutanota.File.load(this._file);
};

/**
 * Sets the fileData of this UnsecureAttachment.
 * @param {string} fileData The fileData of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.setFileData = function(fileData) {
  this._fileData = fileData;
  return this;
};

/**
 * Provides the fileData of this UnsecureAttachment.
 * @return {string} The fileData of this UnsecureAttachment.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.getFileData = function() {
  return this._fileData;
};

/**
 * Loads the fileData of this UnsecureAttachment.
 * @return {Promise.<tutao.entity.tutanota.FileData>} Resolves to the loaded fileData of this UnsecureAttachment or an exception if the loading failed.
 */
tutao.entity.tutanota.UnsecureAttachment.prototype.loadFileData = function() {
  return tutao.entity.tutanota.FileData.load(this._fileData);
};
