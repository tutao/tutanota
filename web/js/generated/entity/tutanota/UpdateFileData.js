"use strict";

tutao.provide('tutao.entity.tutanota.UpdateFileData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UpdateFileData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._file = null;
    this._fileData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.UpdateFileData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UpdateFileData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._file = data.file;
  this._fileData = data.fileData;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.UpdateFileData.MODEL_VERSION = '13';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.UpdateFileData.PATH = '/rest/tutanota/updatefileservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.UpdateFileData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.UpdateFileData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    file: this._file, 
    fileData: this._fileData
  };
};

/**
 * The id of the UpdateFileData type.
 */
tutao.entity.tutanota.UpdateFileData.prototype.TYPE_ID = 369;

/**
 * The id of the file attribute.
 */
tutao.entity.tutanota.UpdateFileData.prototype.FILE_ATTRIBUTE_ID = 371;

/**
 * The id of the fileData attribute.
 */
tutao.entity.tutanota.UpdateFileData.prototype.FILEDATA_ATTRIBUTE_ID = 372;

/**
 * Sets the format of this UpdateFileData.
 * @param {string} format The format of this UpdateFileData.
 */
tutao.entity.tutanota.UpdateFileData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this UpdateFileData.
 * @return {string} The format of this UpdateFileData.
 */
tutao.entity.tutanota.UpdateFileData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the file of this UpdateFileData.
 * @param {Array.<string>} file The file of this UpdateFileData.
 */
tutao.entity.tutanota.UpdateFileData.prototype.setFile = function(file) {
  this._file = file;
  return this;
};

/**
 * Provides the file of this UpdateFileData.
 * @return {Array.<string>} The file of this UpdateFileData.
 */
tutao.entity.tutanota.UpdateFileData.prototype.getFile = function() {
  return this._file;
};

/**
 * Loads the file of this UpdateFileData.
 * @return {Promise.<tutao.entity.tutanota.File>} Resolves to the loaded file of this UpdateFileData or an exception if the loading failed.
 */
tutao.entity.tutanota.UpdateFileData.prototype.loadFile = function() {
  return tutao.entity.tutanota.File.load(this._file);
};

/**
 * Sets the fileData of this UpdateFileData.
 * @param {string} fileData The fileData of this UpdateFileData.
 */
tutao.entity.tutanota.UpdateFileData.prototype.setFileData = function(fileData) {
  this._fileData = fileData;
  return this;
};

/**
 * Provides the fileData of this UpdateFileData.
 * @return {string} The fileData of this UpdateFileData.
 */
tutao.entity.tutanota.UpdateFileData.prototype.getFileData = function() {
  return this._fileData;
};

/**
 * Loads the fileData of this UpdateFileData.
 * @return {Promise.<tutao.entity.tutanota.FileData>} Resolves to the loaded fileData of this UpdateFileData or an exception if the loading failed.
 */
tutao.entity.tutanota.UpdateFileData.prototype.loadFileData = function() {
  return tutao.entity.tutanota.FileData.load(this._fileData);
};

/**
 * Updates this service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.UpdateFileData.prototype.update = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "13";
  return tutao.locator.entityRestClient.putService(tutao.entity.tutanota.UpdateFileData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.UpdateFileData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
