"use strict";

tutao.provide('tutao.entity.sys.MailAddressAvailabilityReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MailAddressAvailabilityReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._available = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.MailAddressAvailabilityReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MailAddressAvailabilityReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._available = data.available;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.MailAddressAvailabilityReturn.MODEL_VERSION = '12';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.MailAddressAvailabilityReturn.PATH = '/rest/sys/mailaddressavailabilityservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.MailAddressAvailabilityReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.MailAddressAvailabilityReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    available: this._available
  };
};

/**
 * The id of the MailAddressAvailabilityReturn type.
 */
tutao.entity.sys.MailAddressAvailabilityReturn.prototype.TYPE_ID = 312;

/**
 * The id of the available attribute.
 */
tutao.entity.sys.MailAddressAvailabilityReturn.prototype.AVAILABLE_ATTRIBUTE_ID = 314;

/**
 * Sets the format of this MailAddressAvailabilityReturn.
 * @param {string} format The format of this MailAddressAvailabilityReturn.
 */
tutao.entity.sys.MailAddressAvailabilityReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MailAddressAvailabilityReturn.
 * @return {string} The format of this MailAddressAvailabilityReturn.
 */
tutao.entity.sys.MailAddressAvailabilityReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the available of this MailAddressAvailabilityReturn.
 * @param {boolean} available The available of this MailAddressAvailabilityReturn.
 */
tutao.entity.sys.MailAddressAvailabilityReturn.prototype.setAvailable = function(available) {
  this._available = available ? '1' : '0';
  return this;
};

/**
 * Provides the available of this MailAddressAvailabilityReturn.
 * @return {boolean} The available of this MailAddressAvailabilityReturn.
 */
tutao.entity.sys.MailAddressAvailabilityReturn.prototype.getAvailable = function() {
  return this._available != '0';
};

/**
 * Loads from the service.
 * @param {tutao.entity.sys.MailAddressAvailabilityData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.MailAddressAvailabilityReturn>} Resolves to MailAddressAvailabilityReturn or an exception if the loading failed.
 */
tutao.entity.sys.MailAddressAvailabilityReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 12;
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.MailAddressAvailabilityReturn, tutao.entity.sys.MailAddressAvailabilityReturn.PATH, entity, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.MailAddressAvailabilityReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
