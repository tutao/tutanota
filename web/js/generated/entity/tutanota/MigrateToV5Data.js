"use strict";

tutao.provide('tutao.entity.tutanota.MigrateToV5Data');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MigrateToV5Data = function(data) {
  if (data) {
    this.__format = data._format;
    this._noop = data.noop;
  } else {
    this.__format = "0";
    this._noop = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.MigrateToV5Data.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.MigrateToV5Data.MODEL_VERSION = '6';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.MigrateToV5Data.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MigrateToV5Data.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    noop: this._noop
  };
};

/**
 * The id of the MigrateToV5Data type.
 */
tutao.entity.tutanota.MigrateToV5Data.prototype.TYPE_ID = 422;

/**
 * The id of the noop attribute.
 */
tutao.entity.tutanota.MigrateToV5Data.prototype.NOOP_ATTRIBUTE_ID = 424;

/**
 * Sets the format of this MigrateToV5Data.
 * @param {string} format The format of this MigrateToV5Data.
 */
tutao.entity.tutanota.MigrateToV5Data.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MigrateToV5Data.
 * @return {string} The format of this MigrateToV5Data.
 */
tutao.entity.tutanota.MigrateToV5Data.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the noop of this MigrateToV5Data.
 * @param {boolean} noop The noop of this MigrateToV5Data.
 */
tutao.entity.tutanota.MigrateToV5Data.prototype.setNoop = function(noop) {
  this._noop = noop ? '1' : '0';
  return this;
};

/**
 * Provides the noop of this MigrateToV5Data.
 * @return {boolean} The noop of this MigrateToV5Data.
 */
tutao.entity.tutanota.MigrateToV5Data.prototype.getNoop = function() {
  return this._noop == '1';
};
