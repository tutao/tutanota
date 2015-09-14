"use strict";

tutao.provide('tutao.entity.sys.PhoneNumberTypeData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PhoneNumberTypeData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._phoneNumber = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PhoneNumberTypeData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PhoneNumberTypeData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._phoneNumber = data.phoneNumber;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PhoneNumberTypeData.MODEL_VERSION = '10';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PhoneNumberTypeData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PhoneNumberTypeData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    phoneNumber: this._phoneNumber
  };
};

/**
 * The id of the PhoneNumberTypeData type.
 */
tutao.entity.sys.PhoneNumberTypeData.prototype.TYPE_ID = 617;

/**
 * The id of the phoneNumber attribute.
 */
tutao.entity.sys.PhoneNumberTypeData.prototype.PHONENUMBER_ATTRIBUTE_ID = 619;

/**
 * Sets the format of this PhoneNumberTypeData.
 * @param {string} format The format of this PhoneNumberTypeData.
 */
tutao.entity.sys.PhoneNumberTypeData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PhoneNumberTypeData.
 * @return {string} The format of this PhoneNumberTypeData.
 */
tutao.entity.sys.PhoneNumberTypeData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the phoneNumber of this PhoneNumberTypeData.
 * @param {string} phoneNumber The phoneNumber of this PhoneNumberTypeData.
 */
tutao.entity.sys.PhoneNumberTypeData.prototype.setPhoneNumber = function(phoneNumber) {
  this._phoneNumber = phoneNumber;
  return this;
};

/**
 * Provides the phoneNumber of this PhoneNumberTypeData.
 * @return {string} The phoneNumber of this PhoneNumberTypeData.
 */
tutao.entity.sys.PhoneNumberTypeData.prototype.getPhoneNumber = function() {
  return this._phoneNumber;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PhoneNumberTypeData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
