"use strict";

tutao.provide('tutao.entity.sys.BrandingDomainDeleteData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BrandingDomainDeleteData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._domain = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.BrandingDomainDeleteData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BrandingDomainDeleteData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._domain = data.domain;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.BrandingDomainDeleteData.MODEL_VERSION = '22';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.BrandingDomainDeleteData.PATH = '/rest/sys/brandingdomainservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.BrandingDomainDeleteData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.BrandingDomainDeleteData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    domain: this._domain
  };
};

/**
 * Sets the format of this BrandingDomainDeleteData.
 * @param {string} format The format of this BrandingDomainDeleteData.
 */
tutao.entity.sys.BrandingDomainDeleteData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this BrandingDomainDeleteData.
 * @return {string} The format of this BrandingDomainDeleteData.
 */
tutao.entity.sys.BrandingDomainDeleteData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the domain of this BrandingDomainDeleteData.
 * @param {string} domain The domain of this BrandingDomainDeleteData.
 */
tutao.entity.sys.BrandingDomainDeleteData.prototype.setDomain = function(domain) {
  this._domain = domain;
  return this;
};

/**
 * Provides the domain of this BrandingDomainDeleteData.
 * @return {string} The domain of this BrandingDomainDeleteData.
 */
tutao.entity.sys.BrandingDomainDeleteData.prototype.getDomain = function() {
  return this._domain;
};

/**
 * Invokes DELETE on a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.BrandingDomainDeleteData>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.BrandingDomainDeleteData.prototype.erase = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "22";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.deleteService(tutao.entity.sys.BrandingDomainDeleteData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.BrandingDomainDeleteData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
