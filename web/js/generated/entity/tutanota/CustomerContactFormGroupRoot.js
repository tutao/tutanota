"use strict";

tutao.provide('tutao.entity.tutanota.CustomerContactFormGroupRoot');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._contactForms = null;
    this._statisticsLog = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._contactForms = data.contactForms;
  this._statisticsLog = data.statisticsLog;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.PATH = '/rest/tutanota/customercontactformgrouproot';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAAMP';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    contactForms: this._contactForms, 
    statisticsLog: this._statisticsLog
  };
};

/**
 * Provides the id of this CustomerContactFormGroupRoot.
 * @return {string} The id of this CustomerContactFormGroupRoot.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this CustomerContactFormGroupRoot.
 * @param {string} format The format of this CustomerContactFormGroupRoot.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CustomerContactFormGroupRoot.
 * @return {string} The format of this CustomerContactFormGroupRoot.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this CustomerContactFormGroupRoot.
 * @param {string} ownerGroup The ownerGroup of this CustomerContactFormGroupRoot.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this CustomerContactFormGroupRoot.
 * @return {string} The ownerGroup of this CustomerContactFormGroupRoot.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this CustomerContactFormGroupRoot.
 * @param {string} permissions The permissions of this CustomerContactFormGroupRoot.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this CustomerContactFormGroupRoot.
 * @return {string} The permissions of this CustomerContactFormGroupRoot.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the contactForms of this CustomerContactFormGroupRoot.
 * @param {string} contactForms The contactForms of this CustomerContactFormGroupRoot.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.setContactForms = function(contactForms) {
  this._contactForms = contactForms;
  return this;
};

/**
 * Provides the contactForms of this CustomerContactFormGroupRoot.
 * @return {string} The contactForms of this CustomerContactFormGroupRoot.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.getContactForms = function() {
  return this._contactForms;
};

/**
 * Sets the statisticsLog of this CustomerContactFormGroupRoot.
 * @param {string} statisticsLog The statisticsLog of this CustomerContactFormGroupRoot.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.setStatisticsLog = function(statisticsLog) {
  this._statisticsLog = statisticsLog;
  return this;
};

/**
 * Provides the statisticsLog of this CustomerContactFormGroupRoot.
 * @return {string} The statisticsLog of this CustomerContactFormGroupRoot.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.getStatisticsLog = function() {
  return this._statisticsLog;
};

/**
 * Loads a CustomerContactFormGroupRoot from the server.
 * @param {string} id The id of the CustomerContactFormGroupRoot.
 * @return {Promise.<tutao.entity.tutanota.CustomerContactFormGroupRoot>} Resolves to the CustomerContactFormGroupRoot or an exception if the loading failed.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.CustomerContactFormGroupRoot, tutao.entity.tutanota.CustomerContactFormGroupRoot.PATH, id, null, {"v" : "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple CustomerContactFormGroupRoots from the server.
 * @param {Array.<string>} ids The ids of the CustomerContactFormGroupRoots to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.CustomerContactFormGroupRoot>>} Resolves to an array of CustomerContactFormGroupRoot or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.CustomerContactFormGroupRoot, tutao.entity.tutanota.CustomerContactFormGroupRoot.PATH, ids, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this CustomerContactFormGroupRoot on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.CustomerContactFormGroupRoot.PATH, this, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.CustomerContactFormGroupRoot.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
