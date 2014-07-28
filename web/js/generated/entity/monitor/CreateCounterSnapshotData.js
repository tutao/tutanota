"use strict";

goog.provide('tutao.entity.monitor.CreateCounterSnapshotData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.monitor.CreateCounterSnapshotData = function(data) {
  if (data) {
    this.__format = data._format;
    this._monitors = [];
    for (var i=0; i < data.monitors.length; i++) {
      this._monitors.push(new tutao.entity.monitor.CreateCounterMonitor(this, data.monitors[i]));
    }
  } else {
    this.__format = "0";
    this._monitors = [];
  };
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.monitor.CreateCounterSnapshotData.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.monitor.CreateCounterSnapshotData.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.monitor.CreateCounterSnapshotData.PATH = '/rest/monitor/createcountersnapshotservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.monitor.CreateCounterSnapshotData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.monitor.CreateCounterSnapshotData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    monitors: tutao.entity.EntityHelper.aggregatesToJsonData(this._monitors)
  };
};

/**
 * The id of the CreateCounterSnapshotData type.
 */
tutao.entity.monitor.CreateCounterSnapshotData.prototype.TYPE_ID = 23;

/**
 * The id of the monitors attribute.
 */
tutao.entity.monitor.CreateCounterSnapshotData.prototype.MONITORS_ATTRIBUTE_ID = 25;

/**
 * Sets the format of this CreateCounterSnapshotData.
 * @param {string} format The format of this CreateCounterSnapshotData.
 */
tutao.entity.monitor.CreateCounterSnapshotData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateCounterSnapshotData.
 * @return {string} The format of this CreateCounterSnapshotData.
 */
tutao.entity.monitor.CreateCounterSnapshotData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Provides the monitors of this CreateCounterSnapshotData.
 * @return {Array.<tutao.entity.monitor.CreateCounterMonitor>} The monitors of this CreateCounterSnapshotData.
 */
tutao.entity.monitor.CreateCounterSnapshotData.prototype.getMonitors = function() {
  return this._monitors;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.monitor.CreateCounterSnapshotData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 1;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.monitor.CreateCounterSnapshotData.PATH, this, parameters, headers, null);
};
