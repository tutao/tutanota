"use strict";

tutao.provide('tutao.entity.sys.MailAddressAliasServiceReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MailAddressAliasServiceReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._nbrOfFreeAliases = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.MailAddressAliasServiceReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MailAddressAliasServiceReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._nbrOfFreeAliases = data.nbrOfFreeAliases;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.MailAddressAliasServiceReturn.MODEL_VERSION = '14';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.MailAddressAliasServiceReturn.PATH = '/rest/sys/mailaddressaliasservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.MailAddressAliasServiceReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.MailAddressAliasServiceReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    nbrOfFreeAliases: this._nbrOfFreeAliases
  };
};

/**
 * The id of the MailAddressAliasServiceReturn type.
 */
tutao.entity.sys.MailAddressAliasServiceReturn.prototype.TYPE_ID = 692;

/**
 * The id of the nbrOfFreeAliases attribute.
 */
tutao.entity.sys.MailAddressAliasServiceReturn.prototype.NBROFFREEALIASES_ATTRIBUTE_ID = 694;

/**
 * Sets the format of this MailAddressAliasServiceReturn.
 * @param {string} format The format of this MailAddressAliasServiceReturn.
 */
tutao.entity.sys.MailAddressAliasServiceReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MailAddressAliasServiceReturn.
 * @return {string} The format of this MailAddressAliasServiceReturn.
 */
tutao.entity.sys.MailAddressAliasServiceReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the nbrOfFreeAliases of this MailAddressAliasServiceReturn.
 * @param {string} nbrOfFreeAliases The nbrOfFreeAliases of this MailAddressAliasServiceReturn.
 */
tutao.entity.sys.MailAddressAliasServiceReturn.prototype.setNbrOfFreeAliases = function(nbrOfFreeAliases) {
  this._nbrOfFreeAliases = nbrOfFreeAliases;
  return this;
};

/**
 * Provides the nbrOfFreeAliases of this MailAddressAliasServiceReturn.
 * @return {string} The nbrOfFreeAliases of this MailAddressAliasServiceReturn.
 */
tutao.entity.sys.MailAddressAliasServiceReturn.prototype.getNbrOfFreeAliases = function() {
  return this._nbrOfFreeAliases;
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.MailAddressAliasServiceReturn>} Resolves to MailAddressAliasServiceReturn or an exception if the loading failed.
 */
tutao.entity.sys.MailAddressAliasServiceReturn.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 14;
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.MailAddressAliasServiceReturn, tutao.entity.sys.MailAddressAliasServiceReturn.PATH, null, null, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.MailAddressAliasServiceReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
