"use strict";

tutao.provide('tutao.entity.tutanota.ContactFormAccountReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormAccountReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._requestMailAddress = null;
    this._responseMailAddress = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.ContactFormAccountReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormAccountReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._requestMailAddress = data.requestMailAddress;
  this._responseMailAddress = data.responseMailAddress;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.ContactFormAccountReturn.MODEL_VERSION = '21';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.ContactFormAccountReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactFormAccountReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    requestMailAddress: this._requestMailAddress, 
    responseMailAddress: this._responseMailAddress
  };
};

/**
 * Sets the format of this ContactFormAccountReturn.
 * @param {string} format The format of this ContactFormAccountReturn.
 */
tutao.entity.tutanota.ContactFormAccountReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ContactFormAccountReturn.
 * @return {string} The format of this ContactFormAccountReturn.
 */
tutao.entity.tutanota.ContactFormAccountReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the requestMailAddress of this ContactFormAccountReturn.
 * @param {string} requestMailAddress The requestMailAddress of this ContactFormAccountReturn.
 */
tutao.entity.tutanota.ContactFormAccountReturn.prototype.setRequestMailAddress = function(requestMailAddress) {
  this._requestMailAddress = requestMailAddress;
  return this;
};

/**
 * Provides the requestMailAddress of this ContactFormAccountReturn.
 * @return {string} The requestMailAddress of this ContactFormAccountReturn.
 */
tutao.entity.tutanota.ContactFormAccountReturn.prototype.getRequestMailAddress = function() {
  return this._requestMailAddress;
};

/**
 * Sets the responseMailAddress of this ContactFormAccountReturn.
 * @param {string} responseMailAddress The responseMailAddress of this ContactFormAccountReturn.
 */
tutao.entity.tutanota.ContactFormAccountReturn.prototype.setResponseMailAddress = function(responseMailAddress) {
  this._responseMailAddress = responseMailAddress;
  return this;
};

/**
 * Provides the responseMailAddress of this ContactFormAccountReturn.
 * @return {string} The responseMailAddress of this ContactFormAccountReturn.
 */
tutao.entity.tutanota.ContactFormAccountReturn.prototype.getResponseMailAddress = function() {
  return this._responseMailAddress;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ContactFormAccountReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
