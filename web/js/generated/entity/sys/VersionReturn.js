"use strict";

tutao.provide('tutao.entity.sys.VersionReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.VersionReturn = function(data) {
  if (data) {
    this.__format = data._format;
    this._versions = [];
    for (var i=0; i < data.versions.length; i++) {
      this._versions.push(new tutao.entity.sys.Version(this, data.versions[i]));
    }
  } else {
    this.__format = "0";
    this._versions = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.VersionReturn.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.VersionReturn.MODEL_VERSION = '7';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.VersionReturn.PATH = '/rest/sys/versionservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.VersionReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.VersionReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    versions: tutao.entity.EntityHelper.aggregatesToJsonData(this._versions)
  };
};

/**
 * The id of the VersionReturn type.
 */
tutao.entity.sys.VersionReturn.prototype.TYPE_ID = 493;

/**
 * The id of the versions attribute.
 */
tutao.entity.sys.VersionReturn.prototype.VERSIONS_ATTRIBUTE_ID = 495;

/**
 * Sets the format of this VersionReturn.
 * @param {string} format The format of this VersionReturn.
 */
tutao.entity.sys.VersionReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this VersionReturn.
 * @return {string} The format of this VersionReturn.
 */
tutao.entity.sys.VersionReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Provides the versions of this VersionReturn.
 * @return {Array.<tutao.entity.sys.Version>} The versions of this VersionReturn.
 */
tutao.entity.sys.VersionReturn.prototype.getVersions = function() {
  return this._versions;
};

/**
 * Loads from the service.
 * @param {tutao.entity.sys.VersionData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.VersionReturn>} Resolves to VersionReturn or an exception if the loading failed.
 */
tutao.entity.sys.VersionReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 7;
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.VersionReturn, tutao.entity.sys.VersionReturn.PATH, entity, parameters, headers);
};
