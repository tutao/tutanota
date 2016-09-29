"use strict";

tutao.provide('tutao.entity.tutanota.CreateFolderData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateFolderData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._fileName = null;
    this._fileName_ = null;
    this._group = null;
    this._ownerEncSessionKey = null;
    this._symEncSessionKey = null;
    this._parentFolder = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.CreateFolderData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateFolderData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._fileName = data.fileName;
  this._fileName_ = null;
  this._group = data.group;
  this._ownerEncSessionKey = data.ownerEncSessionKey;
  this._symEncSessionKey = data.symEncSessionKey;
  this._parentFolder = data.parentFolder;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CreateFolderData.MODEL_VERSION = '15';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.CreateFolderData.PATH = '/rest/tutanota/createfolderservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.CreateFolderData.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CreateFolderData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    fileName: this._fileName, 
    group: this._group, 
    ownerEncSessionKey: this._ownerEncSessionKey, 
    symEncSessionKey: this._symEncSessionKey, 
    parentFolder: this._parentFolder
  };
};

/**
 * Sets the format of this CreateFolderData.
 * @param {string} format The format of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateFolderData.
 * @return {string} The format of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the fileName of this CreateFolderData.
 * @param {string} fileName The fileName of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.setFileName = function(fileName) {
  var dataToEncrypt = fileName;
  this._fileName = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._fileName_ = fileName;
  return this;
};

/**
 * Provides the fileName of this CreateFolderData.
 * @return {string} The fileName of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.getFileName = function() {
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
 * Sets the group of this CreateFolderData.
 * @param {string} group The group of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this CreateFolderData.
 * @return {string} The group of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.getGroup = function() {
  return this._group;
};

/**
 * Sets the ownerEncSessionKey of this CreateFolderData.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this._ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this CreateFolderData.
 * @return {string} The ownerEncSessionKey of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.getOwnerEncSessionKey = function() {
  return this._ownerEncSessionKey;
};

/**
 * Sets the symEncSessionKey of this CreateFolderData.
 * @param {string} symEncSessionKey The symEncSessionKey of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.setSymEncSessionKey = function(symEncSessionKey) {
  this._symEncSessionKey = symEncSessionKey;
  return this;
};

/**
 * Provides the symEncSessionKey of this CreateFolderData.
 * @return {string} The symEncSessionKey of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.getSymEncSessionKey = function() {
  return this._symEncSessionKey;
};

/**
 * Sets the parentFolder of this CreateFolderData.
 * @param {Array.<string>} parentFolder The parentFolder of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.setParentFolder = function(parentFolder) {
  this._parentFolder = parentFolder;
  return this;
};

/**
 * Provides the parentFolder of this CreateFolderData.
 * @return {Array.<string>} The parentFolder of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.getParentFolder = function() {
  return this._parentFolder;
};

/**
 * Loads the parentFolder of this CreateFolderData.
 * @return {Promise.<tutao.entity.tutanota.File>} Resolves to the loaded parentFolder of this CreateFolderData or an exception if the loading failed.
 */
tutao.entity.tutanota.CreateFolderData.prototype.loadParentFolder = function() {
  return tutao.entity.tutanota.File.load(this._parentFolder);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.CreateFolderReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.CreateFolderData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "15";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.CreateFolderData.PATH, this, parameters, headers, tutao.entity.tutanota.CreateFolderReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.CreateFolderData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
