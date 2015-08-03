"use strict";

tutao.provide('tutao.entity.sys.SmsMonitorReceiverData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SmsMonitorReceiverData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SmsMonitorReceiverData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SmsMonitorReceiverData.prototype.updateData = function(data) {
  this.__format = data._format;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SmsMonitorReceiverData.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.SmsMonitorReceiverData.PATH = '/rest/sys/smsmonitorreceiverservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SmsMonitorReceiverData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SmsMonitorReceiverData.prototype.toJsonData = function() {
  return {
    _format: this.__format
  };
};

/**
 * The id of the SmsMonitorReceiverData type.
 */
tutao.entity.sys.SmsMonitorReceiverData.prototype.TYPE_ID = 502;

/**
 * Sets the format of this SmsMonitorReceiverData.
 * @param {string} format The format of this SmsMonitorReceiverData.
 */
tutao.entity.sys.SmsMonitorReceiverData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SmsMonitorReceiverData.
 * @return {string} The format of this SmsMonitorReceiverData.
 */
tutao.entity.sys.SmsMonitorReceiverData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.SmsMonitorReceiverData>} Resolves to SmsMonitorReceiverData or an exception if the loading failed.
 */
tutao.entity.sys.SmsMonitorReceiverData.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.SmsMonitorReceiverData, tutao.entity.sys.SmsMonitorReceiverData.PATH, null, null, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.SmsMonitorReceiverData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
