"use strict";

tutao.provide('tutao.entity.tutanota.DeleteMailFolderData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DeleteMailFolderData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._folders = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.DeleteMailFolderData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DeleteMailFolderData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._folders = data.folders;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.DeleteMailFolderData.MODEL_VERSION = '8';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.DeleteMailFolderData.PATH = '/rest/tutanota/mailfolderservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.DeleteMailFolderData.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DeleteMailFolderData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    folders: this._folders
  };
};

/**
 * The id of the DeleteMailFolderData type.
 */
tutao.entity.tutanota.DeleteMailFolderData.prototype.TYPE_ID = 458;

/**
 * The id of the folders attribute.
 */
tutao.entity.tutanota.DeleteMailFolderData.prototype.FOLDERS_ATTRIBUTE_ID = 460;

/**
 * Sets the format of this DeleteMailFolderData.
 * @param {string} format The format of this DeleteMailFolderData.
 */
tutao.entity.tutanota.DeleteMailFolderData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DeleteMailFolderData.
 * @return {string} The format of this DeleteMailFolderData.
 */
tutao.entity.tutanota.DeleteMailFolderData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Provides the folders of this DeleteMailFolderData.
 * @return {Array.<Array.<string>>} The folders of this DeleteMailFolderData.
 */
tutao.entity.tutanota.DeleteMailFolderData.prototype.getFolders = function() {
  return this._folders;
};

/**
 * Invokes DELETE on a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.DeleteMailFolderData=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.DeleteMailFolderData.prototype.erase = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 8;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.deleteService(tutao.entity.tutanota.DeleteMailFolderData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.DeleteMailFolderData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
