"use strict";

tutao.provide('tutao.entity.sys.SecondFactorAuthGetReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactorAuthGetReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._secondFactorPending = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SecondFactorAuthGetReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactorAuthGetReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._secondFactorPending = data.secondFactorPending;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SecondFactorAuthGetReturn.MODEL_VERSION = '23';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.SecondFactorAuthGetReturn.PATH = '/rest/sys/secondfactorauthservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SecondFactorAuthGetReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SecondFactorAuthGetReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    secondFactorPending: this._secondFactorPending
  };
};

/**
 * Sets the format of this SecondFactorAuthGetReturn.
 * @param {string} format The format of this SecondFactorAuthGetReturn.
 */
tutao.entity.sys.SecondFactorAuthGetReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SecondFactorAuthGetReturn.
 * @return {string} The format of this SecondFactorAuthGetReturn.
 */
tutao.entity.sys.SecondFactorAuthGetReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the secondFactorPending of this SecondFactorAuthGetReturn.
 * @param {boolean} secondFactorPending The secondFactorPending of this SecondFactorAuthGetReturn.
 */
tutao.entity.sys.SecondFactorAuthGetReturn.prototype.setSecondFactorPending = function(secondFactorPending) {
  this._secondFactorPending = secondFactorPending ? '1' : '0';
  return this;
};

/**
 * Provides the secondFactorPending of this SecondFactorAuthGetReturn.
 * @return {boolean} The secondFactorPending of this SecondFactorAuthGetReturn.
 */
tutao.entity.sys.SecondFactorAuthGetReturn.prototype.getSecondFactorPending = function() {
  return this._secondFactorPending != '0';
};

/**
 * Loads from the service.
 * @param {tutao.entity.sys.SecondFactorAuthGetData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.SecondFactorAuthGetReturn>} Resolves to SecondFactorAuthGetReturn or an exception if the loading failed.
 */
tutao.entity.sys.SecondFactorAuthGetReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "23";
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.SecondFactorAuthGetReturn, tutao.entity.sys.SecondFactorAuthGetReturn.PATH, entity, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.SecondFactorAuthGetReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
