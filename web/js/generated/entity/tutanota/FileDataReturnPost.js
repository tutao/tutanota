"use strict";

tutao.provide('tutao.entity.tutanota.FileDataReturnPost');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FileDataReturnPost = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._fileData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.FileDataReturnPost.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FileDataReturnPost.prototype.updateData = function(data) {
  this.__format = data._format;
  this._fileData = data.fileData;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.FileDataReturnPost.MODEL_VERSION = '20';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.FileDataReturnPost.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.FileDataReturnPost.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    fileData: this._fileData
  };
};

/**
 * Sets the format of this FileDataReturnPost.
 * @param {string} format The format of this FileDataReturnPost.
 */
tutao.entity.tutanota.FileDataReturnPost.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this FileDataReturnPost.
 * @return {string} The format of this FileDataReturnPost.
 */
tutao.entity.tutanota.FileDataReturnPost.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the fileData of this FileDataReturnPost.
 * @param {string} fileData The fileData of this FileDataReturnPost.
 */
tutao.entity.tutanota.FileDataReturnPost.prototype.setFileData = function(fileData) {
  this._fileData = fileData;
  return this;
};

/**
 * Provides the fileData of this FileDataReturnPost.
 * @return {string} The fileData of this FileDataReturnPost.
 */
tutao.entity.tutanota.FileDataReturnPost.prototype.getFileData = function() {
  return this._fileData;
};

/**
 * Loads the fileData of this FileDataReturnPost.
 * @return {Promise.<tutao.entity.tutanota.FileData>} Resolves to the loaded fileData of this FileDataReturnPost or an exception if the loading failed.
 */
tutao.entity.tutanota.FileDataReturnPost.prototype.loadFileData = function() {
  return tutao.entity.tutanota.FileData.load(this._fileData);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.FileDataReturnPost.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
