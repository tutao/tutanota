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
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SwitchAccountTypeData.MODEL_VERSION = '9';

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
    accountType: this._accountType
  };
};

/**
 * The id of the SwitchAccountTypeData type.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.TYPE_ID = 754;

/**
 * The id of the accountType attribute.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.ACCOUNTTYPE_ATTRIBUTE_ID = 756;

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
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.SwitchAccountTypeData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.SwitchAccountTypeData.PATH, this, parameters, headers, null);
};
