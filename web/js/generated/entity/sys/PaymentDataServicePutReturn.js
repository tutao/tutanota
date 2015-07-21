"use strict";

tutao.provide('tutao.entity.sys.PaymentDataServicePutReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PaymentDataServicePutReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._result = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PaymentDataServicePutReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PaymentDataServicePutReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._result = data.result;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PaymentDataServicePutReturn.MODEL_VERSION = '9';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PaymentDataServicePutReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PaymentDataServicePutReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    result: this._result
  };
};

/**
 * The id of the PaymentDataServicePutReturn type.
 */
tutao.entity.sys.PaymentDataServicePutReturn.prototype.TYPE_ID = 802;

/**
 * The id of the result attribute.
 */
tutao.entity.sys.PaymentDataServicePutReturn.prototype.RESULT_ATTRIBUTE_ID = 804;

/**
 * Sets the format of this PaymentDataServicePutReturn.
 * @param {string} format The format of this PaymentDataServicePutReturn.
 */
tutao.entity.sys.PaymentDataServicePutReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PaymentDataServicePutReturn.
 * @return {string} The format of this PaymentDataServicePutReturn.
 */
tutao.entity.sys.PaymentDataServicePutReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the result of this PaymentDataServicePutReturn.
 * @param {string} result The result of this PaymentDataServicePutReturn.
 */
tutao.entity.sys.PaymentDataServicePutReturn.prototype.setResult = function(result) {
  this._result = result;
  return this;
};

/**
 * Provides the result of this PaymentDataServicePutReturn.
 * @return {string} The result of this PaymentDataServicePutReturn.
 */
tutao.entity.sys.PaymentDataServicePutReturn.prototype.getResult = function() {
  return this._result;
};
