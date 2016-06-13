"use strict";

tutao.provide('tutao.entity.tutanota.CreateFileReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateFileReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._file = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.CreateFileReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateFileReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._file = data.file;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CreateFileReturn.MODEL_VERSION = '13';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.CreateFileReturn.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CreateFileReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    file: this._file
  };
};

/**
 * Sets the format of this CreateFileReturn.
 * @param {string} format The format of this CreateFileReturn.
 */
tutao.entity.tutanota.CreateFileReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateFileReturn.
 * @return {string} The format of this CreateFileReturn.
 */
tutao.entity.tutanota.CreateFileReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the file of this CreateFileReturn.
 * @param {Array.<string>} file The file of this CreateFileReturn.
 */
tutao.entity.tutanota.CreateFileReturn.prototype.setFile = function(file) {
  this._file = file;
  return this;
};

/**
 * Provides the file of this CreateFileReturn.
 * @return {Array.<string>} The file of this CreateFileReturn.
 */
tutao.entity.tutanota.CreateFileReturn.prototype.getFile = function() {
  return this._file;
};

/**
 * Loads the file of this CreateFileReturn.
 * @return {Promise.<tutao.entity.tutanota.File>} Resolves to the loaded file of this CreateFileReturn or an exception if the loading failed.
 */
tutao.entity.tutanota.CreateFileReturn.prototype.loadFile = function() {
  return tutao.entity.tutanota.File.load(this._file);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.CreateFileReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
