"use strict";

tutao.provide('tutao.entity.tutanota.CreateFileData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateFileData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._fileName = null;
    this._fileName_ = null;
    this._group = null;
    this._ownerEncSessionKey = null;
    this._mimeType = null;
    this._mimeType_ = null;
    this._fileData = null;
    this._parentFolder = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.CreateFileData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateFileData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._fileName = data.fileName;
  this._fileName_ = null;
  this._group = data.group;
  this._ownerEncSessionKey = data.ownerEncSessionKey;
  this._mimeType = data.mimeType;
  this._mimeType_ = null;
  this._fileData = data.fileData;
  this._parentFolder = data.parentFolder;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CreateFileData.MODEL_VERSION = '13';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.CreateFileData.PATH = '/rest/tutanota/createfileservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.CreateFileData.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CreateFileData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    fileName: this._fileName, 
    group: this._group, 
    ownerEncSessionKey: this._ownerEncSessionKey, 
    mimeType: this._mimeType, 
    fileData: this._fileData, 
    parentFolder: this._parentFolder
  };
};

/**
 * The id of the CreateFileData type.
 */
tutao.entity.tutanota.CreateFileData.prototype.TYPE_ID = 346;

/**
 * The id of the fileName attribute.
 */
tutao.entity.tutanota.CreateFileData.prototype.FILENAME_ATTRIBUTE_ID = 348;

/**
 * The id of the group attribute.
 */
tutao.entity.tutanota.CreateFileData.prototype.GROUP_ATTRIBUTE_ID = 350;

/**
 * The id of the ownerEncSessionKey attribute.
 */
tutao.entity.tutanota.CreateFileData.prototype.OWNERENCSESSIONKEY_ATTRIBUTE_ID = 351;

/**
 * The id of the mimeType attribute.
 */
tutao.entity.tutanota.CreateFileData.prototype.MIMETYPE_ATTRIBUTE_ID = 349;

/**
 * The id of the fileData attribute.
 */
tutao.entity.tutanota.CreateFileData.prototype.FILEDATA_ATTRIBUTE_ID = 352;

/**
 * The id of the parentFolder attribute.
 */
tutao.entity.tutanota.CreateFileData.prototype.PARENTFOLDER_ATTRIBUTE_ID = 353;

/**
 * Sets the format of this CreateFileData.
 * @param {string} format The format of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateFileData.
 * @return {string} The format of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the fileName of this CreateFileData.
 * @param {string} fileName The fileName of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.setFileName = function(fileName) {
  var dataToEncrypt = fileName;
  this._fileName = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._fileName_ = fileName;
  return this;
};

/**
 * Provides the fileName of this CreateFileData.
 * @return {string} The fileName of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.getFileName = function() {
  if (this._fileName_ != null) {
    return this._fileName_;
  }
  if (this._fileName == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._fileName);
    this._fileName_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the group of this CreateFileData.
 * @param {string} group The group of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this CreateFileData.
 * @return {string} The group of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.getGroup = function() {
  return this._group;
};

/**
 * Sets the ownerEncSessionKey of this CreateFileData.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this._ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this CreateFileData.
 * @return {string} The ownerEncSessionKey of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.getOwnerEncSessionKey = function() {
  return this._ownerEncSessionKey;
};

/**
 * Sets the mimeType of this CreateFileData.
 * @param {string} mimeType The mimeType of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.setMimeType = function(mimeType) {
  var dataToEncrypt = mimeType;
  this._mimeType = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._mimeType_ = mimeType;
  return this;
};

/**
 * Provides the mimeType of this CreateFileData.
 * @return {string} The mimeType of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.getMimeType = function() {
  if (this._mimeType_ != null) {
    return this._mimeType_;
  }
  if (this._mimeType == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._mimeType);
    this._mimeType_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the fileData of this CreateFileData.
 * @param {string} fileData The fileData of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.setFileData = function(fileData) {
  this._fileData = fileData;
  return this;
};

/**
 * Provides the fileData of this CreateFileData.
 * @return {string} The fileData of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.getFileData = function() {
  return this._fileData;
};

/**
 * Loads the fileData of this CreateFileData.
 * @return {Promise.<tutao.entity.tutanota.FileData>} Resolves to the loaded fileData of this CreateFileData or an exception if the loading failed.
 */
tutao.entity.tutanota.CreateFileData.prototype.loadFileData = function() {
  return tutao.entity.tutanota.FileData.load(this._fileData);
};

/**
 * Sets the parentFolder of this CreateFileData.
 * @param {Array.<string>} parentFolder The parentFolder of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.setParentFolder = function(parentFolder) {
  this._parentFolder = parentFolder;
  return this;
};

/**
 * Provides the parentFolder of this CreateFileData.
 * @return {Array.<string>} The parentFolder of this CreateFileData.
 */
tutao.entity.tutanota.CreateFileData.prototype.getParentFolder = function() {
  return this._parentFolder;
};

/**
 * Loads the parentFolder of this CreateFileData.
 * @return {Promise.<tutao.entity.tutanota.File>} Resolves to the loaded parentFolder of this CreateFileData or an exception if the loading failed.
 */
tutao.entity.tutanota.CreateFileData.prototype.loadParentFolder = function() {
  return tutao.entity.tutanota.File.load(this._parentFolder);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.CreateFileReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.CreateFileData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "13";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.CreateFileData.PATH, this, parameters, headers, tutao.entity.tutanota.CreateFileReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.CreateFileData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
