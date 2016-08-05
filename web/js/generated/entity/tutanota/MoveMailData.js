"use strict";

tutao.provide('tutao.entity.tutanota.MoveMailData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MoveMailData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._mails = [];
    this._targetFolder = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.MoveMailData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MoveMailData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._mails = data.mails;
  this._targetFolder = data.targetFolder;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.MoveMailData.MODEL_VERSION = '14';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.MoveMailData.PATH = '/rest/tutanota/movemailservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.MoveMailData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MoveMailData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    mails: this._mails, 
    targetFolder: this._targetFolder
  };
};

/**
 * Sets the format of this MoveMailData.
 * @param {string} format The format of this MoveMailData.
 */
tutao.entity.tutanota.MoveMailData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MoveMailData.
 * @return {string} The format of this MoveMailData.
 */
tutao.entity.tutanota.MoveMailData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Provides the mails of this MoveMailData.
 * @return {Array.<Array.<string>>} The mails of this MoveMailData.
 */
tutao.entity.tutanota.MoveMailData.prototype.getMails = function() {
  return this._mails;
};

/**
 * Sets the targetFolder of this MoveMailData.
 * @param {Array.<string>} targetFolder The targetFolder of this MoveMailData.
 */
tutao.entity.tutanota.MoveMailData.prototype.setTargetFolder = function(targetFolder) {
  this._targetFolder = targetFolder;
  return this;
};

/**
 * Provides the targetFolder of this MoveMailData.
 * @return {Array.<string>} The targetFolder of this MoveMailData.
 */
tutao.entity.tutanota.MoveMailData.prototype.getTargetFolder = function() {
  return this._targetFolder;
};

/**
 * Loads the targetFolder of this MoveMailData.
 * @return {Promise.<tutao.entity.tutanota.MailFolder>} Resolves to the loaded targetFolder of this MoveMailData or an exception if the loading failed.
 */
tutao.entity.tutanota.MoveMailData.prototype.loadTargetFolder = function() {
  return tutao.entity.tutanota.MailFolder.load(this._targetFolder);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.MoveMailData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "14";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.MoveMailData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MoveMailData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
