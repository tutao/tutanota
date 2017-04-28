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
    this._catchAllUserGroup = null;
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
  this._catchAllUserGroup = data.catchAllUserGroup;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CustomDomainData.MODEL_VERSION = '21';

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
    domain: this._domain, 
    catchAllUserGroup: this._catchAllUserGroup
  };
};

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
 * Sets the catchAllUserGroup of this CustomDomainData.
 * @param {string} catchAllUserGroup The catchAllUserGroup of this CustomDomainData.
 */
tutao.entity.sys.CustomDomainData.prototype.setCatchAllUserGroup = function(catchAllUserGroup) {
  this._catchAllUserGroup = catchAllUserGroup;
  return this;
};

/**
 * Provides the catchAllUserGroup of this CustomDomainData.
 * @return {string} The catchAllUserGroup of this CustomDomainData.
 */
tutao.entity.sys.CustomDomainData.prototype.getCatchAllUserGroup = function() {
  return this._catchAllUserGroup;
};

/**
 * Loads the catchAllUserGroup of this CustomDomainData.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded catchAllUserGroup of this CustomDomainData or an exception if the loading failed.
 */
tutao.entity.sys.CustomDomainData.prototype.loadCatchAllUserGroup = function() {
  return tutao.entity.sys.Group.load(this._catchAllUserGroup);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.CustomDomainReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.CustomDomainData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.CustomDomainData.PATH, this, parameters, headers, tutao.entity.sys.CustomDomainReturn);
};

/**
 * Updates this service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.CustomDomainData.prototype.update = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  return tutao.locator.entityRestClient.putService(tutao.entity.sys.CustomDomainData.PATH, this, parameters, headers, null);
};

/**
 * Invokes DELETE on a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.CustomDomainData>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.CustomDomainData.prototype.erase = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.deleteService(tutao.entity.sys.CustomDomainData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CustomDomainData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
