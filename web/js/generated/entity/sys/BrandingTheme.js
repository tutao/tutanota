"use strict";

tutao.provide('tutao.entity.sys.BrandingTheme');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BrandingTheme = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._jsonTheme = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.BrandingTheme.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BrandingTheme.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._jsonTheme = data.jsonTheme;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.BrandingTheme.MODEL_VERSION = '22';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.BrandingTheme.PATH = '/rest/sys/brandingtheme';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.BrandingTheme.ROOT_INSTANCE_ID = 'A3N5cwAEZw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.BrandingTheme.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.BrandingTheme.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.BrandingTheme.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    jsonTheme: this._jsonTheme
  };
};

/**
 * Provides the id of this BrandingTheme.
 * @return {string} The id of this BrandingTheme.
 */
tutao.entity.sys.BrandingTheme.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this BrandingTheme.
 * @param {string} format The format of this BrandingTheme.
 */
tutao.entity.sys.BrandingTheme.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this BrandingTheme.
 * @return {string} The format of this BrandingTheme.
 */
tutao.entity.sys.BrandingTheme.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this BrandingTheme.
 * @param {string} ownerGroup The ownerGroup of this BrandingTheme.
 */
tutao.entity.sys.BrandingTheme.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this BrandingTheme.
 * @return {string} The ownerGroup of this BrandingTheme.
 */
tutao.entity.sys.BrandingTheme.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this BrandingTheme.
 * @param {string} permissions The permissions of this BrandingTheme.
 */
tutao.entity.sys.BrandingTheme.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this BrandingTheme.
 * @return {string} The permissions of this BrandingTheme.
 */
tutao.entity.sys.BrandingTheme.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the jsonTheme of this BrandingTheme.
 * @param {string} jsonTheme The jsonTheme of this BrandingTheme.
 */
tutao.entity.sys.BrandingTheme.prototype.setJsonTheme = function(jsonTheme) {
  this._jsonTheme = jsonTheme;
  return this;
};

/**
 * Provides the jsonTheme of this BrandingTheme.
 * @return {string} The jsonTheme of this BrandingTheme.
 */
tutao.entity.sys.BrandingTheme.prototype.getJsonTheme = function() {
  return this._jsonTheme;
};

/**
 * Loads a BrandingTheme from the server.
 * @param {string} id The id of the BrandingTheme.
 * @return {Promise.<tutao.entity.sys.BrandingTheme>} Resolves to the BrandingTheme or an exception if the loading failed.
 */
tutao.entity.sys.BrandingTheme.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.BrandingTheme, tutao.entity.sys.BrandingTheme.PATH, id, null, {"v" : "22"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple BrandingThemes from the server.
 * @param {Array.<string>} ids The ids of the BrandingThemes to load.
 * @return {Promise.<Array.<tutao.entity.sys.BrandingTheme>>} Resolves to an array of BrandingTheme or rejects with an exception if the loading failed.
 */
tutao.entity.sys.BrandingTheme.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.BrandingTheme, tutao.entity.sys.BrandingTheme.PATH, ids, {"v": "22"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this BrandingTheme on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.BrandingTheme.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.BrandingTheme.PATH, this, {"v": "22"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.BrandingTheme.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.BrandingTheme.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.BrandingTheme.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
