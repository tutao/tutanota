"use strict";

tutao.provide('tutao.entity.tutanota.ContactList');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactList = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._contacts = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.ContactList.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactList.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._contacts = data.contacts;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.ContactList.MODEL_VERSION = '15';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.ContactList.PATH = '/rest/tutanota/contactlist';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.ContactList.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAACZ';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.ContactList.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.ContactList.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactList.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    contacts: this._contacts
  };
};

/**
 * Provides the id of this ContactList.
 * @return {string} The id of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this ContactList.
 * @param {string} format The format of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ContactList.
 * @return {string} The format of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this ContactList.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this ContactList.
 * @return {string} The ownerEncSessionKey of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this ContactList.
 * @param {string} ownerGroup The ownerGroup of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this ContactList.
 * @return {string} The ownerGroup of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this ContactList.
 * @param {string} permissions The permissions of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this ContactList.
 * @return {string} The permissions of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the contacts of this ContactList.
 * @param {string} contacts The contacts of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.setContacts = function(contacts) {
  this._contacts = contacts;
  return this;
};

/**
 * Provides the contacts of this ContactList.
 * @return {string} The contacts of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getContacts = function() {
  return this._contacts;
};

/**
 * Loads a ContactList from the server.
 * @param {string} id The id of the ContactList.
 * @return {Promise.<tutao.entity.tutanota.ContactList>} Resolves to the ContactList or an exception if the loading failed.
 */
tutao.entity.tutanota.ContactList.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.ContactList, tutao.entity.tutanota.ContactList.PATH, id, null, {"v" : "15"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple ContactLists from the server.
 * @param {Array.<string>} ids The ids of the ContactLists to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.ContactList>>} Resolves to an array of ContactList or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.ContactList.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.ContactList, tutao.entity.tutanota.ContactList.PATH, ids, {"v": "15"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.ContactList.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "15";
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.ContactList.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this ContactList on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.ContactList.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.ContactList.PATH, this, {"v": "15"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.ContactList.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.ContactList.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ContactList.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
