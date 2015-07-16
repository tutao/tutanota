"use strict";

tutao.provide('tutao.entity.sys.Invoice');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Invoice = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._date = null;
    this._grandTotal = null;
    this._number = null;
    this._paymentMethod = null;
    this._source = null;
    this._status = null;
    this._vat = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.Invoice.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Invoice.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._date = data.date;
  this._grandTotal = data.grandTotal;
  this._number = data.number;
  this._paymentMethod = data.paymentMethod;
  this._source = data.source;
  this._status = data.status;
  this._vat = data.vat;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.Invoice.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.Invoice.PATH = '/rest/sys/invoice';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.Invoice.ROOT_INSTANCE_ID = 'A3N5cwAC4Q';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.Invoice.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.Invoice.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Invoice.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    date: this._date, 
    grandTotal: this._grandTotal, 
    number: this._number, 
    paymentMethod: this._paymentMethod, 
    source: this._source, 
    status: this._status, 
    vat: this._vat
  };
};

/**
 * The id of the Invoice type.
 */
tutao.entity.sys.Invoice.prototype.TYPE_ID = 737;

/**
 * The id of the date attribute.
 */
tutao.entity.sys.Invoice.prototype.DATE_ATTRIBUTE_ID = 742;

/**
 * The id of the grandTotal attribute.
 */
tutao.entity.sys.Invoice.prototype.GRANDTOTAL_ATTRIBUTE_ID = 745;

/**
 * The id of the number attribute.
 */
tutao.entity.sys.Invoice.prototype.NUMBER_ATTRIBUTE_ID = 743;

/**
 * The id of the paymentMethod attribute.
 */
tutao.entity.sys.Invoice.prototype.PAYMENTMETHOD_ATTRIBUTE_ID = 748;

/**
 * The id of the source attribute.
 */
tutao.entity.sys.Invoice.prototype.SOURCE_ATTRIBUTE_ID = 746;

/**
 * The id of the status attribute.
 */
tutao.entity.sys.Invoice.prototype.STATUS_ATTRIBUTE_ID = 747;

/**
 * The id of the vat attribute.
 */
tutao.entity.sys.Invoice.prototype.VAT_ATTRIBUTE_ID = 744;

/**
 * Provides the id of this Invoice.
 * @return {Array.<string>} The id of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this Invoice.
 * @param {string} format The format of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Invoice.
 * @return {string} The format of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this Invoice.
 * @param {string} permissions The permissions of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Invoice.
 * @return {string} The permissions of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the date of this Invoice.
 * @param {Date} date The date of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setDate = function(date) {
  this._date = String(date.getTime());
  return this;
};

/**
 * Provides the date of this Invoice.
 * @return {Date} The date of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getDate = function() {
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the grandTotal of this Invoice.
 * @param {string} grandTotal The grandTotal of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setGrandTotal = function(grandTotal) {
  this._grandTotal = grandTotal;
  return this;
};

/**
 * Provides the grandTotal of this Invoice.
 * @return {string} The grandTotal of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getGrandTotal = function() {
  return this._grandTotal;
};

/**
 * Sets the number of this Invoice.
 * @param {string} number The number of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setNumber = function(number) {
  this._number = number;
  return this;
};

/**
 * Provides the number of this Invoice.
 * @return {string} The number of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getNumber = function() {
  return this._number;
};

/**
 * Sets the paymentMethod of this Invoice.
 * @param {string} paymentMethod The paymentMethod of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setPaymentMethod = function(paymentMethod) {
  this._paymentMethod = paymentMethod;
  return this;
};

/**
 * Provides the paymentMethod of this Invoice.
 * @return {string} The paymentMethod of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getPaymentMethod = function() {
  return this._paymentMethod;
};

/**
 * Sets the source of this Invoice.
 * @param {string} source The source of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setSource = function(source) {
  this._source = source;
  return this;
};

/**
 * Provides the source of this Invoice.
 * @return {string} The source of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getSource = function() {
  return this._source;
};

/**
 * Sets the status of this Invoice.
 * @param {string} status The status of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setStatus = function(status) {
  this._status = status;
  return this;
};

/**
 * Provides the status of this Invoice.
 * @return {string} The status of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getStatus = function() {
  return this._status;
};

/**
 * Sets the vat of this Invoice.
 * @param {string} vat The vat of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setVat = function(vat) {
  this._vat = vat;
  return this;
};

/**
 * Provides the vat of this Invoice.
 * @return {string} The vat of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getVat = function() {
  return this._vat;
};

/**
 * Loads a Invoice from the server.
 * @param {Array.<string>} id The id of the Invoice.
 * @return {Promise.<tutao.entity.sys.Invoice>} Resolves to the Invoice or an exception if the loading failed.
 */
tutao.entity.sys.Invoice.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.Invoice, tutao.entity.sys.Invoice.PATH, id[1], id[0], {"v" : 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple Invoices from the server.
 * @param {Array.<Array.<string>>} ids The ids of the Invoices to load.
 * @return {Promise.<Array.<tutao.entity.sys.Invoice>>} Resolves to an array of Invoice or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Invoice.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.Invoice, tutao.entity.sys.Invoice.PATH, ids, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.Invoice.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 9;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.Invoice.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this Invoice on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.Invoice.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.Invoice.PATH, this, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of Invoices loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.Invoice>>} Resolves to an array of Invoice or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Invoice.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.Invoice, tutao.entity.sys.Invoice.PATH, listId, start, count, reverse, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.Invoice.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.Invoice.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
