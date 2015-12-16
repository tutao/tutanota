"use strict";

tutao.provide('tutao.entity.sys.CustomerInfoReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerInfoReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._sendMailDisabled = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CustomerInfoReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerInfoReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._sendMailDisabled = data.sendMailDisabled;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CustomerInfoReturn.MODEL_VERSION = '15';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.CustomerInfoReturn.PATH = '/rest/sys/customerinfoservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CustomerInfoReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CustomerInfoReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    sendMailDisabled: this._sendMailDisabled
  };
};

/**
 * The id of the CustomerInfoReturn type.
 */
tutao.entity.sys.CustomerInfoReturn.prototype.TYPE_ID = 550;

/**
 * The id of the sendMailDisabled attribute.
 */
tutao.entity.sys.CustomerInfoReturn.prototype.SENDMAILDISABLED_ATTRIBUTE_ID = 552;

/**
 * Sets the format of this CustomerInfoReturn.
 * @param {string} format The format of this CustomerInfoReturn.
 */
tutao.entity.sys.CustomerInfoReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CustomerInfoReturn.
 * @return {string} The format of this CustomerInfoReturn.
 */
tutao.entity.sys.CustomerInfoReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the sendMailDisabled of this CustomerInfoReturn.
 * @param {boolean} sendMailDisabled The sendMailDisabled of this CustomerInfoReturn.
 */
tutao.entity.sys.CustomerInfoReturn.prototype.setSendMailDisabled = function(sendMailDisabled) {
  this._sendMailDisabled = sendMailDisabled ? '1' : '0';
  return this;
};

/**
 * Provides the sendMailDisabled of this CustomerInfoReturn.
 * @return {boolean} The sendMailDisabled of this CustomerInfoReturn.
 */
tutao.entity.sys.CustomerInfoReturn.prototype.getSendMailDisabled = function() {
  return this._sendMailDisabled != '0';
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.CustomerInfoReturn>} Resolves to CustomerInfoReturn or an exception if the loading failed.
 */
tutao.entity.sys.CustomerInfoReturn.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 15;
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.CustomerInfoReturn, tutao.entity.sys.CustomerInfoReturn.PATH, null, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CustomerInfoReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
