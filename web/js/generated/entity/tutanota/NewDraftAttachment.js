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
    this._encFileName = null;
    this._encMimeType = null;
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
  this._encFileName = data.encFileName;
  this._encMimeType = data.encMimeType;
  this._fileData = data.fileData;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    encFileName: this._encFileName, 
    encMimeType: this._encMimeType, 
    fileData: this._fileData
  };
};

/**
 * The id of the NewDraftAttachment type.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.TYPE_ID = 486;

/**
 * The id of the encFileName attribute.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.ENCFILENAME_ATTRIBUTE_ID = 488;

/**
 * The id of the encMimeType attribute.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.ENCMIMETYPE_ATTRIBUTE_ID = 489;

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
 * Sets the encFileName of this NewDraftAttachment.
 * @param {string} encFileName The encFileName of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.setEncFileName = function(encFileName) {
  this._encFileName = encFileName;
  return this;
};

/**
 * Provides the encFileName of this NewDraftAttachment.
 * @return {string} The encFileName of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.getEncFileName = function() {
  return this._encFileName;
};

/**
 * Sets the encMimeType of this NewDraftAttachment.
 * @param {string} encMimeType The encMimeType of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.setEncMimeType = function(encMimeType) {
  this._encMimeType = encMimeType;
  return this;
};

/**
 * Provides the encMimeType of this NewDraftAttachment.
 * @return {string} The encMimeType of this NewDraftAttachment.
 */
tutao.entity.tutanota.NewDraftAttachment.prototype.getEncMimeType = function() {
  return this._encMimeType;
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
