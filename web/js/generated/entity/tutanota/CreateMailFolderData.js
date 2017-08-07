"use strict";

tutao.provide('tutao.entity.tutanota.CreateMailFolderData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateMailFolderData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._folderName = null;
    this._folderName_ = null;
    this._ownerEncSessionKey = null;
    this._parentFolder = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.CreateMailFolderData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._folderName = data.folderName;
  this._folderName_ = null;
  this._ownerEncSessionKey = data.ownerEncSessionKey;
  this._parentFolder = data.parentFolder;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CreateMailFolderData.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.CreateMailFolderData.PATH = '/rest/tutanota/mailfolderservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    folderName: this._folderName, 
    ownerEncSessionKey: this._ownerEncSessionKey, 
    parentFolder: this._parentFolder
  };
};

/**
 * Sets the format of this CreateMailFolderData.
 * @param {string} format The format of this CreateMailFolderData.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateMailFolderData.
 * @return {string} The format of this CreateMailFolderData.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the folderName of this CreateMailFolderData.
 * @param {string} folderName The folderName of this CreateMailFolderData.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.setFolderName = function(folderName) {
  var dataToEncrypt = folderName;
  this._folderName = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._folderName_ = folderName;
  return this;
};

/**
 * Provides the folderName of this CreateMailFolderData.
 * @return {string} The folderName of this CreateMailFolderData.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.getFolderName = function() {
  if (this._folderName_ != null) {
    return this._folderName_;
  }
  if (this._folderName == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._folderName);
    this._folderName_ = value;
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
 * Sets the ownerEncSessionKey of this CreateMailFolderData.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this CreateMailFolderData.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this._ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this CreateMailFolderData.
 * @return {string} The ownerEncSessionKey of this CreateMailFolderData.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.getOwnerEncSessionKey = function() {
  return this._ownerEncSessionKey;
};

/**
 * Sets the parentFolder of this CreateMailFolderData.
 * @param {Array.<string>} parentFolder The parentFolder of this CreateMailFolderData.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.setParentFolder = function(parentFolder) {
  this._parentFolder = parentFolder;
  return this;
};

/**
 * Provides the parentFolder of this CreateMailFolderData.
 * @return {Array.<string>} The parentFolder of this CreateMailFolderData.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.getParentFolder = function() {
  return this._parentFolder;
};

/**
 * Loads the parentFolder of this CreateMailFolderData.
 * @return {Promise.<tutao.entity.tutanota.MailFolder>} Resolves to the loaded parentFolder of this CreateMailFolderData or an exception if the loading failed.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.loadParentFolder = function() {
  return tutao.entity.tutanota.MailFolder.load(this._parentFolder);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.CreateMailFolderReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.CreateMailFolderData.PATH, this, parameters, headers, tutao.entity.tutanota.CreateMailFolderReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
