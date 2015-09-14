"use strict";

tutao.provide('tutao.entity.sys.SwitchAccountTypeData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SwitchAccountTypeData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._accountType = null;
    this._date = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SwitchAccountTypeData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._accountType = data.accountType;
  this._date = data.date;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SwitchAccountTypeData.MODEL_VERSION = '10';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.SwitchAccountTypeData.PATH = '/rest/sys/switchaccounttypeservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    accountType: this._accountType, 
    date: this._date
  };
};

/**
 * The id of the SwitchAccountTypeData type.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.TYPE_ID = 772;

/**
 * The id of the accountType attribute.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.ACCOUNTTYPE_ATTRIBUTE_ID = 774;

/**
 * The id of the date attribute.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.DATE_ATTRIBUTE_ID = 775;

/**
 * Sets the format of this SwitchAccountTypeData.
 * @param {string} format The format of this SwitchAccountTypeData.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SwitchAccountTypeData.
 * @return {string} The format of this SwitchAccountTypeData.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the accountType of this SwitchAccountTypeData.
 * @param {string} accountType The accountType of this SwitchAccountTypeData.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.setAccountType = function(accountType) {
  this._accountType = accountType;
  return this;
};

/**
 * Provides the accountType of this SwitchAccountTypeData.
 * @return {string} The accountType of this SwitchAccountTypeData.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.getAccountType = function() {
  return this._accountType;
};

/**
 * Sets the date of this SwitchAccountTypeData.
 * @param {Date} date The date of this SwitchAccountTypeData.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.setDate = function(date) {
  if (date == null) {
    this._date = null;
  } else {
    this._date = String(date.getTime());
  }
  return this;
};

/**
 * Provides the date of this SwitchAccountTypeData.
 * @return {Date} The date of this SwitchAccountTypeData.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.getDate = function() {
  if (this._date == null) {
    return null;
  }
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 10;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.SwitchAccountTypeData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
