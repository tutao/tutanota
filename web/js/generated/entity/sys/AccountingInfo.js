"use strict";

tutao.provide('tutao.entity.sys.AccountingInfo');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AccountingInfo = function(data) {
  if (data) {
    this.__format = data._format;
    this.__id = data._id;
    this.__permissions = data._permissions;
    this._lastInvoiceNbrOfSentSms = data.lastInvoiceNbrOfSentSms;
    this._lastInvoiceTimestamp = data.lastInvoiceTimestamp;
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._lastInvoiceNbrOfSentSms = null;
    this._lastInvoiceTimestamp = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.AccountingInfo.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.AccountingInfo.MODEL_VERSION = '5';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.AccountingInfo.PATH = '/rest/sys/accountinginfo';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.AccountingInfo.ROOT_INSTANCE_ID = 'A3N5cwAAjw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.AccountingInfo.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.AccountingInfo.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.AccountingInfo.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    lastInvoiceNbrOfSentSms: this._lastInvoiceNbrOfSentSms, 
    lastInvoiceTimestamp: this._lastInvoiceTimestamp
  };
};

/**
 * The id of the AccountingInfo type.
 */
tutao.entity.sys.AccountingInfo.prototype.TYPE_ID = 143;

/**
 * The id of the lastInvoiceNbrOfSentSms attribute.
 */
tutao.entity.sys.AccountingInfo.prototype.LASTINVOICENBROFSENTSMS_ATTRIBUTE_ID = 593;

/**
 * The id of the lastInvoiceTimestamp attribute.
 */
tutao.entity.sys.AccountingInfo.prototype.LASTINVOICETIMESTAMP_ATTRIBUTE_ID = 592;

/**
 * Provides the id of this AccountingInfo.
 * @return {string} The id of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this AccountingInfo.
 * @param {string} format The format of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this AccountingInfo.
 * @return {string} The format of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this AccountingInfo.
 * @param {string} permissions The permissions of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this AccountingInfo.
 * @return {string} The permissions of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the lastInvoiceNbrOfSentSms of this AccountingInfo.
 * @param {string} lastInvoiceNbrOfSentSms The lastInvoiceNbrOfSentSms of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setLastInvoiceNbrOfSentSms = function(lastInvoiceNbrOfSentSms) {
  this._lastInvoiceNbrOfSentSms = lastInvoiceNbrOfSentSms;
  return this;
};

/**
 * Provides the lastInvoiceNbrOfSentSms of this AccountingInfo.
 * @return {string} The lastInvoiceNbrOfSentSms of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getLastInvoiceNbrOfSentSms = function() {
  return this._lastInvoiceNbrOfSentSms;
};

/**
 * Sets the lastInvoiceTimestamp of this AccountingInfo.
 * @param {Date} lastInvoiceTimestamp The lastInvoiceTimestamp of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setLastInvoiceTimestamp = function(lastInvoiceTimestamp) {
  if (lastInvoiceTimestamp == null) {
    this._lastInvoiceTimestamp = null;
  } else {
    this._lastInvoiceTimestamp = String(lastInvoiceTimestamp.getTime());
  }
  return this;
};

/**
 * Provides the lastInvoiceTimestamp of this AccountingInfo.
 * @return {Date} The lastInvoiceTimestamp of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getLastInvoiceTimestamp = function() {
  if (this._lastInvoiceTimestamp == null) {
    return null;
  }
  if (isNaN(this._lastInvoiceTimestamp)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._lastInvoiceTimestamp);
  }
  return new Date(Number(this._lastInvoiceTimestamp));
};

/**
 * Loads a AccountingInfo from the server.
 * @param {string} id The id of the AccountingInfo.
 * @return {Promise.<tutao.entity.sys.AccountingInfo>} Resolves to the AccountingInfo or an exception if the loading failed.
 */
tutao.entity.sys.AccountingInfo.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.AccountingInfo, tutao.entity.sys.AccountingInfo.PATH, id, null, {"v" : 5}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads a version of this AccountingInfo from the server.
 * @param {string} versionId The id of the requested version.
 * @return {Promise.<tutao.entity.sys.AccountingInfo>} Resolves to AccountingInfo or an exception if the loading failed.
 */
tutao.entity.sys.AccountingInfo.prototype.loadVersion = function(versionId) {
  var map = {};
  map["version"] = versionId;
  map["v"] = 5;
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.AccountingInfo, tutao.entity.sys.AccountingInfo.PATH, this.getId(), null, map, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Loads information about all versions of this AccountingInfo from the server.
 * @return {Promise.<tutao.entity.sys.VersionReturn>} Resolves to an tutao.entity.sys.VersionReturn or an exception if the loading failed.
 */
tutao.entity.sys.AccountingInfo.prototype.loadVersionInfo = function() {
  var versionData = new tutao.entity.sys.VersionData()
    .setApplication("sys")
    .setType(143)
    .setId(this.getId());
  return tutao.entity.sys.VersionReturn.load(versionData, {}, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Loads multiple AccountingInfos from the server.
 * @param {Array.<string>} ids The ids of the AccountingInfos to load.
 * @return {Promise.<Array.<tutao.entity.sys.AccountingInfo>>} Resolves to an array of AccountingInfo or rejects with an exception if the loading failed.
 */
tutao.entity.sys.AccountingInfo.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.AccountingInfo, tutao.entity.sys.AccountingInfo.PATH, ids, {"v": 5}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.AccountingInfo.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.AccountingInfo.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
