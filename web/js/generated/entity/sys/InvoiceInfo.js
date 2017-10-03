"use strict";

tutao.provide('tutao.entity.sys.InvoiceInfo');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceInfo = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._publishInvoices = null;
    this._specialPriceUserSingle = null;
    this._specialPriceUserTotal = null;
    this._invoices = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.InvoiceInfo.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceInfo.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._publishInvoices = data.publishInvoices;
  this._specialPriceUserSingle = data.specialPriceUserSingle;
  this._specialPriceUserTotal = data.specialPriceUserTotal;
  this._invoices = data.invoices;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.InvoiceInfo.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.InvoiceInfo.PATH = '/rest/sys/invoiceinfo';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.InvoiceInfo.ROOT_INSTANCE_ID = 'A3N5cwAC8A';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.InvoiceInfo.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.InvoiceInfo.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.InvoiceInfo.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    publishInvoices: this._publishInvoices, 
    specialPriceUserSingle: this._specialPriceUserSingle, 
    specialPriceUserTotal: this._specialPriceUserTotal, 
    invoices: this._invoices
  };
};

/**
 * Provides the id of this InvoiceInfo.
 * @return {string} The id of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this InvoiceInfo.
 * @param {string} format The format of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this InvoiceInfo.
 * @return {string} The format of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this InvoiceInfo.
 * @param {string} ownerGroup The ownerGroup of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this InvoiceInfo.
 * @return {string} The ownerGroup of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this InvoiceInfo.
 * @param {string} permissions The permissions of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this InvoiceInfo.
 * @return {string} The permissions of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the publishInvoices of this InvoiceInfo.
 * @param {boolean} publishInvoices The publishInvoices of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.setPublishInvoices = function(publishInvoices) {
  this._publishInvoices = publishInvoices ? '1' : '0';
  return this;
};

/**
 * Provides the publishInvoices of this InvoiceInfo.
 * @return {boolean} The publishInvoices of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.getPublishInvoices = function() {
  return this._publishInvoices != '0';
};

/**
 * Sets the specialPriceUserSingle of this InvoiceInfo.
 * @param {string} specialPriceUserSingle The specialPriceUserSingle of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.setSpecialPriceUserSingle = function(specialPriceUserSingle) {
  this._specialPriceUserSingle = specialPriceUserSingle;
  return this;
};

/**
 * Provides the specialPriceUserSingle of this InvoiceInfo.
 * @return {string} The specialPriceUserSingle of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.getSpecialPriceUserSingle = function() {
  return this._specialPriceUserSingle;
};

/**
 * Sets the specialPriceUserTotal of this InvoiceInfo.
 * @param {string} specialPriceUserTotal The specialPriceUserTotal of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.setSpecialPriceUserTotal = function(specialPriceUserTotal) {
  this._specialPriceUserTotal = specialPriceUserTotal;
  return this;
};

/**
 * Provides the specialPriceUserTotal of this InvoiceInfo.
 * @return {string} The specialPriceUserTotal of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.getSpecialPriceUserTotal = function() {
  return this._specialPriceUserTotal;
};

/**
 * Sets the invoices of this InvoiceInfo.
 * @param {string} invoices The invoices of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.setInvoices = function(invoices) {
  this._invoices = invoices;
  return this;
};

/**
 * Provides the invoices of this InvoiceInfo.
 * @return {string} The invoices of this InvoiceInfo.
 */
tutao.entity.sys.InvoiceInfo.prototype.getInvoices = function() {
  return this._invoices;
};

/**
 * Loads a InvoiceInfo from the server.
 * @param {string} id The id of the InvoiceInfo.
 * @return {Promise.<tutao.entity.sys.InvoiceInfo>} Resolves to the InvoiceInfo or an exception if the loading failed.
 */
tutao.entity.sys.InvoiceInfo.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.InvoiceInfo, tutao.entity.sys.InvoiceInfo.PATH, id, null, {"v" : "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple InvoiceInfos from the server.
 * @param {Array.<string>} ids The ids of the InvoiceInfos to load.
 * @return {Promise.<Array.<tutao.entity.sys.InvoiceInfo>>} Resolves to an array of InvoiceInfo or rejects with an exception if the loading failed.
 */
tutao.entity.sys.InvoiceInfo.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.InvoiceInfo, tutao.entity.sys.InvoiceInfo.PATH, ids, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this InvoiceInfo on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.InvoiceInfo.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.InvoiceInfo.PATH, this, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.InvoiceInfo.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.InvoiceInfo.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.InvoiceInfo.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
