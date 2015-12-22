"use strict";

tutao.provide('tutao.entity.sys.DomainMailAddressAvailabilityData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DomainMailAddressAvailabilityData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._mailAddress = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.DomainMailAddressAvailabilityData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DomainMailAddressAvailabilityData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._mailAddress = data.mailAddress;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.DomainMailAddressAvailabilityData.MODEL_VERSION = '15';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.DomainMailAddressAvailabilityData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.DomainMailAddressAvailabilityData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    mailAddress: this._mailAddress
  };
};

/**
 * The id of the DomainMailAddressAvailabilityData type.
 */
tutao.entity.sys.DomainMailAddressAvailabilityData.prototype.TYPE_ID = 599;

/**
 * The id of the mailAddress attribute.
 */
tutao.entity.sys.DomainMailAddressAvailabilityData.prototype.MAILADDRESS_ATTRIBUTE_ID = 601;

/**
 * Sets the format of this DomainMailAddressAvailabilityData.
 * @param {string} format The format of this DomainMailAddressAvailabilityData.
 */
tutao.entity.sys.DomainMailAddressAvailabilityData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DomainMailAddressAvailabilityData.
 * @return {string} The format of this DomainMailAddressAvailabilityData.
 */
tutao.entity.sys.DomainMailAddressAvailabilityData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the mailAddress of this DomainMailAddressAvailabilityData.
 * @param {string} mailAddress The mailAddress of this DomainMailAddressAvailabilityData.
 */
tutao.entity.sys.DomainMailAddressAvailabilityData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this DomainMailAddressAvailabilityData.
 * @return {string} The mailAddress of this DomainMailAddressAvailabilityData.
 */
tutao.entity.sys.DomainMailAddressAvailabilityData.prototype.getMailAddress = function() {
  return this._mailAddress;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.DomainMailAddressAvailabilityData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
