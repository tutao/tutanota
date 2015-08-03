"use strict";

tutao.provide('tutao.entity.sys.InvoiceStatusIndexFolder');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceStatusIndexFolder = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._entries = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.InvoiceStatusIndexFolder.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._entries = data.entries;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndexFolder.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndexFolder.PATH = '/rest/sys/invoicestatusindexfolder';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndexFolder.ROOT_INSTANCE_ID = 'A3N5cwADMQ';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndexFolder.GENERATED_ID = false;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    entries: this._entries
  };
};

/**
 * The id of the InvoiceStatusIndexFolder type.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.TYPE_ID = 817;

/**
 * The id of the entries attribute.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.ENTRIES_ATTRIBUTE_ID = 822;

/**
 * Sets the custom id of this InvoiceStatusIndexFolder.
 * @param {Array.<string>} id The custom id of this InvoiceStatusIndexFolder.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.setId = function(id) {
  this.__id = id;
};

/**
 * Provides the id of this InvoiceStatusIndexFolder.
 * @return {Array.<string>} The id of this InvoiceStatusIndexFolder.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this InvoiceStatusIndexFolder.
 * @param {string} format The format of this InvoiceStatusIndexFolder.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this InvoiceStatusIndexFolder.
 * @return {string} The format of this InvoiceStatusIndexFolder.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this InvoiceStatusIndexFolder.
 * @param {string} permissions The permissions of this InvoiceStatusIndexFolder.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this InvoiceStatusIndexFolder.
 * @return {string} The permissions of this InvoiceStatusIndexFolder.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the entries of this InvoiceStatusIndexFolder.
 * @param {string} entries The entries of this InvoiceStatusIndexFolder.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.setEntries = function(entries) {
  this._entries = entries;
  return this;
};

/**
 * Provides the entries of this InvoiceStatusIndexFolder.
 * @return {string} The entries of this InvoiceStatusIndexFolder.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.getEntries = function() {
  return this._entries;
};

/**
 * Loads a InvoiceStatusIndexFolder from the server.
 * @param {Array.<string>} id The id of the InvoiceStatusIndexFolder.
 * @return {Promise.<tutao.entity.sys.InvoiceStatusIndexFolder>} Resolves to the InvoiceStatusIndexFolder or an exception if the loading failed.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.InvoiceStatusIndexFolder, tutao.entity.sys.InvoiceStatusIndexFolder.PATH, id[1], id[0], {"v" : 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple InvoiceStatusIndexFolders from the server.
 * @param {Array.<Array.<string>>} ids The ids of the InvoiceStatusIndexFolders to load.
 * @return {Promise.<Array.<tutao.entity.sys.InvoiceStatusIndexFolder>>} Resolves to an array of InvoiceStatusIndexFolder or rejects with an exception if the loading failed.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.InvoiceStatusIndexFolder, tutao.entity.sys.InvoiceStatusIndexFolder.PATH, ids, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 9;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.InvoiceStatusIndexFolder.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of InvoiceStatusIndexFolders loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.InvoiceStatusIndexFolder>>} Resolves to an array of InvoiceStatusIndexFolder or rejects with an exception if the loading failed.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.InvoiceStatusIndexFolder, tutao.entity.sys.InvoiceStatusIndexFolder.PATH, listId, start, count, reverse, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.InvoiceStatusIndexFolder.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
