"use strict";

tutao.provide('tutao.entity.sys.SmsMonitorTriggerData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SmsMonitorTriggerData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._networkOperatorIds = null;
    this._smsFacadeIds = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SmsMonitorTriggerData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._networkOperatorIds = data.networkOperatorIds;
  this._smsFacadeIds = data.smsFacadeIds;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SmsMonitorTriggerData.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.SmsMonitorTriggerData.PATH = '/rest/sys/smsmonitortriggerservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    networkOperatorIds: this._networkOperatorIds, 
    smsFacadeIds: this._smsFacadeIds
  };
};

/**
 * The id of the SmsMonitorTriggerData type.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.TYPE_ID = 497;

/**
 * The id of the networkOperatorIds attribute.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.NETWORKOPERATORIDS_ATTRIBUTE_ID = 500;

/**
 * The id of the smsFacadeIds attribute.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.SMSFACADEIDS_ATTRIBUTE_ID = 499;

/**
 * Sets the format of this SmsMonitorTriggerData.
 * @param {string} format The format of this SmsMonitorTriggerData.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SmsMonitorTriggerData.
 * @return {string} The format of this SmsMonitorTriggerData.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the networkOperatorIds of this SmsMonitorTriggerData.
 * @param {string} networkOperatorIds The networkOperatorIds of this SmsMonitorTriggerData.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.setNetworkOperatorIds = function(networkOperatorIds) {
  this._networkOperatorIds = networkOperatorIds;
  return this;
};

/**
 * Provides the networkOperatorIds of this SmsMonitorTriggerData.
 * @return {string} The networkOperatorIds of this SmsMonitorTriggerData.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.getNetworkOperatorIds = function() {
  return this._networkOperatorIds;
};

/**
 * Sets the smsFacadeIds of this SmsMonitorTriggerData.
 * @param {string} smsFacadeIds The smsFacadeIds of this SmsMonitorTriggerData.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.setSmsFacadeIds = function(smsFacadeIds) {
  this._smsFacadeIds = smsFacadeIds;
  return this;
};

/**
 * Provides the smsFacadeIds of this SmsMonitorTriggerData.
 * @return {string} The smsFacadeIds of this SmsMonitorTriggerData.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.getSmsFacadeIds = function() {
  return this._smsFacadeIds;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.SmsMonitorTriggerData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.SmsMonitorTriggerData.PATH, this, parameters, headers, null);
};
