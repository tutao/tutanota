"use strict";

tutao.provide('tutao.entity.tutanota.FileDataDataGet');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FileDataDataGet = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._base64 = null;
    this._file = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.FileDataDataGet.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FileDataDataGet.prototype.updateData = function(data) {
  this.__format = data._format;
  this._base64 = data.base64;
  this._file = data.file;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.FileDataDataGet.MODEL_VERSION = '17';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.FileDataDataGet.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.FileDataDataGet.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    base64: this._base64, 
    file: this._file
  };
};

/**
 * Sets the format of this FileDataDataGet.
 * @param {string} format The format of this FileDataDataGet.
 */
tutao.entity.tutanota.FileDataDataGet.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this FileDataDataGet.
 * @return {string} The format of this FileDataDataGet.
 */
tutao.entity.tutanota.FileDataDataGet.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the base64 of this FileDataDataGet.
 * @param {boolean} base64 The base64 of this FileDataDataGet.
 */
tutao.entity.tutanota.FileDataDataGet.prototype.setBase64 = function(base64) {
  this._base64 = base64 ? '1' : '0';
  return this;
};

/**
 * Provides the base64 of this FileDataDataGet.
 * @return {boolean} The base64 of this FileDataDataGet.
 */
tutao.entity.tutanota.FileDataDataGet.prototype.getBase64 = function() {
  return this._base64 != '0';
};

/**
 * Sets the file of this FileDataDataGet.
 * @param {Array.<string>} file The file of this FileDataDataGet.
 */
tutao.entity.tutanota.FileDataDataGet.prototype.setFile = function(file) {
  this._file = file;
  return this;
};

/**
 * Provides the file of this FileDataDataGet.
 * @return {Array.<string>} The file of this FileDataDataGet.
 */
tutao.entity.tutanota.FileDataDataGet.prototype.getFile = function() {
  return this._file;
};

/**
 * Loads the file of this FileDataDataGet.
 * @return {Promise.<tutao.entity.tutanota.File>} Resolves to the loaded file of this FileDataDataGet or an exception if the loading failed.
 */
tutao.entity.tutanota.FileDataDataGet.prototype.loadFile = function() {
  return tutao.entity.tutanota.File.load(this._file);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.FileDataDataGet.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
