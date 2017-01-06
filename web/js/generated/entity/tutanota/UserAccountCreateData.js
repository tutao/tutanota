"use strict";

tutao.provide('tutao.entity.tutanota.UserAccountCreateData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UserAccountCreateData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._date = null;
    this._userData = null;
    this._userGroupData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.UserAccountCreateData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._date = data.date;
  this._userData = (data.userData) ? new tutao.entity.tutanota.UserAccountUserData(this, data.userData) : null;
  this._userGroupData = (data.userGroupData) ? new tutao.entity.tutanota.InternalGroupData(this, data.userGroupData) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.UserAccountCreateData.MODEL_VERSION = '17';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.UserAccountCreateData.PATH = '/rest/tutanota/useraccountservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    date: this._date, 
    userData: tutao.entity.EntityHelper.aggregatesToJsonData(this._userData), 
    userGroupData: tutao.entity.EntityHelper.aggregatesToJsonData(this._userGroupData)
  };
};

/**
 * Sets the format of this UserAccountCreateData.
 * @param {string} format The format of this UserAccountCreateData.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this UserAccountCreateData.
 * @return {string} The format of this UserAccountCreateData.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the date of this UserAccountCreateData.
 * @param {Date} date The date of this UserAccountCreateData.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.setDate = function(date) {
  if (date == null) {
    this._date = null;
  } else {
    this._date = String(date.getTime());
  }
  return this;
};

/**
 * Provides the date of this UserAccountCreateData.
 * @return {Date} The date of this UserAccountCreateData.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.getDate = function() {
  if (this._date == null) {
    return null;
  }
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the userData of this UserAccountCreateData.
 * @param {tutao.entity.tutanota.UserAccountUserData} userData The userData of this UserAccountCreateData.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.setUserData = function(userData) {
  this._userData = userData;
  return this;
};

/**
 * Provides the userData of this UserAccountCreateData.
 * @return {tutao.entity.tutanota.UserAccountUserData} The userData of this UserAccountCreateData.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.getUserData = function() {
  return this._userData;
};

/**
 * Sets the userGroupData of this UserAccountCreateData.
 * @param {tutao.entity.tutanota.InternalGroupData} userGroupData The userGroupData of this UserAccountCreateData.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.setUserGroupData = function(userGroupData) {
  this._userGroupData = userGroupData;
  return this;
};

/**
 * Provides the userGroupData of this UserAccountCreateData.
 * @return {tutao.entity.tutanota.InternalGroupData} The userGroupData of this UserAccountCreateData.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.getUserGroupData = function() {
  return this._userGroupData;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "17";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.UserAccountCreateData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.UserAccountCreateData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
