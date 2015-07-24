"use strict";

tutao.provide('tutao.entity.sys.CustomDomainData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomDomainData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._domain = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CustomDomainData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomDomainData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._domain = data.domain;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CustomDomainData.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.CustomDomainData.PATH = '/rest/sys/customdomainservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CustomDomainData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CustomDomainData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    domain: this._domain
  };
};

/**
 * The id of the CustomDomainData type.
 */
tutao.entity.sys.CustomDomainData.prototype.TYPE_ID = 735;

/**
 * The id of the domain attribute.
 */
tutao.entity.sys.CustomDomainData.prototype.DOMAIN_ATTRIBUTE_ID = 737;

/**
 * Sets the format of this CustomDomainData.
 * @param {string} format The format of this CustomDomainData.
 */
tutao.entity.sys.CustomDomainData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CustomDomainData.
 * @return {string} The format of this CustomDomainData.
 */
tutao.entity.sys.CustomDomainData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the domain of this CustomDomainData.
 * @param {string} domain The domain of this CustomDomainData.
 */
tutao.entity.sys.CustomDomainData.prototype.setDomain = function(domain) {
  this._domain = domain;
  return this;
};

/**
 * Provides the domain of this CustomDomainData.
 * @return {string} The domain of this CustomDomainData.
 */
tutao.entity.sys.CustomDomainData.prototype.getDomain = function() {
  return this._domain;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.CustomDomainReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.CustomDomainData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.CustomDomainData.PATH, this, parameters, headers, tutao.entity.sys.CustomDomainReturn);
};
