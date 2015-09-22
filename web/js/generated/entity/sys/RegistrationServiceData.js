"use strict";

tutao.provide('tutao.entity.sys.RegistrationServiceData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationServiceData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._accountType = null;
    this._company = null;
    this._domain = null;
    this._groupName = null;
    this._language = null;
    this._mailAddress = null;
    this._mobilePhoneNumber = null;
    this._source = null;
    this._specialPriceUserSingle = null;
    this._specialPriceUserTotal = null;
    this._state = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.RegistrationServiceData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationServiceData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._accountType = data.accountType;
  this._company = data.company;
  this._domain = data.domain;
  this._groupName = data.groupName;
  this._language = data.language;
  this._mailAddress = data.mailAddress;
  this._mobilePhoneNumber = data.mobilePhoneNumber;
  this._source = data.source;
  this._specialPriceUserSingle = data.specialPriceUserSingle;
  this._specialPriceUserTotal = data.specialPriceUserTotal;
  this._state = data.state;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.RegistrationServiceData.MODEL_VERSION = '10';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.RegistrationServiceData.PATH = '/rest/sys/registrationservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.RegistrationServiceData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.RegistrationServiceData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    accountType: this._accountType, 
    company: this._company, 
    domain: this._domain, 
    groupName: this._groupName, 
    language: this._language, 
    mailAddress: this._mailAddress, 
    mobilePhoneNumber: this._mobilePhoneNumber, 
    source: this._source, 
    specialPriceUserSingle: this._specialPriceUserSingle, 
    specialPriceUserTotal: this._specialPriceUserTotal, 
    state: this._state
  };
};

/**
 * The id of the RegistrationServiceData type.
 */
tutao.entity.sys.RegistrationServiceData.prototype.TYPE_ID = 316;

/**
 * The id of the accountType attribute.
 */
tutao.entity.sys.RegistrationServiceData.prototype.ACCOUNTTYPE_ATTRIBUTE_ID = 318;

/**
 * The id of the company attribute.
 */
tutao.entity.sys.RegistrationServiceData.prototype.COMPANY_ATTRIBUTE_ID = 321;

/**
 * The id of the domain attribute.
 */
tutao.entity.sys.RegistrationServiceData.prototype.DOMAIN_ATTRIBUTE_ID = 322;

/**
 * The id of the groupName attribute.
 */
tutao.entity.sys.RegistrationServiceData.prototype.GROUPNAME_ATTRIBUTE_ID = 320;

/**
 * The id of the language attribute.
 */
tutao.entity.sys.RegistrationServiceData.prototype.LANGUAGE_ATTRIBUTE_ID = 319;

/**
 * The id of the mailAddress attribute.
 */
tutao.entity.sys.RegistrationServiceData.prototype.MAILADDRESS_ATTRIBUTE_ID = 324;

/**
 * The id of the mobilePhoneNumber attribute.
 */
tutao.entity.sys.RegistrationServiceData.prototype.MOBILEPHONENUMBER_ATTRIBUTE_ID = 323;

/**
 * The id of the source attribute.
 */
tutao.entity.sys.RegistrationServiceData.prototype.SOURCE_ATTRIBUTE_ID = 874;

/**
 * The id of the specialPriceUserSingle attribute.
 */
tutao.entity.sys.RegistrationServiceData.prototype.SPECIALPRICEUSERSINGLE_ATTRIBUTE_ID = 875;

/**
 * The id of the specialPriceUserTotal attribute.
 */
tutao.entity.sys.RegistrationServiceData.prototype.SPECIALPRICEUSERTOTAL_ATTRIBUTE_ID = 876;

/**
 * The id of the state attribute.
 */
tutao.entity.sys.RegistrationServiceData.prototype.STATE_ATTRIBUTE_ID = 325;

/**
 * Sets the format of this RegistrationServiceData.
 * @param {string} format The format of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this RegistrationServiceData.
 * @return {string} The format of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the accountType of this RegistrationServiceData.
 * @param {string} accountType The accountType of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setAccountType = function(accountType) {
  this._accountType = accountType;
  return this;
};

/**
 * Provides the accountType of this RegistrationServiceData.
 * @return {string} The accountType of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getAccountType = function() {
  return this._accountType;
};

/**
 * Sets the company of this RegistrationServiceData.
 * @param {string} company The company of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setCompany = function(company) {
  this._company = company;
  return this;
};

/**
 * Provides the company of this RegistrationServiceData.
 * @return {string} The company of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getCompany = function() {
  return this._company;
};

/**
 * Sets the domain of this RegistrationServiceData.
 * @param {string} domain The domain of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setDomain = function(domain) {
  this._domain = domain;
  return this;
};

/**
 * Provides the domain of this RegistrationServiceData.
 * @return {string} The domain of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getDomain = function() {
  return this._domain;
};

/**
 * Sets the groupName of this RegistrationServiceData.
 * @param {string} groupName The groupName of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setGroupName = function(groupName) {
  this._groupName = groupName;
  return this;
};

/**
 * Provides the groupName of this RegistrationServiceData.
 * @return {string} The groupName of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getGroupName = function() {
  return this._groupName;
};

/**
 * Sets the language of this RegistrationServiceData.
 * @param {string} language The language of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setLanguage = function(language) {
  this._language = language;
  return this;
};

/**
 * Provides the language of this RegistrationServiceData.
 * @return {string} The language of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getLanguage = function() {
  return this._language;
};

/**
 * Sets the mailAddress of this RegistrationServiceData.
 * @param {string} mailAddress The mailAddress of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this RegistrationServiceData.
 * @return {string} The mailAddress of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the mobilePhoneNumber of this RegistrationServiceData.
 * @param {string} mobilePhoneNumber The mobilePhoneNumber of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setMobilePhoneNumber = function(mobilePhoneNumber) {
  this._mobilePhoneNumber = mobilePhoneNumber;
  return this;
};

/**
 * Provides the mobilePhoneNumber of this RegistrationServiceData.
 * @return {string} The mobilePhoneNumber of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getMobilePhoneNumber = function() {
  return this._mobilePhoneNumber;
};

/**
 * Sets the source of this RegistrationServiceData.
 * @param {string} source The source of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setSource = function(source) {
  this._source = source;
  return this;
};

/**
 * Provides the source of this RegistrationServiceData.
 * @return {string} The source of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getSource = function() {
  return this._source;
};

/**
 * Sets the specialPriceUserSingle of this RegistrationServiceData.
 * @param {string} specialPriceUserSingle The specialPriceUserSingle of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setSpecialPriceUserSingle = function(specialPriceUserSingle) {
  this._specialPriceUserSingle = specialPriceUserSingle;
  return this;
};

/**
 * Provides the specialPriceUserSingle of this RegistrationServiceData.
 * @return {string} The specialPriceUserSingle of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getSpecialPriceUserSingle = function() {
  return this._specialPriceUserSingle;
};

/**
 * Sets the specialPriceUserTotal of this RegistrationServiceData.
 * @param {string} specialPriceUserTotal The specialPriceUserTotal of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setSpecialPriceUserTotal = function(specialPriceUserTotal) {
  this._specialPriceUserTotal = specialPriceUserTotal;
  return this;
};

/**
 * Provides the specialPriceUserTotal of this RegistrationServiceData.
 * @return {string} The specialPriceUserTotal of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getSpecialPriceUserTotal = function() {
  return this._specialPriceUserTotal;
};

/**
 * Sets the state of this RegistrationServiceData.
 * @param {string} state The state of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setState = function(state) {
  this._state = state;
  return this;
};

/**
 * Provides the state of this RegistrationServiceData.
 * @return {string} The state of this RegistrationServiceData.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getState = function() {
  return this._state;
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.RegistrationServiceData>} Resolves to RegistrationServiceData or an exception if the loading failed.
 */
tutao.entity.sys.RegistrationServiceData.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 10;
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.RegistrationServiceData, tutao.entity.sys.RegistrationServiceData.PATH, null, null, parameters, headers);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.RegistrationReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.RegistrationServiceData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 10;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.RegistrationServiceData.PATH, this, parameters, headers, tutao.entity.sys.RegistrationReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.RegistrationServiceData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
