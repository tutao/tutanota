"use strict";

tutao.provide('tutao.entity.sys.RegistrationData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationData = function(data) {
  if (data) {
    this.__format = data._format;
    this.__id = data._id;
    this.__permissions = data._permissions;
    this._accountType = data.accountType;
    this._captchaResult = data.captchaResult;
    this._code = data.code;
    this._company = data.company;
    this._creationDate = data.creationDate;
    this._domain = data.domain;
    this._domainVerificationMailSentOn = data.domainVerificationMailSentOn;
    this._groupName = data.groupName;
    this._language = data.language;
    this._mailAddress = data.mailAddress;
    this._mobilePhoneNumber = data.mobilePhoneNumber;
    this._state = data.state;
    this._verifyCount = data.verifyCount;
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._accountType = null;
    this._captchaResult = null;
    this._code = null;
    this._company = null;
    this._creationDate = null;
    this._domain = null;
    this._domainVerificationMailSentOn = null;
    this._groupName = null;
    this._language = null;
    this._mailAddress = null;
    this._mobilePhoneNumber = null;
    this._state = null;
    this._verifyCount = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.RegistrationData.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.RegistrationData.MODEL_VERSION = '7';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.RegistrationData.PATH = '/rest/sys/registrationdata';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.RegistrationData.ROOT_INSTANCE_ID = 'A3N5cwAAoQ';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.RegistrationData.GENERATED_ID = false;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.RegistrationData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.RegistrationData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    accountType: this._accountType, 
    captchaResult: this._captchaResult, 
    code: this._code, 
    company: this._company, 
    creationDate: this._creationDate, 
    domain: this._domain, 
    domainVerificationMailSentOn: this._domainVerificationMailSentOn, 
    groupName: this._groupName, 
    language: this._language, 
    mailAddress: this._mailAddress, 
    mobilePhoneNumber: this._mobilePhoneNumber, 
    state: this._state, 
    verifyCount: this._verifyCount
  };
};

/**
 * The id of the RegistrationData type.
 */
tutao.entity.sys.RegistrationData.prototype.TYPE_ID = 161;

/**
 * The id of the accountType attribute.
 */
tutao.entity.sys.RegistrationData.prototype.ACCOUNTTYPE_ATTRIBUTE_ID = 166;

/**
 * The id of the captchaResult attribute.
 */
tutao.entity.sys.RegistrationData.prototype.CAPTCHARESULT_ATTRIBUTE_ID = 672;

/**
 * The id of the code attribute.
 */
tutao.entity.sys.RegistrationData.prototype.CODE_ATTRIBUTE_ID = 176;

/**
 * The id of the company attribute.
 */
tutao.entity.sys.RegistrationData.prototype.COMPANY_ATTRIBUTE_ID = 169;

/**
 * The id of the creationDate attribute.
 */
tutao.entity.sys.RegistrationData.prototype.CREATIONDATE_ATTRIBUTE_ID = 673;

/**
 * The id of the domain attribute.
 */
tutao.entity.sys.RegistrationData.prototype.DOMAIN_ATTRIBUTE_ID = 170;

/**
 * The id of the domainVerificationMailSentOn attribute.
 */
tutao.entity.sys.RegistrationData.prototype.DOMAINVERIFICATIONMAILSENTON_ATTRIBUTE_ID = 168;

/**
 * The id of the groupName attribute.
 */
tutao.entity.sys.RegistrationData.prototype.GROUPNAME_ATTRIBUTE_ID = 171;

/**
 * The id of the language attribute.
 */
tutao.entity.sys.RegistrationData.prototype.LANGUAGE_ATTRIBUTE_ID = 167;

/**
 * The id of the mailAddress attribute.
 */
tutao.entity.sys.RegistrationData.prototype.MAILADDRESS_ATTRIBUTE_ID = 173;

/**
 * The id of the mobilePhoneNumber attribute.
 */
tutao.entity.sys.RegistrationData.prototype.MOBILEPHONENUMBER_ATTRIBUTE_ID = 172;

/**
 * The id of the state attribute.
 */
tutao.entity.sys.RegistrationData.prototype.STATE_ATTRIBUTE_ID = 174;

/**
 * The id of the verifyCount attribute.
 */
tutao.entity.sys.RegistrationData.prototype.VERIFYCOUNT_ATTRIBUTE_ID = 175;

/**
 * Sets the custom id of this RegistrationData.
 * @param {Array.<string>} id The custom id of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setId = function(id) {
  this.__id = id;
};

/**
 * Provides the id of this RegistrationData.
 * @return {Array.<string>} The id of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this RegistrationData.
 * @param {string} format The format of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this RegistrationData.
 * @return {string} The format of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this RegistrationData.
 * @param {string} permissions The permissions of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this RegistrationData.
 * @return {string} The permissions of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the accountType of this RegistrationData.
 * @param {string} accountType The accountType of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setAccountType = function(accountType) {
  this._accountType = accountType;
  return this;
};

/**
 * Provides the accountType of this RegistrationData.
 * @return {string} The accountType of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getAccountType = function() {
  return this._accountType;
};

/**
 * Sets the captchaResult of this RegistrationData.
 * @param {string} captchaResult The captchaResult of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setCaptchaResult = function(captchaResult) {
  this._captchaResult = captchaResult;
  return this;
};

/**
 * Provides the captchaResult of this RegistrationData.
 * @return {string} The captchaResult of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getCaptchaResult = function() {
  return this._captchaResult;
};

/**
 * Sets the code of this RegistrationData.
 * @param {string} code The code of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setCode = function(code) {
  this._code = code;
  return this;
};

/**
 * Provides the code of this RegistrationData.
 * @return {string} The code of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getCode = function() {
  return this._code;
};

/**
 * Sets the company of this RegistrationData.
 * @param {string} company The company of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setCompany = function(company) {
  this._company = company;
  return this;
};

/**
 * Provides the company of this RegistrationData.
 * @return {string} The company of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getCompany = function() {
  return this._company;
};

/**
 * Sets the creationDate of this RegistrationData.
 * @param {Date} creationDate The creationDate of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setCreationDate = function(creationDate) {
  if (creationDate == null) {
    this._creationDate = null;
  } else {
    this._creationDate = String(creationDate.getTime());
  }
  return this;
};

/**
 * Provides the creationDate of this RegistrationData.
 * @return {Date} The creationDate of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getCreationDate = function() {
  if (this._creationDate == null) {
    return null;
  }
  if (isNaN(this._creationDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._creationDate);
  }
  return new Date(Number(this._creationDate));
};

/**
 * Sets the domain of this RegistrationData.
 * @param {string} domain The domain of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setDomain = function(domain) {
  this._domain = domain;
  return this;
};

/**
 * Provides the domain of this RegistrationData.
 * @return {string} The domain of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getDomain = function() {
  return this._domain;
};

/**
 * Sets the domainVerificationMailSentOn of this RegistrationData.
 * @param {Date} domainVerificationMailSentOn The domainVerificationMailSentOn of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setDomainVerificationMailSentOn = function(domainVerificationMailSentOn) {
  if (domainVerificationMailSentOn == null) {
    this._domainVerificationMailSentOn = null;
  } else {
    this._domainVerificationMailSentOn = String(domainVerificationMailSentOn.getTime());
  }
  return this;
};

/**
 * Provides the domainVerificationMailSentOn of this RegistrationData.
 * @return {Date} The domainVerificationMailSentOn of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getDomainVerificationMailSentOn = function() {
  if (this._domainVerificationMailSentOn == null) {
    return null;
  }
  if (isNaN(this._domainVerificationMailSentOn)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._domainVerificationMailSentOn);
  }
  return new Date(Number(this._domainVerificationMailSentOn));
};

/**
 * Sets the groupName of this RegistrationData.
 * @param {string} groupName The groupName of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setGroupName = function(groupName) {
  this._groupName = groupName;
  return this;
};

/**
 * Provides the groupName of this RegistrationData.
 * @return {string} The groupName of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getGroupName = function() {
  return this._groupName;
};

/**
 * Sets the language of this RegistrationData.
 * @param {string} language The language of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setLanguage = function(language) {
  this._language = language;
  return this;
};

/**
 * Provides the language of this RegistrationData.
 * @return {string} The language of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getLanguage = function() {
  return this._language;
};

/**
 * Sets the mailAddress of this RegistrationData.
 * @param {string} mailAddress The mailAddress of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this RegistrationData.
 * @return {string} The mailAddress of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the mobilePhoneNumber of this RegistrationData.
 * @param {string} mobilePhoneNumber The mobilePhoneNumber of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setMobilePhoneNumber = function(mobilePhoneNumber) {
  this._mobilePhoneNumber = mobilePhoneNumber;
  return this;
};

/**
 * Provides the mobilePhoneNumber of this RegistrationData.
 * @return {string} The mobilePhoneNumber of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getMobilePhoneNumber = function() {
  return this._mobilePhoneNumber;
};

/**
 * Sets the state of this RegistrationData.
 * @param {string} state The state of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setState = function(state) {
  this._state = state;
  return this;
};

/**
 * Provides the state of this RegistrationData.
 * @return {string} The state of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getState = function() {
  return this._state;
};

/**
 * Sets the verifyCount of this RegistrationData.
 * @param {string} verifyCount The verifyCount of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.setVerifyCount = function(verifyCount) {
  this._verifyCount = verifyCount;
  return this;
};

/**
 * Provides the verifyCount of this RegistrationData.
 * @return {string} The verifyCount of this RegistrationData.
 */
tutao.entity.sys.RegistrationData.prototype.getVerifyCount = function() {
  return this._verifyCount;
};

/**
 * Loads a RegistrationData from the server.
 * @param {Array.<string>} id The id of the RegistrationData.
 * @return {Promise.<tutao.entity.sys.RegistrationData>} Resolves to the RegistrationData or an exception if the loading failed.
 */
tutao.entity.sys.RegistrationData.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.RegistrationData, tutao.entity.sys.RegistrationData.PATH, id[1], id[0], {"v" : 7}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple RegistrationDatas from the server.
 * @param {Array.<Array.<string>>} ids The ids of the RegistrationDatas to load.
 * @return {Promise.<Array.<tutao.entity.sys.RegistrationData>>} Resolves to an array of RegistrationData or rejects with an exception if the loading failed.
 */
tutao.entity.sys.RegistrationData.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.RegistrationData, tutao.entity.sys.RegistrationData.PATH, ids, {"v": 7}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.RegistrationData.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 7;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.RegistrationData.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Deletes this RegistrationData on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.sys.RegistrationData.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.sys.RegistrationData.PATH, this.__id[1], this.__id[0], {"v": 7}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Provides a  list of RegistrationDatas loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.RegistrationData>>} Resolves to an array of RegistrationData or rejects with an exception if the loading failed.
 */
tutao.entity.sys.RegistrationData.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.RegistrationData, tutao.entity.sys.RegistrationData.PATH, listId, start, count, reverse, {"v": 7}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.RegistrationData.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.RegistrationData.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
