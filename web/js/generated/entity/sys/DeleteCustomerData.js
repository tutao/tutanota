"use strict";

tutao.provide('tutao.entity.sys.DeleteCustomerData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DeleteCustomerData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._reason = null;
    this._undelete = null;
    this._customer = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.DeleteCustomerData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DeleteCustomerData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._reason = data.reason;
  this._undelete = data.undelete;
  this._customer = data.customer;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.DeleteCustomerData.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.DeleteCustomerData.PATH = '/rest/sys/customerservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.DeleteCustomerData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.DeleteCustomerData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    reason: this._reason, 
    undelete: this._undelete, 
    customer: this._customer
  };
};

/**
 * The id of the DeleteCustomerData type.
 */
tutao.entity.sys.DeleteCustomerData.prototype.TYPE_ID = 641;

/**
 * The id of the reason attribute.
 */
tutao.entity.sys.DeleteCustomerData.prototype.REASON_ATTRIBUTE_ID = 644;

/**
 * The id of the undelete attribute.
 */
tutao.entity.sys.DeleteCustomerData.prototype.UNDELETE_ATTRIBUTE_ID = 643;

/**
 * The id of the customer attribute.
 */
tutao.entity.sys.DeleteCustomerData.prototype.CUSTOMER_ATTRIBUTE_ID = 645;

/**
 * Sets the format of this DeleteCustomerData.
 * @param {string} format The format of this DeleteCustomerData.
 */
tutao.entity.sys.DeleteCustomerData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DeleteCustomerData.
 * @return {string} The format of this DeleteCustomerData.
 */
tutao.entity.sys.DeleteCustomerData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the reason of this DeleteCustomerData.
 * @param {string} reason The reason of this DeleteCustomerData.
 */
tutao.entity.sys.DeleteCustomerData.prototype.setReason = function(reason) {
  this._reason = reason;
  return this;
};

/**
 * Provides the reason of this DeleteCustomerData.
 * @return {string} The reason of this DeleteCustomerData.
 */
tutao.entity.sys.DeleteCustomerData.prototype.getReason = function() {
  return this._reason;
};

/**
 * Sets the undelete of this DeleteCustomerData.
 * @param {boolean} undelete The undelete of this DeleteCustomerData.
 */
tutao.entity.sys.DeleteCustomerData.prototype.setUndelete = function(undelete) {
  this._undelete = undelete ? '1' : '0';
  return this;
};

/**
 * Provides the undelete of this DeleteCustomerData.
 * @return {boolean} The undelete of this DeleteCustomerData.
 */
tutao.entity.sys.DeleteCustomerData.prototype.getUndelete = function() {
  return this._undelete != '0';
};

/**
 * Sets the customer of this DeleteCustomerData.
 * @param {string} customer The customer of this DeleteCustomerData.
 */
tutao.entity.sys.DeleteCustomerData.prototype.setCustomer = function(customer) {
  this._customer = customer;
  return this;
};

/**
 * Provides the customer of this DeleteCustomerData.
 * @return {string} The customer of this DeleteCustomerData.
 */
tutao.entity.sys.DeleteCustomerData.prototype.getCustomer = function() {
  return this._customer;
};

/**
 * Loads the customer of this DeleteCustomerData.
 * @return {Promise.<tutao.entity.sys.Customer>} Resolves to the loaded customer of this DeleteCustomerData or an exception if the loading failed.
 */
tutao.entity.sys.DeleteCustomerData.prototype.loadCustomer = function() {
  return tutao.entity.sys.Customer.load(this._customer);
};

/**
 * Invokes DELETE on a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.DeleteCustomerData=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.DeleteCustomerData.prototype.erase = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.deleteService(tutao.entity.sys.DeleteCustomerData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.DeleteCustomerData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
