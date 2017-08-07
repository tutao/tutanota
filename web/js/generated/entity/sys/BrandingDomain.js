"use strict";

tutao.provide('tutao.entity.sys.BrandingDomain');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BrandingDomain = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._certificate = null;
    this._theme = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.BrandingDomain.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BrandingDomain.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._certificate = data.certificate;
  this._theme = data.theme;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.BrandingDomain.MODEL_VERSION = '23';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.BrandingDomain.PATH = '/rest/sys/brandingdomain';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.BrandingDomain.ROOT_INSTANCE_ID = 'A3N5cwAEcQ';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.BrandingDomain.GENERATED_ID = false;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.BrandingDomain.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.BrandingDomain.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    certificate: this._certificate, 
    theme: this._theme
  };
};

/**
 * Sets the custom id of this BrandingDomain.
 * @param {Array.<string>} id The custom id of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.setId = function(id) {
  this.__id = id;
};

/**
 * Provides the id of this BrandingDomain.
 * @return {Array.<string>} The id of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this BrandingDomain.
 * @param {string} format The format of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this BrandingDomain.
 * @return {string} The format of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this BrandingDomain.
 * @param {string} ownerGroup The ownerGroup of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this BrandingDomain.
 * @return {string} The ownerGroup of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this BrandingDomain.
 * @param {string} permissions The permissions of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this BrandingDomain.
 * @return {string} The permissions of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the certificate of this BrandingDomain.
 * @param {string} certificate The certificate of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.setCertificate = function(certificate) {
  this._certificate = certificate;
  return this;
};

/**
 * Provides the certificate of this BrandingDomain.
 * @return {string} The certificate of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.getCertificate = function() {
  return this._certificate;
};

/**
 * Loads the certificate of this BrandingDomain.
 * @return {Promise.<tutao.entity.sys.SslCertificate>} Resolves to the loaded certificate of this BrandingDomain or an exception if the loading failed.
 */
tutao.entity.sys.BrandingDomain.prototype.loadCertificate = function() {
  return tutao.entity.sys.SslCertificate.load(this._certificate);
};

/**
 * Sets the theme of this BrandingDomain.
 * @param {string} theme The theme of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.setTheme = function(theme) {
  this._theme = theme;
  return this;
};

/**
 * Provides the theme of this BrandingDomain.
 * @return {string} The theme of this BrandingDomain.
 */
tutao.entity.sys.BrandingDomain.prototype.getTheme = function() {
  return this._theme;
};

/**
 * Loads the theme of this BrandingDomain.
 * @return {Promise.<tutao.entity.sys.BrandingTheme>} Resolves to the loaded theme of this BrandingDomain or an exception if the loading failed.
 */
tutao.entity.sys.BrandingDomain.prototype.loadTheme = function() {
  return tutao.entity.sys.BrandingTheme.load(this._theme);
};

/**
 * Loads a BrandingDomain from the server.
 * @param {Array.<string>} id The id of the BrandingDomain.
 * @return {Promise.<tutao.entity.sys.BrandingDomain>} Resolves to the BrandingDomain or an exception if the loading failed.
 */
tutao.entity.sys.BrandingDomain.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.BrandingDomain, tutao.entity.sys.BrandingDomain.PATH, id[1], id[0], {"v" : "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple BrandingDomains from the server.
 * @param {Array.<Array.<string>>} ids The ids of the BrandingDomains to load.
 * @return {Promise.<Array.<tutao.entity.sys.BrandingDomain>>} Resolves to an array of BrandingDomain or rejects with an exception if the loading failed.
 */
tutao.entity.sys.BrandingDomain.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.BrandingDomain, tutao.entity.sys.BrandingDomain.PATH, ids, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this BrandingDomain on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.BrandingDomain.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.BrandingDomain.PATH, this, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of BrandingDomains loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.BrandingDomain>>} Resolves to an array of BrandingDomain or rejects with an exception if the loading failed.
 */
tutao.entity.sys.BrandingDomain.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.BrandingDomain, tutao.entity.sys.BrandingDomain.PATH, listId, start, count, reverse, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.BrandingDomain.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.BrandingDomain.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.BrandingDomain.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
