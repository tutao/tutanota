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
    this._listEncSessionKey = null;
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
  this._listEncSessionKey = data.listEncSessionKey;
  this._parentFolder = data.parentFolder;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CreateMailFolderData.MODEL_VERSION = '7';

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
    listEncSessionKey: this._listEncSessionKey, 
    parentFolder: this._parentFolder
  };
};

/**
 * The id of the CreateMailFolderData type.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.TYPE_ID = 450;

/**
 * The id of the folderName attribute.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.FOLDERNAME_ATTRIBUTE_ID = 453;

/**
 * The id of the listEncSessionKey attribute.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.LISTENCSESSIONKEY_ATTRIBUTE_ID = 454;

/**
 * The id of the parentFolder attribute.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.PARENTFOLDER_ATTRIBUTE_ID = 452;

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
  return this;
};

/**
 * Provides the folderName of this CreateMailFolderData.
 * @return {string} The folderName of this CreateMailFolderData.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.getFolderName = function() {
  if (this._folderName == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._folderName);
  return value;
};

/**
 * Sets the listEncSessionKey of this CreateMailFolderData.
 * @param {string} listEncSessionKey The listEncSessionKey of this CreateMailFolderData.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.setListEncSessionKey = function(listEncSessionKey) {
  this._listEncSessionKey = listEncSessionKey;
  return this;
};

/**
 * Provides the listEncSessionKey of this CreateMailFolderData.
 * @return {string} The listEncSessionKey of this CreateMailFolderData.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.getListEncSessionKey = function() {
  return this._listEncSessionKey;
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
 * @return {Promise.<tutao.entity.tutanota.CreateMailFolderReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.CreateMailFolderData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 7;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.CreateMailFolderData.PATH, this, parameters, headers, tutao.entity.tutanota.CreateMailFolderReturn);
};
