"use strict";

tutao.provide('tutao.entity.sys.CustomerServerProperties');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerServerProperties = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._requirePasswordUpdateAfterReset = null;
    this._emailSenderList = [];
    this._whitelistedDomains = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CustomerServerProperties.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerServerProperties.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._requirePasswordUpdateAfterReset = data.requirePasswordUpdateAfterReset;
  this._emailSenderList = [];
  for (var i=0; i < data.emailSenderList.length; i++) {
    this._emailSenderList.push(new tutao.entity.sys.EmailSenderListElement(this, data.emailSenderList[i]));
  }
  this._whitelistedDomains = (data.whitelistedDomains) ? new tutao.entity.sys.DomainsRef(this, data.whitelistedDomains) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CustomerServerProperties.MODEL_VERSION = '23';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.CustomerServerProperties.PATH = '/rest/sys/customerserverproperties';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.CustomerServerProperties.ROOT_INSTANCE_ID = 'A3N5cwADug';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.CustomerServerProperties.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CustomerServerProperties.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CustomerServerProperties.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    requirePasswordUpdateAfterReset: this._requirePasswordUpdateAfterReset, 
    emailSenderList: tutao.entity.EntityHelper.aggregatesToJsonData(this._emailSenderList), 
    whitelistedDomains: tutao.entity.EntityHelper.aggregatesToJsonData(this._whitelistedDomains)
  };
};

/**
 * Provides the id of this CustomerServerProperties.
 * @return {string} The id of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this CustomerServerProperties.
 * @param {string} format The format of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CustomerServerProperties.
 * @return {string} The format of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this CustomerServerProperties.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this CustomerServerProperties.
 * @return {string} The ownerEncSessionKey of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this CustomerServerProperties.
 * @param {string} ownerGroup The ownerGroup of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this CustomerServerProperties.
 * @return {string} The ownerGroup of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this CustomerServerProperties.
 * @param {string} permissions The permissions of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this CustomerServerProperties.
 * @return {string} The permissions of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the requirePasswordUpdateAfterReset of this CustomerServerProperties.
 * @param {boolean} requirePasswordUpdateAfterReset The requirePasswordUpdateAfterReset of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.setRequirePasswordUpdateAfterReset = function(requirePasswordUpdateAfterReset) {
  this._requirePasswordUpdateAfterReset = requirePasswordUpdateAfterReset ? '1' : '0';
  return this;
};

/**
 * Provides the requirePasswordUpdateAfterReset of this CustomerServerProperties.
 * @return {boolean} The requirePasswordUpdateAfterReset of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.getRequirePasswordUpdateAfterReset = function() {
  return this._requirePasswordUpdateAfterReset != '0';
};

/**
 * Provides the emailSenderList of this CustomerServerProperties.
 * @return {Array.<tutao.entity.sys.EmailSenderListElement>} The emailSenderList of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.getEmailSenderList = function() {
  return this._emailSenderList;
};

/**
 * Sets the whitelistedDomains of this CustomerServerProperties.
 * @param {tutao.entity.sys.DomainsRef} whitelistedDomains The whitelistedDomains of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.setWhitelistedDomains = function(whitelistedDomains) {
  this._whitelistedDomains = whitelistedDomains;
  return this;
};

/**
 * Provides the whitelistedDomains of this CustomerServerProperties.
 * @return {tutao.entity.sys.DomainsRef} The whitelistedDomains of this CustomerServerProperties.
 */
tutao.entity.sys.CustomerServerProperties.prototype.getWhitelistedDomains = function() {
  return this._whitelistedDomains;
};

/**
 * Loads a CustomerServerProperties from the server.
 * @param {string} id The id of the CustomerServerProperties.
 * @return {Promise.<tutao.entity.sys.CustomerServerProperties>} Resolves to the CustomerServerProperties or an exception if the loading failed.
 */
tutao.entity.sys.CustomerServerProperties.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.CustomerServerProperties, tutao.entity.sys.CustomerServerProperties.PATH, id, null, {"v" : "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple CustomerServerPropertiess from the server.
 * @param {Array.<string>} ids The ids of the CustomerServerPropertiess to load.
 * @return {Promise.<Array.<tutao.entity.sys.CustomerServerProperties>>} Resolves to an array of CustomerServerProperties or rejects with an exception if the loading failed.
 */
tutao.entity.sys.CustomerServerProperties.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.CustomerServerProperties, tutao.entity.sys.CustomerServerProperties.PATH, ids, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.CustomerServerProperties.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "23";
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.CustomerServerProperties.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this CustomerServerProperties on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.CustomerServerProperties.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.CustomerServerProperties.PATH, this, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.CustomerServerProperties.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.CustomerServerProperties.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CustomerServerProperties.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
