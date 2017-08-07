"use strict";

tutao.provide('tutao.entity.sys.BrandingDomainData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BrandingDomainData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._domain = null;
    this._sessionEncPemCertificateChain = null;
    this._sessionEncPemPrivateKey = null;
    this._systemAdminPubEncSessionKey = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.BrandingDomainData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BrandingDomainData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._domain = data.domain;
  this._sessionEncPemCertificateChain = data.sessionEncPemCertificateChain;
  this._sessionEncPemPrivateKey = data.sessionEncPemPrivateKey;
  this._systemAdminPubEncSessionKey = data.systemAdminPubEncSessionKey;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.BrandingDomainData.MODEL_VERSION = '23';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.BrandingDomainData.PATH = '/rest/sys/brandingdomainservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.BrandingDomainData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.BrandingDomainData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    domain: this._domain, 
    sessionEncPemCertificateChain: this._sessionEncPemCertificateChain, 
    sessionEncPemPrivateKey: this._sessionEncPemPrivateKey, 
    systemAdminPubEncSessionKey: this._systemAdminPubEncSessionKey
  };
};

/**
 * Sets the format of this BrandingDomainData.
 * @param {string} format The format of this BrandingDomainData.
 */
tutao.entity.sys.BrandingDomainData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this BrandingDomainData.
 * @return {string} The format of this BrandingDomainData.
 */
tutao.entity.sys.BrandingDomainData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the domain of this BrandingDomainData.
 * @param {string} domain The domain of this BrandingDomainData.
 */
tutao.entity.sys.BrandingDomainData.prototype.setDomain = function(domain) {
  this._domain = domain;
  return this;
};

/**
 * Provides the domain of this BrandingDomainData.
 * @return {string} The domain of this BrandingDomainData.
 */
tutao.entity.sys.BrandingDomainData.prototype.getDomain = function() {
  return this._domain;
};

/**
 * Sets the sessionEncPemCertificateChain of this BrandingDomainData.
 * @param {string} sessionEncPemCertificateChain The sessionEncPemCertificateChain of this BrandingDomainData.
 */
tutao.entity.sys.BrandingDomainData.prototype.setSessionEncPemCertificateChain = function(sessionEncPemCertificateChain) {
  this._sessionEncPemCertificateChain = sessionEncPemCertificateChain;
  return this;
};

/**
 * Provides the sessionEncPemCertificateChain of this BrandingDomainData.
 * @return {string} The sessionEncPemCertificateChain of this BrandingDomainData.
 */
tutao.entity.sys.BrandingDomainData.prototype.getSessionEncPemCertificateChain = function() {
  return this._sessionEncPemCertificateChain;
};

/**
 * Sets the sessionEncPemPrivateKey of this BrandingDomainData.
 * @param {string} sessionEncPemPrivateKey The sessionEncPemPrivateKey of this BrandingDomainData.
 */
tutao.entity.sys.BrandingDomainData.prototype.setSessionEncPemPrivateKey = function(sessionEncPemPrivateKey) {
  this._sessionEncPemPrivateKey = sessionEncPemPrivateKey;
  return this;
};

/**
 * Provides the sessionEncPemPrivateKey of this BrandingDomainData.
 * @return {string} The sessionEncPemPrivateKey of this BrandingDomainData.
 */
tutao.entity.sys.BrandingDomainData.prototype.getSessionEncPemPrivateKey = function() {
  return this._sessionEncPemPrivateKey;
};

/**
 * Sets the systemAdminPubEncSessionKey of this BrandingDomainData.
 * @param {string} systemAdminPubEncSessionKey The systemAdminPubEncSessionKey of this BrandingDomainData.
 */
tutao.entity.sys.BrandingDomainData.prototype.setSystemAdminPubEncSessionKey = function(systemAdminPubEncSessionKey) {
  this._systemAdminPubEncSessionKey = systemAdminPubEncSessionKey;
  return this;
};

/**
 * Provides the systemAdminPubEncSessionKey of this BrandingDomainData.
 * @return {string} The systemAdminPubEncSessionKey of this BrandingDomainData.
 */
tutao.entity.sys.BrandingDomainData.prototype.getSystemAdminPubEncSessionKey = function() {
  return this._systemAdminPubEncSessionKey;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.BrandingDomainData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "23";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.BrandingDomainData.PATH, this, parameters, headers, null);
};

/**
 * Updates this service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.BrandingDomainData.prototype.update = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "23";
  return tutao.locator.entityRestClient.putService(tutao.entity.sys.BrandingDomainData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.BrandingDomainData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
