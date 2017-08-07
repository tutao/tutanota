"use strict";

tutao.provide('tutao.entity.tutanota.CustomerAccountCreateData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CustomerAccountCreateData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._adminEncAccountingInfoSessionKey = null;
    this._adminEncCustomerServerPropertiesSessionKey = null;
    this._authToken = null;
    this._date = null;
    this._lang = null;
    this._systemAdminPubEncAccountingInfoSessionKey = null;
    this._userEncAccountGroupKey = null;
    this._userEncAdminGroupKey = null;
    this._adminGroupData = null;
    this._customerGroupData = null;
    this._userData = null;
    this._userGroupData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.CustomerAccountCreateData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._adminEncAccountingInfoSessionKey = data.adminEncAccountingInfoSessionKey;
  this._adminEncCustomerServerPropertiesSessionKey = data.adminEncCustomerServerPropertiesSessionKey;
  this._authToken = data.authToken;
  this._date = data.date;
  this._lang = data.lang;
  this._systemAdminPubEncAccountingInfoSessionKey = data.systemAdminPubEncAccountingInfoSessionKey;
  this._userEncAccountGroupKey = data.userEncAccountGroupKey;
  this._userEncAdminGroupKey = data.userEncAdminGroupKey;
  this._adminGroupData = (data.adminGroupData) ? new tutao.entity.tutanota.InternalGroupData(this, data.adminGroupData) : null;
  this._customerGroupData = (data.customerGroupData) ? new tutao.entity.tutanota.InternalGroupData(this, data.customerGroupData) : null;
  this._userData = (data.userData) ? new tutao.entity.tutanota.UserAccountUserData(this, data.userData) : null;
  this._userGroupData = (data.userGroupData) ? new tutao.entity.tutanota.InternalGroupData(this, data.userGroupData) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CustomerAccountCreateData.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.CustomerAccountCreateData.PATH = '/rest/tutanota/customeraccountservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    adminEncAccountingInfoSessionKey: this._adminEncAccountingInfoSessionKey, 
    adminEncCustomerServerPropertiesSessionKey: this._adminEncCustomerServerPropertiesSessionKey, 
    authToken: this._authToken, 
    date: this._date, 
    lang: this._lang, 
    systemAdminPubEncAccountingInfoSessionKey: this._systemAdminPubEncAccountingInfoSessionKey, 
    userEncAccountGroupKey: this._userEncAccountGroupKey, 
    userEncAdminGroupKey: this._userEncAdminGroupKey, 
    adminGroupData: tutao.entity.EntityHelper.aggregatesToJsonData(this._adminGroupData), 
    customerGroupData: tutao.entity.EntityHelper.aggregatesToJsonData(this._customerGroupData), 
    userData: tutao.entity.EntityHelper.aggregatesToJsonData(this._userData), 
    userGroupData: tutao.entity.EntityHelper.aggregatesToJsonData(this._userGroupData)
  };
};

/**
 * Sets the format of this CustomerAccountCreateData.
 * @param {string} format The format of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CustomerAccountCreateData.
 * @return {string} The format of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the adminEncAccountingInfoSessionKey of this CustomerAccountCreateData.
 * @param {string} adminEncAccountingInfoSessionKey The adminEncAccountingInfoSessionKey of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setAdminEncAccountingInfoSessionKey = function(adminEncAccountingInfoSessionKey) {
  this._adminEncAccountingInfoSessionKey = adminEncAccountingInfoSessionKey;
  return this;
};

/**
 * Provides the adminEncAccountingInfoSessionKey of this CustomerAccountCreateData.
 * @return {string} The adminEncAccountingInfoSessionKey of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getAdminEncAccountingInfoSessionKey = function() {
  return this._adminEncAccountingInfoSessionKey;
};

/**
 * Sets the adminEncCustomerServerPropertiesSessionKey of this CustomerAccountCreateData.
 * @param {string} adminEncCustomerServerPropertiesSessionKey The adminEncCustomerServerPropertiesSessionKey of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setAdminEncCustomerServerPropertiesSessionKey = function(adminEncCustomerServerPropertiesSessionKey) {
  this._adminEncCustomerServerPropertiesSessionKey = adminEncCustomerServerPropertiesSessionKey;
  return this;
};

/**
 * Provides the adminEncCustomerServerPropertiesSessionKey of this CustomerAccountCreateData.
 * @return {string} The adminEncCustomerServerPropertiesSessionKey of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getAdminEncCustomerServerPropertiesSessionKey = function() {
  return this._adminEncCustomerServerPropertiesSessionKey;
};

/**
 * Sets the authToken of this CustomerAccountCreateData.
 * @param {string} authToken The authToken of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setAuthToken = function(authToken) {
  this._authToken = authToken;
  return this;
};

/**
 * Provides the authToken of this CustomerAccountCreateData.
 * @return {string} The authToken of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getAuthToken = function() {
  return this._authToken;
};

/**
 * Sets the date of this CustomerAccountCreateData.
 * @param {Date} date The date of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setDate = function(date) {
  if (date == null) {
    this._date = null;
  } else {
    this._date = String(date.getTime());
  }
  return this;
};

/**
 * Provides the date of this CustomerAccountCreateData.
 * @return {Date} The date of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getDate = function() {
  if (this._date == null) {
    return null;
  }
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the lang of this CustomerAccountCreateData.
 * @param {string} lang The lang of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setLang = function(lang) {
  this._lang = lang;
  return this;
};

/**
 * Provides the lang of this CustomerAccountCreateData.
 * @return {string} The lang of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getLang = function() {
  return this._lang;
};

/**
 * Sets the systemAdminPubEncAccountingInfoSessionKey of this CustomerAccountCreateData.
 * @param {string} systemAdminPubEncAccountingInfoSessionKey The systemAdminPubEncAccountingInfoSessionKey of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setSystemAdminPubEncAccountingInfoSessionKey = function(systemAdminPubEncAccountingInfoSessionKey) {
  this._systemAdminPubEncAccountingInfoSessionKey = systemAdminPubEncAccountingInfoSessionKey;
  return this;
};

/**
 * Provides the systemAdminPubEncAccountingInfoSessionKey of this CustomerAccountCreateData.
 * @return {string} The systemAdminPubEncAccountingInfoSessionKey of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getSystemAdminPubEncAccountingInfoSessionKey = function() {
  return this._systemAdminPubEncAccountingInfoSessionKey;
};

/**
 * Sets the userEncAccountGroupKey of this CustomerAccountCreateData.
 * @param {string} userEncAccountGroupKey The userEncAccountGroupKey of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setUserEncAccountGroupKey = function(userEncAccountGroupKey) {
  this._userEncAccountGroupKey = userEncAccountGroupKey;
  return this;
};

/**
 * Provides the userEncAccountGroupKey of this CustomerAccountCreateData.
 * @return {string} The userEncAccountGroupKey of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getUserEncAccountGroupKey = function() {
  return this._userEncAccountGroupKey;
};

/**
 * Sets the userEncAdminGroupKey of this CustomerAccountCreateData.
 * @param {string} userEncAdminGroupKey The userEncAdminGroupKey of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setUserEncAdminGroupKey = function(userEncAdminGroupKey) {
  this._userEncAdminGroupKey = userEncAdminGroupKey;
  return this;
};

/**
 * Provides the userEncAdminGroupKey of this CustomerAccountCreateData.
 * @return {string} The userEncAdminGroupKey of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getUserEncAdminGroupKey = function() {
  return this._userEncAdminGroupKey;
};

/**
 * Sets the adminGroupData of this CustomerAccountCreateData.
 * @param {tutao.entity.tutanota.InternalGroupData} adminGroupData The adminGroupData of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setAdminGroupData = function(adminGroupData) {
  this._adminGroupData = adminGroupData;
  return this;
};

/**
 * Provides the adminGroupData of this CustomerAccountCreateData.
 * @return {tutao.entity.tutanota.InternalGroupData} The adminGroupData of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getAdminGroupData = function() {
  return this._adminGroupData;
};

/**
 * Sets the customerGroupData of this CustomerAccountCreateData.
 * @param {tutao.entity.tutanota.InternalGroupData} customerGroupData The customerGroupData of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setCustomerGroupData = function(customerGroupData) {
  this._customerGroupData = customerGroupData;
  return this;
};

/**
 * Provides the customerGroupData of this CustomerAccountCreateData.
 * @return {tutao.entity.tutanota.InternalGroupData} The customerGroupData of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getCustomerGroupData = function() {
  return this._customerGroupData;
};

/**
 * Sets the userData of this CustomerAccountCreateData.
 * @param {tutao.entity.tutanota.UserAccountUserData} userData The userData of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setUserData = function(userData) {
  this._userData = userData;
  return this;
};

/**
 * Provides the userData of this CustomerAccountCreateData.
 * @return {tutao.entity.tutanota.UserAccountUserData} The userData of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getUserData = function() {
  return this._userData;
};

/**
 * Sets the userGroupData of this CustomerAccountCreateData.
 * @param {tutao.entity.tutanota.InternalGroupData} userGroupData The userGroupData of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setUserGroupData = function(userGroupData) {
  this._userGroupData = userGroupData;
  return this;
};

/**
 * Provides the userGroupData of this CustomerAccountCreateData.
 * @return {tutao.entity.tutanota.InternalGroupData} The userGroupData of this CustomerAccountCreateData.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getUserGroupData = function() {
  return this._userGroupData;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.CustomerAccountCreateData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.CustomerAccountCreateData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
