"use strict";

tutao.provide('tutao.entity.sys.CreateCustomerServerPropertiesData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CreateCustomerServerPropertiesData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._adminGroupEncSessionKey = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CreateCustomerServerPropertiesData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._adminGroupEncSessionKey = data.adminGroupEncSessionKey;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.MODEL_VERSION = '14';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.PATH = '/rest/sys/createcustomerserverproperties';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    adminGroupEncSessionKey: this._adminGroupEncSessionKey
  };
};

/**
 * The id of the CreateCustomerServerPropertiesData type.
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.prototype.TYPE_ID = 961;

/**
 * The id of the adminGroupEncSessionKey attribute.
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.prototype.ADMINGROUPENCSESSIONKEY_ATTRIBUTE_ID = 963;

/**
 * Sets the format of this CreateCustomerServerPropertiesData.
 * @param {string} format The format of this CreateCustomerServerPropertiesData.
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateCustomerServerPropertiesData.
 * @return {string} The format of this CreateCustomerServerPropertiesData.
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the adminGroupEncSessionKey of this CreateCustomerServerPropertiesData.
 * @param {string} adminGroupEncSessionKey The adminGroupEncSessionKey of this CreateCustomerServerPropertiesData.
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.prototype.setAdminGroupEncSessionKey = function(adminGroupEncSessionKey) {
  this._adminGroupEncSessionKey = adminGroupEncSessionKey;
  return this;
};

/**
 * Provides the adminGroupEncSessionKey of this CreateCustomerServerPropertiesData.
 * @return {string} The adminGroupEncSessionKey of this CreateCustomerServerPropertiesData.
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.prototype.getAdminGroupEncSessionKey = function() {
  return this._adminGroupEncSessionKey;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.CreateCustomerServerPropertiesReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 14;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.CreateCustomerServerPropertiesData.PATH, this, parameters, headers, tutao.entity.sys.CreateCustomerServerPropertiesReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CreateCustomerServerPropertiesData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
