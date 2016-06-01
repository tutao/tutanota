"use strict";

tutao.provide('tutao.entity.tutanota.CreateMailFolderReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateMailFolderReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._newFolder = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.CreateMailFolderReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateMailFolderReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._newFolder = data.newFolder;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CreateMailFolderReturn.MODEL_VERSION = '13';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.CreateMailFolderReturn.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CreateMailFolderReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    newFolder: this._newFolder
  };
};

/**
 * The id of the CreateMailFolderReturn type.
 */
tutao.entity.tutanota.CreateMailFolderReturn.prototype.TYPE_ID = 455;

/**
 * The id of the newFolder attribute.
 */
tutao.entity.tutanota.CreateMailFolderReturn.prototype.NEWFOLDER_ATTRIBUTE_ID = 457;

/**
 * Sets the format of this CreateMailFolderReturn.
 * @param {string} format The format of this CreateMailFolderReturn.
 */
tutao.entity.tutanota.CreateMailFolderReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateMailFolderReturn.
 * @return {string} The format of this CreateMailFolderReturn.
 */
tutao.entity.tutanota.CreateMailFolderReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the newFolder of this CreateMailFolderReturn.
 * @param {Array.<string>} newFolder The newFolder of this CreateMailFolderReturn.
 */
tutao.entity.tutanota.CreateMailFolderReturn.prototype.setNewFolder = function(newFolder) {
  this._newFolder = newFolder;
  return this;
};

/**
 * Provides the newFolder of this CreateMailFolderReturn.
 * @return {Array.<string>} The newFolder of this CreateMailFolderReturn.
 */
tutao.entity.tutanota.CreateMailFolderReturn.prototype.getNewFolder = function() {
  return this._newFolder;
};

/**
 * Loads the newFolder of this CreateMailFolderReturn.
 * @return {Promise.<tutao.entity.tutanota.MailFolder>} Resolves to the loaded newFolder of this CreateMailFolderReturn or an exception if the loading failed.
 */
tutao.entity.tutanota.CreateMailFolderReturn.prototype.loadNewFolder = function() {
  return tutao.entity.tutanota.MailFolder.load(this._newFolder);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.CreateMailFolderReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
