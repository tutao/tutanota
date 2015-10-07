"use strict";

tutao.provide('tutao.entity.sys.InvoiceChange');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceChange = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._comment = null;
    this._date = null;
    this._status = null;
    this._customer = null;
    this._invoice = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.InvoiceChange.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceChange.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._comment = data.comment;
  this._date = data.date;
  this._status = data.status;
  this._customer = data.customer;
  this._invoice = data.invoice;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.InvoiceChange.MODEL_VERSION = '11';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.InvoiceChange.PATH = '/rest/sys/invoicechange';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.InvoiceChange.ROOT_INSTANCE_ID = 'A3N5cwADcg';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.InvoiceChange.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.InvoiceChange.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.InvoiceChange.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    comment: this._comment, 
    date: this._date, 
    status: this._status, 
    customer: this._customer, 
    invoice: this._invoice
  };
};

/**
 * The id of the InvoiceChange type.
 */
tutao.entity.sys.InvoiceChange.prototype.TYPE_ID = 882;

/**
 * The id of the comment attribute.
 */
tutao.entity.sys.InvoiceChange.prototype.COMMENT_ATTRIBUTE_ID = 889;

/**
 * The id of the date attribute.
 */
tutao.entity.sys.InvoiceChange.prototype.DATE_ATTRIBUTE_ID = 887;

/**
 * The id of the status attribute.
 */
tutao.entity.sys.InvoiceChange.prototype.STATUS_ATTRIBUTE_ID = 888;

/**
 * The id of the customer attribute.
 */
tutao.entity.sys.InvoiceChange.prototype.CUSTOMER_ATTRIBUTE_ID = 891;

/**
 * The id of the invoice attribute.
 */
tutao.entity.sys.InvoiceChange.prototype.INVOICE_ATTRIBUTE_ID = 890;

/**
 * Provides the id of this InvoiceChange.
 * @return {Array.<string>} The id of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this InvoiceChange.
 * @param {string} format The format of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this InvoiceChange.
 * @return {string} The format of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this InvoiceChange.
 * @param {string} permissions The permissions of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this InvoiceChange.
 * @return {string} The permissions of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the comment of this InvoiceChange.
 * @param {string} comment The comment of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.setComment = function(comment) {
  this._comment = comment;
  return this;
};

/**
 * Provides the comment of this InvoiceChange.
 * @return {string} The comment of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.getComment = function() {
  return this._comment;
};

/**
 * Sets the date of this InvoiceChange.
 * @param {Date} date The date of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.setDate = function(date) {
  this._date = String(date.getTime());
  return this;
};

/**
 * Provides the date of this InvoiceChange.
 * @return {Date} The date of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.getDate = function() {
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the status of this InvoiceChange.
 * @param {string} status The status of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.setStatus = function(status) {
  this._status = status;
  return this;
};

/**
 * Provides the status of this InvoiceChange.
 * @return {string} The status of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.getStatus = function() {
  return this._status;
};

/**
 * Sets the customer of this InvoiceChange.
 * @param {string} customer The customer of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.setCustomer = function(customer) {
  this._customer = customer;
  return this;
};

/**
 * Provides the customer of this InvoiceChange.
 * @return {string} The customer of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.getCustomer = function() {
  return this._customer;
};

/**
 * Loads the customer of this InvoiceChange.
 * @return {Promise.<tutao.entity.sys.Customer>} Resolves to the loaded customer of this InvoiceChange or an exception if the loading failed.
 */
tutao.entity.sys.InvoiceChange.prototype.loadCustomer = function() {
  return tutao.entity.sys.Customer.load(this._customer);
};

/**
 * Sets the invoice of this InvoiceChange.
 * @param {Array.<string>} invoice The invoice of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.setInvoice = function(invoice) {
  this._invoice = invoice;
  return this;
};

/**
 * Provides the invoice of this InvoiceChange.
 * @return {Array.<string>} The invoice of this InvoiceChange.
 */
tutao.entity.sys.InvoiceChange.prototype.getInvoice = function() {
  return this._invoice;
};

/**
 * Loads the invoice of this InvoiceChange.
 * @return {Promise.<tutao.entity.sys.Invoice>} Resolves to the loaded invoice of this InvoiceChange or an exception if the loading failed.
 */
tutao.entity.sys.InvoiceChange.prototype.loadInvoice = function() {
  return tutao.entity.sys.Invoice.load(this._invoice);
};

/**
 * Loads a InvoiceChange from the server.
 * @param {Array.<string>} id The id of the InvoiceChange.
 * @return {Promise.<tutao.entity.sys.InvoiceChange>} Resolves to the InvoiceChange or an exception if the loading failed.
 */
tutao.entity.sys.InvoiceChange.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.InvoiceChange, tutao.entity.sys.InvoiceChange.PATH, id[1], id[0], {"v" : 11}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple InvoiceChanges from the server.
 * @param {Array.<Array.<string>>} ids The ids of the InvoiceChanges to load.
 * @return {Promise.<Array.<tutao.entity.sys.InvoiceChange>>} Resolves to an array of InvoiceChange or rejects with an exception if the loading failed.
 */
tutao.entity.sys.InvoiceChange.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.InvoiceChange, tutao.entity.sys.InvoiceChange.PATH, ids, {"v": 11}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.InvoiceChange.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 11;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.InvoiceChange.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this InvoiceChange on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.InvoiceChange.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.InvoiceChange.PATH, this, {"v": 11}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this InvoiceChange on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.sys.InvoiceChange.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.sys.InvoiceChange.PATH, this.__id[1], this.__id[0], {"v": 11}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Provides a  list of InvoiceChanges loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.InvoiceChange>>} Resolves to an array of InvoiceChange or rejects with an exception if the loading failed.
 */
tutao.entity.sys.InvoiceChange.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.InvoiceChange, tutao.entity.sys.InvoiceChange.PATH, listId, start, count, reverse, {"v": 11}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.InvoiceChange.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.InvoiceChange.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.InvoiceChange.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
