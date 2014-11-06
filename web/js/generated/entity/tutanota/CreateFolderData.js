"use strict";

tutao.provide('tutao.entity.tutanota.CreateFolderData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateFolderData = function(data) {
  if (data) {
    this.__format = data._format;
    this._fileName = data.fileName;
    this._group = data.group;
    this._listEncSessionKey = data.listEncSessionKey;
    this._symEncSessionKey = data.symEncSessionKey;
    this._parentFolder = data.parentFolder;
  } else {
    this.__format = "0";
    this._fileName = null;
    this._group = null;
    this._listEncSessionKey = null;
    this._symEncSessionKey = null;
    this._parentFolder = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.CreateFolderData.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CreateFolderData.MODEL_VERSION = '6';

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
    listEncSessionKey: this._listEncSessionKey, 
    symEncSessionKey: this._symEncSessionKey, 
    parentFolder: this._parentFolder
  };
};

/**
 * The id of the CreateFolderData type.
 */
tutao.entity.tutanota.CreateFolderData.prototype.TYPE_ID = 358;

/**
 * The id of the fileName attribute.
 */
tutao.entity.tutanota.CreateFolderData.prototype.FILENAME_ATTRIBUTE_ID = 360;

/**
 * The id of the group attribute.
 */
tutao.entity.tutanota.CreateFolderData.prototype.GROUP_ATTRIBUTE_ID = 361;

/**
 * The id of the listEncSessionKey attribute.
 */
tutao.entity.tutanota.CreateFolderData.prototype.LISTENCSESSIONKEY_ATTRIBUTE_ID = 363;

/**
 * The id of the symEncSessionKey attribute.
 */
tutao.entity.tutanota.CreateFolderData.prototype.SYMENCSESSIONKEY_ATTRIBUTE_ID = 362;

/**
 * The id of the parentFolder attribute.
 */
tutao.entity.tutanota.CreateFolderData.prototype.PARENTFOLDER_ATTRIBUTE_ID = 364;

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
  return this;
};

/**
 * Provides the fileName of this CreateFolderData.
 * @return {string} The fileName of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.getFileName = function() {
  if (this._fileName == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._fileName);
  return value;
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
 * Sets the listEncSessionKey of this CreateFolderData.
 * @param {string} listEncSessionKey The listEncSessionKey of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.setListEncSessionKey = function(listEncSessionKey) {
  this._listEncSessionKey = listEncSessionKey;
  return this;
};

/**
 * Provides the listEncSessionKey of this CreateFolderData.
 * @return {string} The listEncSessionKey of this CreateFolderData.
 */
tutao.entity.tutanota.CreateFolderData.prototype.getListEncSessionKey = function() {
  return this._listEncSessionKey;
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
 * @return {Promise.<tutao.entity.tutanota.CreateFolderReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.CreateFolderData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 6;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.CreateFolderData.PATH, this, parameters, headers, tutao.entity.tutanota.CreateFolderReturn);
};
