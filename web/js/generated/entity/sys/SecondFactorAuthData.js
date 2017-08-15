"use strict";

tutao.provide('tutao.entity.sys.SecondFactorAuthData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactorAuthData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._type = null;
    this._session = null;
    this._u2f = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SecondFactorAuthData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._type = data.type;
  this._session = data.session;
  this._u2f = (data.u2f) ? new tutao.entity.sys.U2fResponseData(this, data.u2f) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SecondFactorAuthData.MODEL_VERSION = '23';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.SecondFactorAuthData.PATH = '/rest/sys/secondfactorauthservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SecondFactorAuthData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    type: this._type, 
    session: this._session, 
    u2f: tutao.entity.EntityHelper.aggregatesToJsonData(this._u2f)
  };
};

/**
 * Sets the format of this SecondFactorAuthData.
 * @param {string} format The format of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SecondFactorAuthData.
 * @return {string} The format of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the type of this SecondFactorAuthData.
 * @param {string} type The type of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this SecondFactorAuthData.
 * @return {string} The type of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.getType = function() {
  return this._type;
};

/**
 * Sets the session of this SecondFactorAuthData.
 * @param {Array.<string>} session The session of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.setSession = function(session) {
  this._session = session;
  return this;
};

/**
 * Provides the session of this SecondFactorAuthData.
 * @return {Array.<string>} The session of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.getSession = function() {
  return this._session;
};

/**
 * Loads the session of this SecondFactorAuthData.
 * @return {Promise.<tutao.entity.sys.Session>} Resolves to the loaded session of this SecondFactorAuthData or an exception if the loading failed.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.loadSession = function() {
  return tutao.entity.sys.Session.load(this._session);
};

/**
 * Sets the u2f of this SecondFactorAuthData.
 * @param {tutao.entity.sys.U2fResponseData} u2f The u2f of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.setU2f = function(u2f) {
  this._u2f = u2f;
  return this;
};

/**
 * Provides the u2f of this SecondFactorAuthData.
 * @return {tutao.entity.sys.U2fResponseData} The u2f of this SecondFactorAuthData.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.getU2f = function() {
  return this._u2f;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "23";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.SecondFactorAuthData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.SecondFactorAuthData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
