"use strict";

tutao.provide('tutao.entity.sys.UserData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._date = null;
    this._mobilePhoneNumber = null;
    this._salt = null;
    this._userEncClientKey = null;
    this._userEncCustomerGroupKey = null;
    this._verifier = null;
    this._userGroupData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.UserData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._date = data.date;
  this._mobilePhoneNumber = data.mobilePhoneNumber;
  this._salt = data.salt;
  this._userEncClientKey = data.userEncClientKey;
  this._userEncCustomerGroupKey = data.userEncCustomerGroupKey;
  this._verifier = data.verifier;
  this._userGroupData = (data.userGroupData) ? new tutao.entity.sys.CreateGroupData(this, data.userGroupData) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.UserData.MODEL_VERSION = '11';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.UserData.PATH = '/rest/sys/userservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.UserData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.UserData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    date: this._date, 
    mobilePhoneNumber: this._mobilePhoneNumber, 
    salt: this._salt, 
    userEncClientKey: this._userEncClientKey, 
    userEncCustomerGroupKey: this._userEncCustomerGroupKey, 
    verifier: this._verifier, 
    userGroupData: tutao.entity.EntityHelper.aggregatesToJsonData(this._userGroupData)
  };
};

/**
 * The id of the UserData type.
 */
tutao.entity.sys.UserData.prototype.TYPE_ID = 396;

/**
 * The id of the date attribute.
 */
tutao.entity.sys.UserData.prototype.DATE_ATTRIBUTE_ID = 878;

/**
 * The id of the mobilePhoneNumber attribute.
 */
tutao.entity.sys.UserData.prototype.MOBILEPHONENUMBER_ATTRIBUTE_ID = 403;

/**
 * The id of the salt attribute.
 */
tutao.entity.sys.UserData.prototype.SALT_ATTRIBUTE_ID = 401;

/**
 * The id of the userEncClientKey attribute.
 */
tutao.entity.sys.UserData.prototype.USERENCCLIENTKEY_ATTRIBUTE_ID = 398;

/**
 * The id of the userEncCustomerGroupKey attribute.
 */
tutao.entity.sys.UserData.prototype.USERENCCUSTOMERGROUPKEY_ATTRIBUTE_ID = 399;

/**
 * The id of the verifier attribute.
 */
tutao.entity.sys.UserData.prototype.VERIFIER_ATTRIBUTE_ID = 402;

/**
 * The id of the userGroupData attribute.
 */
tutao.entity.sys.UserData.prototype.USERGROUPDATA_ATTRIBUTE_ID = 400;

/**
 * Sets the format of this UserData.
 * @param {string} format The format of this UserData.
 */
tutao.entity.sys.UserData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this UserData.
 * @return {string} The format of this UserData.
 */
tutao.entity.sys.UserData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the date of this UserData.
 * @param {Date} date The date of this UserData.
 */
tutao.entity.sys.UserData.prototype.setDate = function(date) {
  if (date == null) {
    this._date = null;
  } else {
    this._date = String(date.getTime());
  }
  return this;
};

/**
 * Provides the date of this UserData.
 * @return {Date} The date of this UserData.
 */
tutao.entity.sys.UserData.prototype.getDate = function() {
  if (this._date == null) {
    return null;
  }
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the mobilePhoneNumber of this UserData.
 * @param {string} mobilePhoneNumber The mobilePhoneNumber of this UserData.
 */
tutao.entity.sys.UserData.prototype.setMobilePhoneNumber = function(mobilePhoneNumber) {
  this._mobilePhoneNumber = mobilePhoneNumber;
  return this;
};

/**
 * Provides the mobilePhoneNumber of this UserData.
 * @return {string} The mobilePhoneNumber of this UserData.
 */
tutao.entity.sys.UserData.prototype.getMobilePhoneNumber = function() {
  return this._mobilePhoneNumber;
};

/**
 * Sets the salt of this UserData.
 * @param {string} salt The salt of this UserData.
 */
tutao.entity.sys.UserData.prototype.setSalt = function(salt) {
  this._salt = salt;
  return this;
};

/**
 * Provides the salt of this UserData.
 * @return {string} The salt of this UserData.
 */
tutao.entity.sys.UserData.prototype.getSalt = function() {
  return this._salt;
};

/**
 * Sets the userEncClientKey of this UserData.
 * @param {string} userEncClientKey The userEncClientKey of this UserData.
 */
tutao.entity.sys.UserData.prototype.setUserEncClientKey = function(userEncClientKey) {
  this._userEncClientKey = userEncClientKey;
  return this;
};

/**
 * Provides the userEncClientKey of this UserData.
 * @return {string} The userEncClientKey of this UserData.
 */
tutao.entity.sys.UserData.prototype.getUserEncClientKey = function() {
  return this._userEncClientKey;
};

/**
 * Sets the userEncCustomerGroupKey of this UserData.
 * @param {string} userEncCustomerGroupKey The userEncCustomerGroupKey of this UserData.
 */
tutao.entity.sys.UserData.prototype.setUserEncCustomerGroupKey = function(userEncCustomerGroupKey) {
  this._userEncCustomerGroupKey = userEncCustomerGroupKey;
  return this;
};

/**
 * Provides the userEncCustomerGroupKey of this UserData.
 * @return {string} The userEncCustomerGroupKey of this UserData.
 */
tutao.entity.sys.UserData.prototype.getUserEncCustomerGroupKey = function() {
  return this._userEncCustomerGroupKey;
};

/**
 * Sets the verifier of this UserData.
 * @param {string} verifier The verifier of this UserData.
 */
tutao.entity.sys.UserData.prototype.setVerifier = function(verifier) {
  this._verifier = verifier;
  return this;
};

/**
 * Provides the verifier of this UserData.
 * @return {string} The verifier of this UserData.
 */
tutao.entity.sys.UserData.prototype.getVerifier = function() {
  return this._verifier;
};

/**
 * Sets the userGroupData of this UserData.
 * @param {tutao.entity.sys.CreateGroupData} userGroupData The userGroupData of this UserData.
 */
tutao.entity.sys.UserData.prototype.setUserGroupData = function(userGroupData) {
  this._userGroupData = userGroupData;
  return this;
};

/**
 * Provides the userGroupData of this UserData.
 * @return {tutao.entity.sys.CreateGroupData} The userGroupData of this UserData.
 */
tutao.entity.sys.UserData.prototype.getUserGroupData = function() {
  return this._userGroupData;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.UserReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.UserData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 11;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.UserData.PATH, this, parameters, headers, tutao.entity.sys.UserReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.UserData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
