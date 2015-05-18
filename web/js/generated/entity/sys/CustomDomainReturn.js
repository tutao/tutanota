"use strict";

tutao.provide('tutao.entity.sys.CustomDomainReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomDomainReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._statusCode = null;
    this._invalidDnsRecords = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CustomDomainReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomDomainReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._statusCode = data.statusCode;
  this._invalidDnsRecords = [];
  for (var i=0; i < data.invalidDnsRecords.length; i++) {
    this._invalidDnsRecords.push(new tutao.entity.sys.StringWrapper(this, data.invalidDnsRecords[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CustomDomainReturn.MODEL_VERSION = '9';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CustomDomainReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CustomDomainReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    statusCode: this._statusCode, 
    invalidDnsRecords: tutao.entity.EntityHelper.aggregatesToJsonData(this._invalidDnsRecords)
  };
};

/**
 * The id of the CustomDomainReturn type.
 */
tutao.entity.sys.CustomDomainReturn.prototype.TYPE_ID = 729;

/**
 * The id of the statusCode attribute.
 */
tutao.entity.sys.CustomDomainReturn.prototype.STATUSCODE_ATTRIBUTE_ID = 731;

/**
 * The id of the invalidDnsRecords attribute.
 */
tutao.entity.sys.CustomDomainReturn.prototype.INVALIDDNSRECORDS_ATTRIBUTE_ID = 732;

/**
 * Sets the format of this CustomDomainReturn.
 * @param {string} format The format of this CustomDomainReturn.
 */
tutao.entity.sys.CustomDomainReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CustomDomainReturn.
 * @return {string} The format of this CustomDomainReturn.
 */
tutao.entity.sys.CustomDomainReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the statusCode of this CustomDomainReturn.
 * @param {string} statusCode The statusCode of this CustomDomainReturn.
 */
tutao.entity.sys.CustomDomainReturn.prototype.setStatusCode = function(statusCode) {
  this._statusCode = statusCode;
  return this;
};

/**
 * Provides the statusCode of this CustomDomainReturn.
 * @return {string} The statusCode of this CustomDomainReturn.
 */
tutao.entity.sys.CustomDomainReturn.prototype.getStatusCode = function() {
  return this._statusCode;
};

/**
 * Provides the invalidDnsRecords of this CustomDomainReturn.
 * @return {Array.<tutao.entity.sys.StringWrapper>} The invalidDnsRecords of this CustomDomainReturn.
 */
tutao.entity.sys.CustomDomainReturn.prototype.getInvalidDnsRecords = function() {
  return this._invalidDnsRecords;
};
