"use strict";

tutao.provide('tutao.entity.sys.MigrateToV6Data');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MigrateToV6Data = function(data) {
  if (data) {
    this.__format = data._format;
    this._noop = data.noop;
  } else {
    this.__format = "0";
    this._noop = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.MigrateToV6Data.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.MigrateToV6Data.MODEL_VERSION = '6';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.MigrateToV6Data.PATH = '/rest/sys/migratetov6service';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.MigrateToV6Data.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.MigrateToV6Data.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    noop: this._noop
  };
};

/**
 * The id of the MigrateToV6Data type.
 */
tutao.entity.sys.MigrateToV6Data.prototype.TYPE_ID = 668;

/**
 * The id of the noop attribute.
 */
tutao.entity.sys.MigrateToV6Data.prototype.NOOP_ATTRIBUTE_ID = 670;

/**
 * Sets the format of this MigrateToV6Data.
 * @param {string} format The format of this MigrateToV6Data.
 */
tutao.entity.sys.MigrateToV6Data.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MigrateToV6Data.
 * @return {string} The format of this MigrateToV6Data.
 */
tutao.entity.sys.MigrateToV6Data.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the noop of this MigrateToV6Data.
 * @param {boolean} noop The noop of this MigrateToV6Data.
 */
tutao.entity.sys.MigrateToV6Data.prototype.setNoop = function(noop) {
  this._noop = noop ? '1' : '0';
  return this;
};

/**
 * Provides the noop of this MigrateToV6Data.
 * @return {boolean} The noop of this MigrateToV6Data.
 */
tutao.entity.sys.MigrateToV6Data.prototype.getNoop = function() {
  return this._noop == '1';
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.MigrateToV6Data.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 6;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.MigrateToV6Data.PATH, this, parameters, headers, null);
};
