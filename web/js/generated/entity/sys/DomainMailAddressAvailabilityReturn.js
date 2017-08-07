"use strict";

tutao.provide('tutao.entity.sys.DomainMailAddressAvailabilityReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._available = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.DomainMailAddressAvailabilityReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._available = data.available;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn.MODEL_VERSION = '23';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn.PATH = '/rest/sys/domainmailaddressavailabilityservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    available: this._available
  };
};

/**
 * Sets the format of this DomainMailAddressAvailabilityReturn.
 * @param {string} format The format of this DomainMailAddressAvailabilityReturn.
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DomainMailAddressAvailabilityReturn.
 * @return {string} The format of this DomainMailAddressAvailabilityReturn.
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the available of this DomainMailAddressAvailabilityReturn.
 * @param {boolean} available The available of this DomainMailAddressAvailabilityReturn.
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn.prototype.setAvailable = function(available) {
  this._available = available ? '1' : '0';
  return this;
};

/**
 * Provides the available of this DomainMailAddressAvailabilityReturn.
 * @return {boolean} The available of this DomainMailAddressAvailabilityReturn.
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn.prototype.getAvailable = function() {
  return this._available != '0';
};

/**
 * Loads from the service.
 * @param {tutao.entity.sys.DomainMailAddressAvailabilityData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.DomainMailAddressAvailabilityReturn>} Resolves to DomainMailAddressAvailabilityReturn or an exception if the loading failed.
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "23";
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.DomainMailAddressAvailabilityReturn, tutao.entity.sys.DomainMailAddressAvailabilityReturn.PATH, entity, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.DomainMailAddressAvailabilityReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
