"use strict";

tutao.provide('tutao.entity.sys.CustomerProperties');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerProperties = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._externalUserWelcomeMessage = null;
    this._lastUpgradeReminder = null;
    this._bigLogo = null;
    this._smallLogo = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CustomerProperties.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerProperties.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._externalUserWelcomeMessage = data.externalUserWelcomeMessage;
  this._lastUpgradeReminder = data.lastUpgradeReminder;
  this._bigLogo = (data.bigLogo) ? new tutao.entity.sys.File(this, data.bigLogo) : null;
  this._smallLogo = (data.smallLogo) ? new tutao.entity.sys.File(this, data.smallLogo) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CustomerProperties.MODEL_VERSION = '19';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.CustomerProperties.PATH = '/rest/sys/customerproperties';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.CustomerProperties.ROOT_INSTANCE_ID = 'A3N5cwACkA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.CustomerProperties.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CustomerProperties.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CustomerProperties.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    externalUserWelcomeMessage: this._externalUserWelcomeMessage, 
    lastUpgradeReminder: this._lastUpgradeReminder, 
    bigLogo: tutao.entity.EntityHelper.aggregatesToJsonData(this._bigLogo), 
    smallLogo: tutao.entity.EntityHelper.aggregatesToJsonData(this._smallLogo)
  };
};

/**
 * Provides the id of this CustomerProperties.
 * @return {string} The id of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this CustomerProperties.
 * @param {string} format The format of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CustomerProperties.
 * @return {string} The format of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this CustomerProperties.
 * @param {string} ownerGroup The ownerGroup of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this CustomerProperties.
 * @return {string} The ownerGroup of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this CustomerProperties.
 * @param {string} permissions The permissions of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this CustomerProperties.
 * @return {string} The permissions of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the externalUserWelcomeMessage of this CustomerProperties.
 * @param {string} externalUserWelcomeMessage The externalUserWelcomeMessage of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.setExternalUserWelcomeMessage = function(externalUserWelcomeMessage) {
  this._externalUserWelcomeMessage = externalUserWelcomeMessage;
  return this;
};

/**
 * Provides the externalUserWelcomeMessage of this CustomerProperties.
 * @return {string} The externalUserWelcomeMessage of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getExternalUserWelcomeMessage = function() {
  return this._externalUserWelcomeMessage;
};

/**
 * Sets the lastUpgradeReminder of this CustomerProperties.
 * @param {Date} lastUpgradeReminder The lastUpgradeReminder of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.setLastUpgradeReminder = function(lastUpgradeReminder) {
  if (lastUpgradeReminder == null) {
    this._lastUpgradeReminder = null;
  } else {
    this._lastUpgradeReminder = String(lastUpgradeReminder.getTime());
  }
  return this;
};

/**
 * Provides the lastUpgradeReminder of this CustomerProperties.
 * @return {Date} The lastUpgradeReminder of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getLastUpgradeReminder = function() {
  if (this._lastUpgradeReminder == null) {
    return null;
  }
  if (isNaN(this._lastUpgradeReminder)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._lastUpgradeReminder);
  }
  return new Date(Number(this._lastUpgradeReminder));
};

/**
 * Sets the bigLogo of this CustomerProperties.
 * @param {tutao.entity.sys.File} bigLogo The bigLogo of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.setBigLogo = function(bigLogo) {
  this._bigLogo = bigLogo;
  return this;
};

/**
 * Provides the bigLogo of this CustomerProperties.
 * @return {tutao.entity.sys.File} The bigLogo of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getBigLogo = function() {
  return this._bigLogo;
};

/**
 * Sets the smallLogo of this CustomerProperties.
 * @param {tutao.entity.sys.File} smallLogo The smallLogo of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.setSmallLogo = function(smallLogo) {
  this._smallLogo = smallLogo;
  return this;
};

/**
 * Provides the smallLogo of this CustomerProperties.
 * @return {tutao.entity.sys.File} The smallLogo of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getSmallLogo = function() {
  return this._smallLogo;
};

/**
 * Loads a CustomerProperties from the server.
 * @param {string} id The id of the CustomerProperties.
 * @return {Promise.<tutao.entity.sys.CustomerProperties>} Resolves to the CustomerProperties or an exception if the loading failed.
 */
tutao.entity.sys.CustomerProperties.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.CustomerProperties, tutao.entity.sys.CustomerProperties.PATH, id, null, {"v" : "19"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple CustomerPropertiess from the server.
 * @param {Array.<string>} ids The ids of the CustomerPropertiess to load.
 * @return {Promise.<Array.<tutao.entity.sys.CustomerProperties>>} Resolves to an array of CustomerProperties or rejects with an exception if the loading failed.
 */
tutao.entity.sys.CustomerProperties.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.CustomerProperties, tutao.entity.sys.CustomerProperties.PATH, ids, {"v": "19"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this CustomerProperties on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.CustomerProperties.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.CustomerProperties.PATH, this, {"v": "19"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.CustomerProperties.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.CustomerProperties.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CustomerProperties.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
