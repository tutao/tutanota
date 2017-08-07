"use strict";

tutao.provide('tutao.entity.tutanota.MailboxServerProperties');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailboxServerProperties = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._whitelistProtectionEnabled = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.MailboxServerProperties.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._whitelistProtectionEnabled = data.whitelistProtectionEnabled;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.MailboxServerProperties.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.MailboxServerProperties.PATH = '/rest/tutanota/mailboxserverproperties';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.MailboxServerProperties.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAAKl';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.MailboxServerProperties.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    whitelistProtectionEnabled: this._whitelistProtectionEnabled
  };
};

/**
 * Provides the id of this MailboxServerProperties.
 * @return {string} The id of this MailboxServerProperties.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this MailboxServerProperties.
 * @param {string} format The format of this MailboxServerProperties.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MailboxServerProperties.
 * @return {string} The format of this MailboxServerProperties.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this MailboxServerProperties.
 * @param {string} ownerGroup The ownerGroup of this MailboxServerProperties.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this MailboxServerProperties.
 * @return {string} The ownerGroup of this MailboxServerProperties.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this MailboxServerProperties.
 * @param {string} permissions The permissions of this MailboxServerProperties.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this MailboxServerProperties.
 * @return {string} The permissions of this MailboxServerProperties.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the whitelistProtectionEnabled of this MailboxServerProperties.
 * @param {boolean} whitelistProtectionEnabled The whitelistProtectionEnabled of this MailboxServerProperties.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.setWhitelistProtectionEnabled = function(whitelistProtectionEnabled) {
  this._whitelistProtectionEnabled = whitelistProtectionEnabled ? '1' : '0';
  return this;
};

/**
 * Provides the whitelistProtectionEnabled of this MailboxServerProperties.
 * @return {boolean} The whitelistProtectionEnabled of this MailboxServerProperties.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.getWhitelistProtectionEnabled = function() {
  return this._whitelistProtectionEnabled != '0';
};

/**
 * Loads a MailboxServerProperties from the server.
 * @param {string} id The id of the MailboxServerProperties.
 * @return {Promise.<tutao.entity.tutanota.MailboxServerProperties>} Resolves to the MailboxServerProperties or an exception if the loading failed.
 */
tutao.entity.tutanota.MailboxServerProperties.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailboxServerProperties, tutao.entity.tutanota.MailboxServerProperties.PATH, id, null, {"v" : "21"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple MailboxServerPropertiess from the server.
 * @param {Array.<string>} ids The ids of the MailboxServerPropertiess to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.MailboxServerProperties>>} Resolves to an array of MailboxServerProperties or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.MailboxServerProperties.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.MailboxServerProperties, tutao.entity.tutanota.MailboxServerProperties.PATH, ids, {"v": "21"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this MailboxServerProperties on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.MailboxServerProperties.PATH, this, {"v": "21"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MailboxServerProperties.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
