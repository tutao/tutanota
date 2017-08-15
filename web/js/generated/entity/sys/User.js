"use strict";

tutao.provide('tutao.entity.sys.User');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.User = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._accountType = null;
    this._enabled = null;
    this._requirePasswordUpdate = null;
    this._salt = null;
    this._userEncClientKey = null;
    this._verifier = null;
    this._auth = null;
    this._authenticatedDevices = [];
    this._customer = null;
    this._externalAuthInfo = null;
    this._failedLogins = null;
    this._memberships = [];
    this._phoneNumbers = [];
    this._pushIdentifierList = null;
    this._secondFactorAuthentications = null;
    this._successfulLogins = null;
    this._userGroup = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.User.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.User.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._accountType = data.accountType;
  this._enabled = data.enabled;
  this._requirePasswordUpdate = data.requirePasswordUpdate;
  this._salt = data.salt;
  this._userEncClientKey = data.userEncClientKey;
  this._verifier = data.verifier;
  this._auth = (data.auth) ? new tutao.entity.sys.UserAuthentication(this, data.auth) : null;
  this._authenticatedDevices = [];
  for (var i=0; i < data.authenticatedDevices.length; i++) {
    this._authenticatedDevices.push(new tutao.entity.sys.AuthenticatedDevice(this, data.authenticatedDevices[i]));
  }
  this._customer = data.customer;
  this._externalAuthInfo = (data.externalAuthInfo) ? new tutao.entity.sys.UserExternalAuthInfo(this, data.externalAuthInfo) : null;
  this._failedLogins = data.failedLogins;
  this._memberships = [];
  for (var i=0; i < data.memberships.length; i++) {
    this._memberships.push(new tutao.entity.sys.GroupMembership(this, data.memberships[i]));
  }
  this._phoneNumbers = [];
  for (var i=0; i < data.phoneNumbers.length; i++) {
    this._phoneNumbers.push(new tutao.entity.sys.PhoneNumber(this, data.phoneNumbers[i]));
  }
  this._pushIdentifierList = (data.pushIdentifierList) ? new tutao.entity.sys.PushIdentifierList(this, data.pushIdentifierList) : null;
  this._secondFactorAuthentications = data.secondFactorAuthentications;
  this._successfulLogins = data.successfulLogins;
  this._userGroup = (data.userGroup) ? new tutao.entity.sys.GroupMembership(this, data.userGroup) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.User.MODEL_VERSION = '23';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.User.PATH = '/rest/sys/user';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.User.ROOT_INSTANCE_ID = 'A3N5cwBU';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.User.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.User.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.User.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    accountType: this._accountType, 
    enabled: this._enabled, 
    requirePasswordUpdate: this._requirePasswordUpdate, 
    salt: this._salt, 
    userEncClientKey: this._userEncClientKey, 
    verifier: this._verifier, 
    auth: tutao.entity.EntityHelper.aggregatesToJsonData(this._auth), 
    authenticatedDevices: tutao.entity.EntityHelper.aggregatesToJsonData(this._authenticatedDevices), 
    customer: this._customer, 
    externalAuthInfo: tutao.entity.EntityHelper.aggregatesToJsonData(this._externalAuthInfo), 
    failedLogins: this._failedLogins, 
    memberships: tutao.entity.EntityHelper.aggregatesToJsonData(this._memberships), 
    phoneNumbers: tutao.entity.EntityHelper.aggregatesToJsonData(this._phoneNumbers), 
    pushIdentifierList: tutao.entity.EntityHelper.aggregatesToJsonData(this._pushIdentifierList), 
    secondFactorAuthentications: this._secondFactorAuthentications, 
    successfulLogins: this._successfulLogins, 
    userGroup: tutao.entity.EntityHelper.aggregatesToJsonData(this._userGroup)
  };
};

/**
 * Provides the id of this User.
 * @return {string} The id of this User.
 */
tutao.entity.sys.User.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this User.
 * @param {string} format The format of this User.
 */
tutao.entity.sys.User.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this User.
 * @return {string} The format of this User.
 */
tutao.entity.sys.User.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this User.
 * @param {string} ownerGroup The ownerGroup of this User.
 */
tutao.entity.sys.User.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this User.
 * @return {string} The ownerGroup of this User.
 */
tutao.entity.sys.User.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this User.
 * @param {string} permissions The permissions of this User.
 */
tutao.entity.sys.User.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this User.
 * @return {string} The permissions of this User.
 */
tutao.entity.sys.User.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the accountType of this User.
 * @param {string} accountType The accountType of this User.
 */
tutao.entity.sys.User.prototype.setAccountType = function(accountType) {
  this._accountType = accountType;
  return this;
};

/**
 * Provides the accountType of this User.
 * @return {string} The accountType of this User.
 */
tutao.entity.sys.User.prototype.getAccountType = function() {
  return this._accountType;
};

/**
 * Sets the enabled of this User.
 * @param {boolean} enabled The enabled of this User.
 */
tutao.entity.sys.User.prototype.setEnabled = function(enabled) {
  this._enabled = enabled ? '1' : '0';
  return this;
};

/**
 * Provides the enabled of this User.
 * @return {boolean} The enabled of this User.
 */
tutao.entity.sys.User.prototype.getEnabled = function() {
  return this._enabled != '0';
};

/**
 * Sets the requirePasswordUpdate of this User.
 * @param {boolean} requirePasswordUpdate The requirePasswordUpdate of this User.
 */
tutao.entity.sys.User.prototype.setRequirePasswordUpdate = function(requirePasswordUpdate) {
  this._requirePasswordUpdate = requirePasswordUpdate ? '1' : '0';
  return this;
};

/**
 * Provides the requirePasswordUpdate of this User.
 * @return {boolean} The requirePasswordUpdate of this User.
 */
tutao.entity.sys.User.prototype.getRequirePasswordUpdate = function() {
  return this._requirePasswordUpdate != '0';
};

/**
 * Sets the salt of this User.
 * @param {string} salt The salt of this User.
 */
tutao.entity.sys.User.prototype.setSalt = function(salt) {
  this._salt = salt;
  return this;
};

/**
 * Provides the salt of this User.
 * @return {string} The salt of this User.
 */
tutao.entity.sys.User.prototype.getSalt = function() {
  return this._salt;
};

/**
 * Sets the userEncClientKey of this User.
 * @param {string} userEncClientKey The userEncClientKey of this User.
 */
tutao.entity.sys.User.prototype.setUserEncClientKey = function(userEncClientKey) {
  this._userEncClientKey = userEncClientKey;
  return this;
};

/**
 * Provides the userEncClientKey of this User.
 * @return {string} The userEncClientKey of this User.
 */
tutao.entity.sys.User.prototype.getUserEncClientKey = function() {
  return this._userEncClientKey;
};

/**
 * Sets the verifier of this User.
 * @param {string} verifier The verifier of this User.
 */
tutao.entity.sys.User.prototype.setVerifier = function(verifier) {
  this._verifier = verifier;
  return this;
};

/**
 * Provides the verifier of this User.
 * @return {string} The verifier of this User.
 */
tutao.entity.sys.User.prototype.getVerifier = function() {
  return this._verifier;
};

/**
 * Sets the auth of this User.
 * @param {tutao.entity.sys.UserAuthentication} auth The auth of this User.
 */
tutao.entity.sys.User.prototype.setAuth = function(auth) {
  this._auth = auth;
  return this;
};

/**
 * Provides the auth of this User.
 * @return {tutao.entity.sys.UserAuthentication} The auth of this User.
 */
tutao.entity.sys.User.prototype.getAuth = function() {
  return this._auth;
};

/**
 * Provides the authenticatedDevices of this User.
 * @return {Array.<tutao.entity.sys.AuthenticatedDevice>} The authenticatedDevices of this User.
 */
tutao.entity.sys.User.prototype.getAuthenticatedDevices = function() {
  return this._authenticatedDevices;
};

/**
 * Sets the customer of this User.
 * @param {string} customer The customer of this User.
 */
tutao.entity.sys.User.prototype.setCustomer = function(customer) {
  this._customer = customer;
  return this;
};

/**
 * Provides the customer of this User.
 * @return {string} The customer of this User.
 */
tutao.entity.sys.User.prototype.getCustomer = function() {
  return this._customer;
};

/**
 * Loads the customer of this User.
 * @return {Promise.<tutao.entity.sys.Customer>} Resolves to the loaded customer of this User or an exception if the loading failed.
 */
tutao.entity.sys.User.prototype.loadCustomer = function() {
  return tutao.entity.sys.Customer.load(this._customer);
};

/**
 * Sets the externalAuthInfo of this User.
 * @param {tutao.entity.sys.UserExternalAuthInfo} externalAuthInfo The externalAuthInfo of this User.
 */
tutao.entity.sys.User.prototype.setExternalAuthInfo = function(externalAuthInfo) {
  this._externalAuthInfo = externalAuthInfo;
  return this;
};

/**
 * Provides the externalAuthInfo of this User.
 * @return {tutao.entity.sys.UserExternalAuthInfo} The externalAuthInfo of this User.
 */
tutao.entity.sys.User.prototype.getExternalAuthInfo = function() {
  return this._externalAuthInfo;
};

/**
 * Sets the failedLogins of this User.
 * @param {string} failedLogins The failedLogins of this User.
 */
tutao.entity.sys.User.prototype.setFailedLogins = function(failedLogins) {
  this._failedLogins = failedLogins;
  return this;
};

/**
 * Provides the failedLogins of this User.
 * @return {string} The failedLogins of this User.
 */
tutao.entity.sys.User.prototype.getFailedLogins = function() {
  return this._failedLogins;
};

/**
 * Provides the memberships of this User.
 * @return {Array.<tutao.entity.sys.GroupMembership>} The memberships of this User.
 */
tutao.entity.sys.User.prototype.getMemberships = function() {
  return this._memberships;
};

/**
 * Provides the phoneNumbers of this User.
 * @return {Array.<tutao.entity.sys.PhoneNumber>} The phoneNumbers of this User.
 */
tutao.entity.sys.User.prototype.getPhoneNumbers = function() {
  return this._phoneNumbers;
};

/**
 * Sets the pushIdentifierList of this User.
 * @param {tutao.entity.sys.PushIdentifierList} pushIdentifierList The pushIdentifierList of this User.
 */
tutao.entity.sys.User.prototype.setPushIdentifierList = function(pushIdentifierList) {
  this._pushIdentifierList = pushIdentifierList;
  return this;
};

/**
 * Provides the pushIdentifierList of this User.
 * @return {tutao.entity.sys.PushIdentifierList} The pushIdentifierList of this User.
 */
tutao.entity.sys.User.prototype.getPushIdentifierList = function() {
  return this._pushIdentifierList;
};

/**
 * Sets the secondFactorAuthentications of this User.
 * @param {string} secondFactorAuthentications The secondFactorAuthentications of this User.
 */
tutao.entity.sys.User.prototype.setSecondFactorAuthentications = function(secondFactorAuthentications) {
  this._secondFactorAuthentications = secondFactorAuthentications;
  return this;
};

/**
 * Provides the secondFactorAuthentications of this User.
 * @return {string} The secondFactorAuthentications of this User.
 */
tutao.entity.sys.User.prototype.getSecondFactorAuthentications = function() {
  return this._secondFactorAuthentications;
};

/**
 * Sets the successfulLogins of this User.
 * @param {string} successfulLogins The successfulLogins of this User.
 */
tutao.entity.sys.User.prototype.setSuccessfulLogins = function(successfulLogins) {
  this._successfulLogins = successfulLogins;
  return this;
};

/**
 * Provides the successfulLogins of this User.
 * @return {string} The successfulLogins of this User.
 */
tutao.entity.sys.User.prototype.getSuccessfulLogins = function() {
  return this._successfulLogins;
};

/**
 * Sets the userGroup of this User.
 * @param {tutao.entity.sys.GroupMembership} userGroup The userGroup of this User.
 */
tutao.entity.sys.User.prototype.setUserGroup = function(userGroup) {
  this._userGroup = userGroup;
  return this;
};

/**
 * Provides the userGroup of this User.
 * @return {tutao.entity.sys.GroupMembership} The userGroup of this User.
 */
tutao.entity.sys.User.prototype.getUserGroup = function() {
  return this._userGroup;
};

/**
 * Loads a User from the server.
 * @param {string} id The id of the User.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the User or an exception if the loading failed.
 */
tutao.entity.sys.User.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.User, tutao.entity.sys.User.PATH, id, null, {"v" : "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple Users from the server.
 * @param {Array.<string>} ids The ids of the Users to load.
 * @return {Promise.<Array.<tutao.entity.sys.User>>} Resolves to an array of User or rejects with an exception if the loading failed.
 */
tutao.entity.sys.User.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.User, tutao.entity.sys.User.PATH, ids, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this User on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.User.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.User.PATH, this, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.User.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.User.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.User.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
