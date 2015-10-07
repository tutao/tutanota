"use strict";

tutao.provide('tutao.entity.sys.ConfigDataReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ConfigDataReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._longValues = [];
    this._stringValues = [];
    this._timeRangeLists = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.ConfigDataReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ConfigDataReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._longValues = [];
  for (var i=0; i < data.longValues.length; i++) {
    this._longValues.push(new tutao.entity.sys.LongConfigValue(this, data.longValues[i]));
  }
  this._stringValues = [];
  for (var i=0; i < data.stringValues.length; i++) {
    this._stringValues.push(new tutao.entity.sys.StringConfigValue(this, data.stringValues[i]));
  }
  this._timeRangeLists = [];
  for (var i=0; i < data.timeRangeLists.length; i++) {
    this._timeRangeLists.push(new tutao.entity.sys.TimeRangeListConfigValue(this, data.timeRangeLists[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.ConfigDataReturn.MODEL_VERSION = '11';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.ConfigDataReturn.PATH = '/rest/sys/configservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.ConfigDataReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.ConfigDataReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    longValues: tutao.entity.EntityHelper.aggregatesToJsonData(this._longValues), 
    stringValues: tutao.entity.EntityHelper.aggregatesToJsonData(this._stringValues), 
    timeRangeLists: tutao.entity.EntityHelper.aggregatesToJsonData(this._timeRangeLists)
  };
};

/**
 * The id of the ConfigDataReturn type.
 */
tutao.entity.sys.ConfigDataReturn.prototype.TYPE_ID = 528;

/**
 * The id of the longValues attribute.
 */
tutao.entity.sys.ConfigDataReturn.prototype.LONGVALUES_ATTRIBUTE_ID = 530;

/**
 * The id of the stringValues attribute.
 */
tutao.entity.sys.ConfigDataReturn.prototype.STRINGVALUES_ATTRIBUTE_ID = 531;

/**
 * The id of the timeRangeLists attribute.
 */
tutao.entity.sys.ConfigDataReturn.prototype.TIMERANGELISTS_ATTRIBUTE_ID = 532;

/**
 * Sets the format of this ConfigDataReturn.
 * @param {string} format The format of this ConfigDataReturn.
 */
tutao.entity.sys.ConfigDataReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ConfigDataReturn.
 * @return {string} The format of this ConfigDataReturn.
 */
tutao.entity.sys.ConfigDataReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Provides the longValues of this ConfigDataReturn.
 * @return {Array.<tutao.entity.sys.LongConfigValue>} The longValues of this ConfigDataReturn.
 */
tutao.entity.sys.ConfigDataReturn.prototype.getLongValues = function() {
  return this._longValues;
};

/**
 * Provides the stringValues of this ConfigDataReturn.
 * @return {Array.<tutao.entity.sys.StringConfigValue>} The stringValues of this ConfigDataReturn.
 */
tutao.entity.sys.ConfigDataReturn.prototype.getStringValues = function() {
  return this._stringValues;
};

/**
 * Provides the timeRangeLists of this ConfigDataReturn.
 * @return {Array.<tutao.entity.sys.TimeRangeListConfigValue>} The timeRangeLists of this ConfigDataReturn.
 */
tutao.entity.sys.ConfigDataReturn.prototype.getTimeRangeLists = function() {
  return this._timeRangeLists;
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.ConfigDataReturn>} Resolves to ConfigDataReturn or an exception if the loading failed.
 */
tutao.entity.sys.ConfigDataReturn.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 11;
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.ConfigDataReturn, tutao.entity.sys.ConfigDataReturn.PATH, null, null, parameters, headers);
};

/**
 * Updates this service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.ConfigDataReturn.prototype.update = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 11;
  return tutao.locator.entityRestClient.putService(tutao.entity.sys.ConfigDataReturn.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.ConfigDataReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
