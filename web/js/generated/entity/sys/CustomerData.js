"use strict";

tutao.provide('tutao.entity.sys.CustomerData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._accountingInfoBucketEncAccountingInfoSessionKey = null;
    this._adminEncAccountingInfoSessionKey = null;
    this._authToken = null;
    this._company = null;
    this._date = null;
    this._domain = null;
    this._salt = null;
    this._symEncAccountGroupKey = null;
    this._systemCustomerPubEncAccountingInfoBucketKey = null;
    this._systemCustomerPubKeyVersion = null;
    this._userEncClientKey = null;
    this._verifier = null;
    this._adminGroupList = null;
    this._customerGroupList = null;
    this._teamGroupList = null;
    this._userGroupList = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CustomerData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._accountingInfoBucketEncAccountingInfoSessionKey = data.accountingInfoBucketEncAccountingInfoSessionKey;
  this._adminEncAccountingInfoSessionKey = data.adminEncAccountingInfoSessionKey;
  this._authToken = data.authToken;
  this._company = data.company;
  this._date = data.date;
  this._domain = data.domain;
  this._salt = data.salt;
  this._symEncAccountGroupKey = data.symEncAccountGroupKey;
  this._systemCustomerPubEncAccountingInfoBucketKey = data.systemCustomerPubEncAccountingInfoBucketKey;
  this._systemCustomerPubKeyVersion = data.systemCustomerPubKeyVersion;
  this._userEncClientKey = data.userEncClientKey;
  this._verifier = data.verifier;
  this._adminGroupList = (data.adminGroupList) ? new tutao.entity.sys.CreateGroupListData(this, data.adminGroupList) : null;
  this._customerGroupList = (data.customerGroupList) ? new tutao.entity.sys.CreateGroupListData(this, data.customerGroupList) : null;
  this._teamGroupList = (data.teamGroupList) ? new tutao.entity.sys.CreateGroupListData(this, data.teamGroupList) : null;
  this._userGroupList = (data.userGroupList) ? new tutao.entity.sys.CreateGroupListData(this, data.userGroupList) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CustomerData.MODEL_VERSION = '22';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.CustomerData.PATH = '/rest/sys/customerservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CustomerData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CustomerData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    accountingInfoBucketEncAccountingInfoSessionKey: this._accountingInfoBucketEncAccountingInfoSessionKey, 
    adminEncAccountingInfoSessionKey: this._adminEncAccountingInfoSessionKey, 
    authToken: this._authToken, 
    company: this._company, 
    date: this._date, 
    domain: this._domain, 
    salt: this._salt, 
    symEncAccountGroupKey: this._symEncAccountGroupKey, 
    systemCustomerPubEncAccountingInfoBucketKey: this._systemCustomerPubEncAccountingInfoBucketKey, 
    systemCustomerPubKeyVersion: this._systemCustomerPubKeyVersion, 
    userEncClientKey: this._userEncClientKey, 
    verifier: this._verifier, 
    adminGroupList: tutao.entity.EntityHelper.aggregatesToJsonData(this._adminGroupList), 
    customerGroupList: tutao.entity.EntityHelper.aggregatesToJsonData(this._customerGroupList), 
    teamGroupList: tutao.entity.EntityHelper.aggregatesToJsonData(this._teamGroupList), 
    userGroupList: tutao.entity.EntityHelper.aggregatesToJsonData(this._userGroupList)
  };
};

/**
 * Sets the format of this CustomerData.
 * @param {string} format The format of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CustomerData.
 * @return {string} The format of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the accountingInfoBucketEncAccountingInfoSessionKey of this CustomerData.
 * @param {string} accountingInfoBucketEncAccountingInfoSessionKey The accountingInfoBucketEncAccountingInfoSessionKey of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setAccountingInfoBucketEncAccountingInfoSessionKey = function(accountingInfoBucketEncAccountingInfoSessionKey) {
  this._accountingInfoBucketEncAccountingInfoSessionKey = accountingInfoBucketEncAccountingInfoSessionKey;
  return this;
};

/**
 * Provides the accountingInfoBucketEncAccountingInfoSessionKey of this CustomerData.
 * @return {string} The accountingInfoBucketEncAccountingInfoSessionKey of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getAccountingInfoBucketEncAccountingInfoSessionKey = function() {
  return this._accountingInfoBucketEncAccountingInfoSessionKey;
};

/**
 * Sets the adminEncAccountingInfoSessionKey of this CustomerData.
 * @param {string} adminEncAccountingInfoSessionKey The adminEncAccountingInfoSessionKey of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setAdminEncAccountingInfoSessionKey = function(adminEncAccountingInfoSessionKey) {
  this._adminEncAccountingInfoSessionKey = adminEncAccountingInfoSessionKey;
  return this;
};

/**
 * Provides the adminEncAccountingInfoSessionKey of this CustomerData.
 * @return {string} The adminEncAccountingInfoSessionKey of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getAdminEncAccountingInfoSessionKey = function() {
  return this._adminEncAccountingInfoSessionKey;
};

/**
 * Sets the authToken of this CustomerData.
 * @param {string} authToken The authToken of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setAuthToken = function(authToken) {
  this._authToken = authToken;
  return this;
};

/**
 * Provides the authToken of this CustomerData.
 * @return {string} The authToken of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getAuthToken = function() {
  return this._authToken;
};

/**
 * Sets the company of this CustomerData.
 * @param {string} company The company of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setCompany = function(company) {
  this._company = company;
  return this;
};

/**
 * Provides the company of this CustomerData.
 * @return {string} The company of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getCompany = function() {
  return this._company;
};

/**
 * Sets the date of this CustomerData.
 * @param {Date} date The date of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setDate = function(date) {
  if (date == null) {
    this._date = null;
  } else {
    this._date = String(date.getTime());
  }
  return this;
};

/**
 * Provides the date of this CustomerData.
 * @return {Date} The date of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getDate = function() {
  if (this._date == null) {
    return null;
  }
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the domain of this CustomerData.
 * @param {string} domain The domain of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setDomain = function(domain) {
  this._domain = domain;
  return this;
};

/**
 * Provides the domain of this CustomerData.
 * @return {string} The domain of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getDomain = function() {
  return this._domain;
};

/**
 * Sets the salt of this CustomerData.
 * @param {string} salt The salt of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setSalt = function(salt) {
  this._salt = salt;
  return this;
};

/**
 * Provides the salt of this CustomerData.
 * @return {string} The salt of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getSalt = function() {
  return this._salt;
};

/**
 * Sets the symEncAccountGroupKey of this CustomerData.
 * @param {string} symEncAccountGroupKey The symEncAccountGroupKey of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setSymEncAccountGroupKey = function(symEncAccountGroupKey) {
  this._symEncAccountGroupKey = symEncAccountGroupKey;
  return this;
};

/**
 * Provides the symEncAccountGroupKey of this CustomerData.
 * @return {string} The symEncAccountGroupKey of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getSymEncAccountGroupKey = function() {
  return this._symEncAccountGroupKey;
};

/**
 * Sets the systemCustomerPubEncAccountingInfoBucketKey of this CustomerData.
 * @param {string} systemCustomerPubEncAccountingInfoBucketKey The systemCustomerPubEncAccountingInfoBucketKey of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setSystemCustomerPubEncAccountingInfoBucketKey = function(systemCustomerPubEncAccountingInfoBucketKey) {
  this._systemCustomerPubEncAccountingInfoBucketKey = systemCustomerPubEncAccountingInfoBucketKey;
  return this;
};

/**
 * Provides the systemCustomerPubEncAccountingInfoBucketKey of this CustomerData.
 * @return {string} The systemCustomerPubEncAccountingInfoBucketKey of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getSystemCustomerPubEncAccountingInfoBucketKey = function() {
  return this._systemCustomerPubEncAccountingInfoBucketKey;
};

/**
 * Sets the systemCustomerPubKeyVersion of this CustomerData.
 * @param {string} systemCustomerPubKeyVersion The systemCustomerPubKeyVersion of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setSystemCustomerPubKeyVersion = function(systemCustomerPubKeyVersion) {
  this._systemCustomerPubKeyVersion = systemCustomerPubKeyVersion;
  return this;
};

/**
 * Provides the systemCustomerPubKeyVersion of this CustomerData.
 * @return {string} The systemCustomerPubKeyVersion of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getSystemCustomerPubKeyVersion = function() {
  return this._systemCustomerPubKeyVersion;
};

/**
 * Sets the userEncClientKey of this CustomerData.
 * @param {string} userEncClientKey The userEncClientKey of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setUserEncClientKey = function(userEncClientKey) {
  this._userEncClientKey = userEncClientKey;
  return this;
};

/**
 * Provides the userEncClientKey of this CustomerData.
 * @return {string} The userEncClientKey of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getUserEncClientKey = function() {
  return this._userEncClientKey;
};

/**
 * Sets the verifier of this CustomerData.
 * @param {string} verifier The verifier of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setVerifier = function(verifier) {
  this._verifier = verifier;
  return this;
};

/**
 * Provides the verifier of this CustomerData.
 * @return {string} The verifier of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getVerifier = function() {
  return this._verifier;
};

/**
 * Sets the adminGroupList of this CustomerData.
 * @param {tutao.entity.sys.CreateGroupListData} adminGroupList The adminGroupList of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setAdminGroupList = function(adminGroupList) {
  this._adminGroupList = adminGroupList;
  return this;
};

/**
 * Provides the adminGroupList of this CustomerData.
 * @return {tutao.entity.sys.CreateGroupListData} The adminGroupList of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getAdminGroupList = function() {
  return this._adminGroupList;
};

/**
 * Sets the customerGroupList of this CustomerData.
 * @param {tutao.entity.sys.CreateGroupListData} customerGroupList The customerGroupList of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setCustomerGroupList = function(customerGroupList) {
  this._customerGroupList = customerGroupList;
  return this;
};

/**
 * Provides the customerGroupList of this CustomerData.
 * @return {tutao.entity.sys.CreateGroupListData} The customerGroupList of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getCustomerGroupList = function() {
  return this._customerGroupList;
};

/**
 * Sets the teamGroupList of this CustomerData.
 * @param {tutao.entity.sys.CreateGroupListData} teamGroupList The teamGroupList of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setTeamGroupList = function(teamGroupList) {
  this._teamGroupList = teamGroupList;
  return this;
};

/**
 * Provides the teamGroupList of this CustomerData.
 * @return {tutao.entity.sys.CreateGroupListData} The teamGroupList of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getTeamGroupList = function() {
  return this._teamGroupList;
};

/**
 * Sets the userGroupList of this CustomerData.
 * @param {tutao.entity.sys.CreateGroupListData} userGroupList The userGroupList of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.setUserGroupList = function(userGroupList) {
  this._userGroupList = userGroupList;
  return this;
};

/**
 * Provides the userGroupList of this CustomerData.
 * @return {tutao.entity.sys.CreateGroupListData} The userGroupList of this CustomerData.
 */
tutao.entity.sys.CustomerData.prototype.getUserGroupList = function() {
  return this._userGroupList;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.CustomerReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.CustomerData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "22";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.CustomerData.PATH, this, parameters, headers, tutao.entity.sys.CustomerReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CustomerData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
