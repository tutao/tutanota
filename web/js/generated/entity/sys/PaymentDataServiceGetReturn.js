"use strict";

tutao.provide('tutao.entity.sys.PaymentDataServiceGetReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PaymentDataServiceGetReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._clientToken = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PaymentDataServiceGetReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PaymentDataServiceGetReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._clientToken = data.clientToken;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PaymentDataServiceGetReturn.MODEL_VERSION = '10';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.PaymentDataServiceGetReturn.PATH = '/rest/sys/paymentdataservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PaymentDataServiceGetReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PaymentDataServiceGetReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    clientToken: this._clientToken
  };
};

/**
 * The id of the PaymentDataServiceGetReturn type.
 */
tutao.entity.sys.PaymentDataServiceGetReturn.prototype.TYPE_ID = 790;

/**
 * The id of the clientToken attribute.
 */
tutao.entity.sys.PaymentDataServiceGetReturn.prototype.CLIENTTOKEN_ATTRIBUTE_ID = 792;

/**
 * Sets the format of this PaymentDataServiceGetReturn.
 * @param {string} format The format of this PaymentDataServiceGetReturn.
 */
tutao.entity.sys.PaymentDataServiceGetReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PaymentDataServiceGetReturn.
 * @return {string} The format of this PaymentDataServiceGetReturn.
 */
tutao.entity.sys.PaymentDataServiceGetReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the clientToken of this PaymentDataServiceGetReturn.
 * @param {string} clientToken The clientToken of this PaymentDataServiceGetReturn.
 */
tutao.entity.sys.PaymentDataServiceGetReturn.prototype.setClientToken = function(clientToken) {
  this._clientToken = clientToken;
  return this;
};

/**
 * Provides the clientToken of this PaymentDataServiceGetReturn.
 * @return {string} The clientToken of this PaymentDataServiceGetReturn.
 */
tutao.entity.sys.PaymentDataServiceGetReturn.prototype.getClientToken = function() {
  return this._clientToken;
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.PaymentDataServiceGetReturn>} Resolves to PaymentDataServiceGetReturn or an exception if the loading failed.
 */
tutao.entity.sys.PaymentDataServiceGetReturn.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 10;
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.PaymentDataServiceGetReturn, tutao.entity.sys.PaymentDataServiceGetReturn.PATH, null, null, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PaymentDataServiceGetReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
