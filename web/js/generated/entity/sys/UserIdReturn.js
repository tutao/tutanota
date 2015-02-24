"use strict";

tutao.provide('tutao.entity.sys.UserIdReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserIdReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._userId = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.UserIdReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserIdReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._userId = data.userId;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.UserIdReturn.MODEL_VERSION = '7';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.UserIdReturn.PATH = '/rest/sys/useridservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.UserIdReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.UserIdReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    userId: this._userId
  };
};

/**
 * The id of the UserIdReturn type.
 */
tutao.entity.sys.UserIdReturn.prototype.TYPE_ID = 427;

/**
 * The id of the userId attribute.
 */
tutao.entity.sys.UserIdReturn.prototype.USERID_ATTRIBUTE_ID = 429;

/**
 * Sets the format of this UserIdReturn.
 * @param {string} format The format of this UserIdReturn.
 */
tutao.entity.sys.UserIdReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this UserIdReturn.
 * @return {string} The format of this UserIdReturn.
 */
tutao.entity.sys.UserIdReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the userId of this UserIdReturn.
 * @param {string} userId The userId of this UserIdReturn.
 */
tutao.entity.sys.UserIdReturn.prototype.setUserId = function(userId) {
  this._userId = userId;
  return this;
};

/**
 * Provides the userId of this UserIdReturn.
 * @return {string} The userId of this UserIdReturn.
 */
tutao.entity.sys.UserIdReturn.prototype.getUserId = function() {
  return this._userId;
};

/**
 * Loads the userId of this UserIdReturn.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded userId of this UserIdReturn or an exception if the loading failed.
 */
tutao.entity.sys.UserIdReturn.prototype.loadUserId = function() {
  return tutao.entity.sys.User.load(this._userId);
};

/**
 * Loads from the service.
 * @param {tutao.entity.sys.UserIdData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.UserIdReturn>} Resolves to UserIdReturn or an exception if the loading failed.
 */
tutao.entity.sys.UserIdReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 7;
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.UserIdReturn, tutao.entity.sys.UserIdReturn.PATH, entity, parameters, headers);
};
