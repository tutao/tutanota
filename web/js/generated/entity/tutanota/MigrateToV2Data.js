"use strict";

tutao.provide('tutao.entity.tutanota.MigrateToV2Data');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MigrateToV2Data = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._noop = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.MigrateToV2Data.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MigrateToV2Data.prototype.updateData = function(data) {
  this.__format = data._format;
  this._noop = data.noop;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.MigrateToV2Data.MODEL_VERSION = '8';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.MigrateToV2Data.PATH = '/rest/tutanota/migratetov2service';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.MigrateToV2Data.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MigrateToV2Data.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    noop: this._noop
  };
};

/**
 * The id of the MigrateToV2Data type.
 */
tutao.entity.tutanota.MigrateToV2Data.prototype.TYPE_ID = 413;

/**
 * The id of the noop attribute.
 */
tutao.entity.tutanota.MigrateToV2Data.prototype.NOOP_ATTRIBUTE_ID = 415;

/**
 * Sets the format of this MigrateToV2Data.
 * @param {string} format The format of this MigrateToV2Data.
 */
tutao.entity.tutanota.MigrateToV2Data.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MigrateToV2Data.
 * @return {string} The format of this MigrateToV2Data.
 */
tutao.entity.tutanota.MigrateToV2Data.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the noop of this MigrateToV2Data.
 * @param {boolean} noop The noop of this MigrateToV2Data.
 */
tutao.entity.tutanota.MigrateToV2Data.prototype.setNoop = function(noop) {
  this._noop = noop ? '1' : '0';
  return this;
};

/**
 * Provides the noop of this MigrateToV2Data.
 * @return {boolean} The noop of this MigrateToV2Data.
 */
tutao.entity.tutanota.MigrateToV2Data.prototype.getNoop = function() {
  return this._noop == '1';
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.MigrateToV2Data.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 8;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.MigrateToV2Data.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MigrateToV2Data.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
