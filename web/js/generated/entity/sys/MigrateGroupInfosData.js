"use strict";

tutao.provide('tutao.entity.sys.MigrateGroupInfosData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MigrateGroupInfosData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._groupInfos = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.MigrateGroupInfosData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MigrateGroupInfosData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._groupInfos = [];
  for (var i=0; i < data.groupInfos.length; i++) {
    this._groupInfos.push(new tutao.entity.sys.MigratedGroupInfoData(this, data.groupInfos[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.MigrateGroupInfosData.MODEL_VERSION = '22';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.MigrateGroupInfosData.PATH = '/rest/sys/migrategroupinfosservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.MigrateGroupInfosData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.MigrateGroupInfosData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    groupInfos: tutao.entity.EntityHelper.aggregatesToJsonData(this._groupInfos)
  };
};

/**
 * Sets the format of this MigrateGroupInfosData.
 * @param {string} format The format of this MigrateGroupInfosData.
 */
tutao.entity.sys.MigrateGroupInfosData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MigrateGroupInfosData.
 * @return {string} The format of this MigrateGroupInfosData.
 */
tutao.entity.sys.MigrateGroupInfosData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Provides the groupInfos of this MigrateGroupInfosData.
 * @return {Array.<tutao.entity.sys.MigratedGroupInfoData>} The groupInfos of this MigrateGroupInfosData.
 */
tutao.entity.sys.MigrateGroupInfosData.prototype.getGroupInfos = function() {
  return this._groupInfos;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.MigrateGroupInfosData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "22";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.MigrateGroupInfosData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.MigrateGroupInfosData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
