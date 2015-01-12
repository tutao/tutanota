"use strict";

tutao.provide('tutao.entity.sys.UserDataDelete');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserDataDelete = function(data) {
  if (data) {
    this.__format = data._format;
    this._restore = data.restore;
    this._user = data.user;
  } else {
    this.__format = "0";
    this._restore = null;
    this._user = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.UserDataDelete.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.UserDataDelete.MODEL_VERSION = '6';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.UserDataDelete.PATH = '/rest/sys/userservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.UserDataDelete.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.UserDataDelete.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    restore: this._restore, 
    user: this._user
  };
};

/**
 * The id of the UserDataDelete type.
 */
tutao.entity.sys.UserDataDelete.prototype.TYPE_ID = 404;

/**
 * The id of the restore attribute.
 */
tutao.entity.sys.UserDataDelete.prototype.RESTORE_ATTRIBUTE_ID = 406;

/**
 * The id of the user attribute.
 */
tutao.entity.sys.UserDataDelete.prototype.USER_ATTRIBUTE_ID = 407;

/**
 * Sets the format of this UserDataDelete.
 * @param {string} format The format of this UserDataDelete.
 */
tutao.entity.sys.UserDataDelete.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this UserDataDelete.
 * @return {string} The format of this UserDataDelete.
 */
tutao.entity.sys.UserDataDelete.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the restore of this UserDataDelete.
 * @param {boolean} restore The restore of this UserDataDelete.
 */
tutao.entity.sys.UserDataDelete.prototype.setRestore = function(restore) {
  this._restore = restore ? '1' : '0';
  return this;
};

/**
 * Provides the restore of this UserDataDelete.
 * @return {boolean} The restore of this UserDataDelete.
 */
tutao.entity.sys.UserDataDelete.prototype.getRestore = function() {
  return this._restore == '1';
};

/**
 * Sets the user of this UserDataDelete.
 * @param {string} user The user of this UserDataDelete.
 */
tutao.entity.sys.UserDataDelete.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this UserDataDelete.
 * @return {string} The user of this UserDataDelete.
 */
tutao.entity.sys.UserDataDelete.prototype.getUser = function() {
  return this._user;
};

/**
 * Loads the user of this UserDataDelete.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded user of this UserDataDelete or an exception if the loading failed.
 */
tutao.entity.sys.UserDataDelete.prototype.loadUser = function() {
  return tutao.entity.sys.User.load(this._user);
};

/**
 * Invokes DELETE on a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.UserDataDelete=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.UserDataDelete.prototype.erase = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 6;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.deleteService(tutao.entity.sys.UserDataDelete.PATH, this, parameters, headers, null);
};
