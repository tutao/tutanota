"use strict";

tutao.provide('tutao.entity.tutanota.AttachmentKeyData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.AttachmentKeyData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._bucketEncFileSessionKey = null;
    this._fileSessionKey = null;
    this._file = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.AttachmentKeyData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._bucketEncFileSessionKey = data.bucketEncFileSessionKey;
  this._fileSessionKey = data.fileSessionKey;
  this._file = data.file;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    bucketEncFileSessionKey: this._bucketEncFileSessionKey, 
    fileSessionKey: this._fileSessionKey, 
    file: this._file
  };
};

/**
 * Sets the id of this AttachmentKeyData.
 * @param {string} id The id of this AttachmentKeyData.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this AttachmentKeyData.
 * @return {string} The id of this AttachmentKeyData.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the bucketEncFileSessionKey of this AttachmentKeyData.
 * @param {string} bucketEncFileSessionKey The bucketEncFileSessionKey of this AttachmentKeyData.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.setBucketEncFileSessionKey = function(bucketEncFileSessionKey) {
  this._bucketEncFileSessionKey = bucketEncFileSessionKey;
  return this;
};

/**
 * Provides the bucketEncFileSessionKey of this AttachmentKeyData.
 * @return {string} The bucketEncFileSessionKey of this AttachmentKeyData.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.getBucketEncFileSessionKey = function() {
  return this._bucketEncFileSessionKey;
};

/**
 * Sets the fileSessionKey of this AttachmentKeyData.
 * @param {string} fileSessionKey The fileSessionKey of this AttachmentKeyData.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.setFileSessionKey = function(fileSessionKey) {
  this._fileSessionKey = fileSessionKey;
  return this;
};

/**
 * Provides the fileSessionKey of this AttachmentKeyData.
 * @return {string} The fileSessionKey of this AttachmentKeyData.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.getFileSessionKey = function() {
  return this._fileSessionKey;
};

/**
 * Sets the file of this AttachmentKeyData.
 * @param {Array.<string>} file The file of this AttachmentKeyData.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.setFile = function(file) {
  this._file = file;
  return this;
};

/**
 * Provides the file of this AttachmentKeyData.
 * @return {Array.<string>} The file of this AttachmentKeyData.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.getFile = function() {
  return this._file;
};

/**
 * Loads the file of this AttachmentKeyData.
 * @return {Promise.<tutao.entity.tutanota.File>} Resolves to the loaded file of this AttachmentKeyData or an exception if the loading failed.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.loadFile = function() {
  return tutao.entity.tutanota.File.load(this._file);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.AttachmentKeyData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
