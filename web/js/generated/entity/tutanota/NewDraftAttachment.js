"use strict";

tutao.provide('tutao.entity.tutanota.NewDraftAttachment');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.NewDraftAttachment = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._fileName = null;
    this._mimeType = null;
    this._fileData = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.NewDraftAttachment.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._fileName = data.fileName;
  this._mimeType = data.mimeType;
  this._fileData = data.fileData;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    fileName: this._fileName, 
    mimeType: this._mimeType, 
    fileData: this._fileData
  };
};

/**
 * The id of the NewDraftAttachment type.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.TYPE_ID = 486;

/**
 * The id of the fileName attribute.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.FILENAME_ATTRIBUTE_ID = 488;

/**
 * The id of the mimeType attribute.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.MIMETYPE_ATTRIBUTE_ID = 489;

/**
 * The id of the fileData attribute.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.FILEDATA_ATTRIBUTE_ID = 490;

/**
 * Sets the id of this NewDraftAttachment.
 * @param {string} id The id of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this NewDraftAttachment.
 * @return {string} The id of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the fileName of this NewDraftAttachment.
 * @param {string} fileName The fileName of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.setFileName = function(fileName) {
  this._fileName = fileName;
  return this;
};

/**
 * Provides the fileName of this NewDraftAttachment.
 * @return {string} The fileName of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.getFileName = function() {
  return this._fileName;
};

/**
 * Sets the mimeType of this NewDraftAttachment.
 * @param {string} mimeType The mimeType of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.setMimeType = function(mimeType) {
  this._mimeType = mimeType;
  return this;
};

/**
 * Provides the mimeType of this NewDraftAttachment.
 * @return {string} The mimeType of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.getMimeType = function() {
  return this._mimeType;
};

/**
 * Sets the fileData of this NewDraftAttachment.
 * @param {string} fileData The fileData of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.setFileData = function(fileData) {
  this._fileData = fileData;
  return this;
};

/**
 * Provides the fileData of this NewDraftAttachment.
 * @return {string} The fileData of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.getFileData = function() {
  return this._fileData;
};

/**
 * Loads the fileData of this NewDraftAttachment.
 * @return {Promise.<tutao.entity.tutanota.FileData>} Resolves to the loaded fileData of this NewDraftAttachment or an exception if the loading failed.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.loadFileData = function() {
  return tutao.entity.tutanota.FileData.load(this._fileData);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
