"use strict";

tutao.provide('tutao.entity.sys.InvoiceStatusIndex');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceStatusIndex = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._folders = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.InvoiceStatusIndex.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._folders = data.folders;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndex.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndex.PATH = '/rest/sys/invoicestatusindex';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndex.ROOT_INSTANCE_ID = 'A3N5cwADMw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndex.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    folders: this._folders
  };
};

/**
 * The id of the InvoiceStatusIndex type.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.TYPE_ID = 819;

/**
 * The id of the folders attribute.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.FOLDERS_ATTRIBUTE_ID = 824;

/**
 * Provides the id of this InvoiceStatusIndex.
 * @return {string} The id of this InvoiceStatusIndex.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this InvoiceStatusIndex.
 * @param {string} format The format of this InvoiceStatusIndex.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this InvoiceStatusIndex.
 * @return {string} The format of this InvoiceStatusIndex.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this InvoiceStatusIndex.
 * @param {string} permissions The permissions of this InvoiceStatusIndex.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this InvoiceStatusIndex.
 * @return {string} The permissions of this InvoiceStatusIndex.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the folders of this InvoiceStatusIndex.
 * @param {string} folders The folders of this InvoiceStatusIndex.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.setFolders = function(folders) {
  this._folders = folders;
  return this;
};

/**
 * Provides the folders of this InvoiceStatusIndex.
 * @return {string} The folders of this InvoiceStatusIndex.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.getFolders = function() {
  return this._folders;
};

/**
 * Loads a InvoiceStatusIndex from the server.
 * @param {string} id The id of the InvoiceStatusIndex.
 * @return {Promise.<tutao.entity.sys.InvoiceStatusIndex>} Resolves to the InvoiceStatusIndex or an exception if the loading failed.
 */
tutao.entity.sys.InvoiceStatusIndex.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.InvoiceStatusIndex, tutao.entity.sys.InvoiceStatusIndex.PATH, id, null, {"v" : 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple InvoiceStatusIndexs from the server.
 * @param {Array.<string>} ids The ids of the InvoiceStatusIndexs to load.
 * @return {Promise.<Array.<tutao.entity.sys.InvoiceStatusIndex>>} Resolves to an array of InvoiceStatusIndex or rejects with an exception if the loading failed.
 */
tutao.entity.sys.InvoiceStatusIndex.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.InvoiceStatusIndex, tutao.entity.sys.InvoiceStatusIndex.PATH, ids, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.InvoiceStatusIndex.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
