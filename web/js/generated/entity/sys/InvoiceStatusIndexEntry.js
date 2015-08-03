"use strict";

tutao.provide('tutao.entity.sys.InvoiceStatusIndexEntry');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceStatusIndexEntry = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._accountingInfo = null;
    this._customer = null;
    this._invoice = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.InvoiceStatusIndexEntry.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._accountingInfo = data.accountingInfo;
  this._customer = data.customer;
  this._invoice = data.invoice;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndexEntry.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndexEntry.PATH = '/rest/sys/invoicestatusindexentry';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndexEntry.ROOT_INSTANCE_ID = 'A3N5cwADKQ';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndexEntry.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    accountingInfo: this._accountingInfo, 
    customer: this._customer, 
    invoice: this._invoice
  };
};

/**
 * The id of the InvoiceStatusIndexEntry type.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.TYPE_ID = 809;

/**
 * The id of the accountingInfo attribute.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.ACCOUNTINGINFO_ATTRIBUTE_ID = 815;

/**
 * The id of the customer attribute.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.CUSTOMER_ATTRIBUTE_ID = 814;

/**
 * The id of the invoice attribute.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.INVOICE_ATTRIBUTE_ID = 816;

/**
 * Provides the id of this InvoiceStatusIndexEntry.
 * @return {Array.<string>} The id of this InvoiceStatusIndexEntry.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this InvoiceStatusIndexEntry.
 * @param {string} format The format of this InvoiceStatusIndexEntry.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this InvoiceStatusIndexEntry.
 * @return {string} The format of this InvoiceStatusIndexEntry.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this InvoiceStatusIndexEntry.
 * @param {string} permissions The permissions of this InvoiceStatusIndexEntry.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this InvoiceStatusIndexEntry.
 * @return {string} The permissions of this InvoiceStatusIndexEntry.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the accountingInfo of this InvoiceStatusIndexEntry.
 * @param {string} accountingInfo The accountingInfo of this InvoiceStatusIndexEntry.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.setAccountingInfo = function(accountingInfo) {
  this._accountingInfo = accountingInfo;
  return this;
};

/**
 * Provides the accountingInfo of this InvoiceStatusIndexEntry.
 * @return {string} The accountingInfo of this InvoiceStatusIndexEntry.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.getAccountingInfo = function() {
  return this._accountingInfo;
};

/**
 * Loads the accountingInfo of this InvoiceStatusIndexEntry.
 * @return {Promise.<tutao.entity.sys.AccountingInfo>} Resolves to the loaded accountingInfo of this InvoiceStatusIndexEntry or an exception if the loading failed.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.loadAccountingInfo = function() {
  return tutao.entity.sys.AccountingInfo.load(this._accountingInfo);
};

/**
 * Sets the customer of this InvoiceStatusIndexEntry.
 * @param {string} customer The customer of this InvoiceStatusIndexEntry.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.setCustomer = function(customer) {
  this._customer = customer;
  return this;
};

/**
 * Provides the customer of this InvoiceStatusIndexEntry.
 * @return {string} The customer of this InvoiceStatusIndexEntry.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.getCustomer = function() {
  return this._customer;
};

/**
 * Loads the customer of this InvoiceStatusIndexEntry.
 * @return {Promise.<tutao.entity.sys.Customer>} Resolves to the loaded customer of this InvoiceStatusIndexEntry or an exception if the loading failed.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.loadCustomer = function() {
  return tutao.entity.sys.Customer.load(this._customer);
};

/**
 * Sets the invoice of this InvoiceStatusIndexEntry.
 * @param {Array.<string>} invoice The invoice of this InvoiceStatusIndexEntry.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.setInvoice = function(invoice) {
  this._invoice = invoice;
  return this;
};

/**
 * Provides the invoice of this InvoiceStatusIndexEntry.
 * @return {Array.<string>} The invoice of this InvoiceStatusIndexEntry.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.getInvoice = function() {
  return this._invoice;
};

/**
 * Loads the invoice of this InvoiceStatusIndexEntry.
 * @return {Promise.<tutao.entity.sys.Invoice>} Resolves to the loaded invoice of this InvoiceStatusIndexEntry or an exception if the loading failed.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.loadInvoice = function() {
  return tutao.entity.sys.Invoice.load(this._invoice);
};

/**
 * Loads a InvoiceStatusIndexEntry from the server.
 * @param {Array.<string>} id The id of the InvoiceStatusIndexEntry.
 * @return {Promise.<tutao.entity.sys.InvoiceStatusIndexEntry>} Resolves to the InvoiceStatusIndexEntry or an exception if the loading failed.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.InvoiceStatusIndexEntry, tutao.entity.sys.InvoiceStatusIndexEntry.PATH, id[1], id[0], {"v" : 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple InvoiceStatusIndexEntrys from the server.
 * @param {Array.<Array.<string>>} ids The ids of the InvoiceStatusIndexEntrys to load.
 * @return {Promise.<Array.<tutao.entity.sys.InvoiceStatusIndexEntry>>} Resolves to an array of InvoiceStatusIndexEntry or rejects with an exception if the loading failed.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.InvoiceStatusIndexEntry, tutao.entity.sys.InvoiceStatusIndexEntry.PATH, ids, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 9;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.InvoiceStatusIndexEntry.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of InvoiceStatusIndexEntrys loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.InvoiceStatusIndexEntry>>} Resolves to an array of InvoiceStatusIndexEntry or rejects with an exception if the loading failed.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.InvoiceStatusIndexEntry, tutao.entity.sys.InvoiceStatusIndexEntry.PATH, listId, start, count, reverse, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.InvoiceStatusIndexEntry.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
