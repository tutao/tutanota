"use strict";

tutao.provide('tutao.entity.tutanota.MigrateToV7Data');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MigrateToV7Data = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._noop = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.MigrateToV7Data.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MigrateToV7Data.prototype.updateData = function(data) {
  this.__format = data._format;
  this._noop = data.noop;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.MigrateToV7Data.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.MigrateToV7Data.PATH = '/rest/tutanota/migratetov7service';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.MigrateToV7Data.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MigrateToV7Data.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    noop: this._noop
  };
};

/**
 * The id of the MigrateToV7Data type.
 */
tutao.entity.tutanota.MigrateToV7Data.prototype.TYPE_ID = 462;

/**
 * The id of the noop attribute.
 */
tutao.entity.tutanota.MigrateToV7Data.prototype.NOOP_ATTRIBUTE_ID = 464;

/**
 * Sets the format of this MigrateToV7Data.
 * @param {string} format The format of this MigrateToV7Data.
 */
tutao.entity.tutanota.MigrateToV7Data.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MigrateToV7Data.
 * @return {string} The format of this MigrateToV7Data.
 */
tutao.entity.tutanota.MigrateToV7Data.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the noop of this MigrateToV7Data.
 * @param {boolean} noop The noop of this MigrateToV7Data.
 */
tutao.entity.tutanota.MigrateToV7Data.prototype.setNoop = function(noop) {
  this._noop = noop ? '1' : '0';
  return this;
};

/**
 * Provides the noop of this MigrateToV7Data.
 * @return {boolean} The noop of this MigrateToV7Data.
 */
tutao.entity.tutanota.MigrateToV7Data.prototype.getNoop = function() {
  return this._noop != '0';
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.MigrateToV7Data.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.MigrateToV7Data.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MigrateToV7Data.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
