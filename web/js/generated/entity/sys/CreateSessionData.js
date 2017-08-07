"use strict";

tutao.provide('tutao.entity.sys.CreateSessionData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CreateSessionData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._accessKey = null;
    this._authToken = null;
    this._authVerifier = null;
    this._clientIdentifier = null;
    this._mailAddress = null;
    this._user = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CreateSessionData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CreateSessionData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._accessKey = data.accessKey;
  this._authToken = data.authToken;
  this._authVerifier = data.authVerifier;
  this._clientIdentifier = data.clientIdentifier;
  this._mailAddress = data.mailAddress;
  this._user = data.user;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CreateSessionData.MODEL_VERSION = '23';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.CreateSessionData.PATH = '/rest/sys/sessionservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CreateSessionData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CreateSessionData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    accessKey: this._accessKey, 
    authToken: this._authToken, 
    authVerifier: this._authVerifier, 
    clientIdentifier: this._clientIdentifier, 
    mailAddress: this._mailAddress, 
    user: this._user
  };
};

/**
 * Sets the format of this CreateSessionData.
 * @param {string} format The format of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateSessionData.
 * @return {string} The format of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the accessKey of this CreateSessionData.
 * @param {string} accessKey The accessKey of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.setAccessKey = function(accessKey) {
  this._accessKey = accessKey;
  return this;
};

/**
 * Provides the accessKey of this CreateSessionData.
 * @return {string} The accessKey of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.getAccessKey = function() {
  return this._accessKey;
};

/**
 * Sets the authToken of this CreateSessionData.
 * @param {string} authToken The authToken of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.setAuthToken = function(authToken) {
  this._authToken = authToken;
  return this;
};

/**
 * Provides the authToken of this CreateSessionData.
 * @return {string} The authToken of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.getAuthToken = function() {
  return this._authToken;
};

/**
 * Sets the authVerifier of this CreateSessionData.
 * @param {string} authVerifier The authVerifier of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.setAuthVerifier = function(authVerifier) {
  this._authVerifier = authVerifier;
  return this;
};

/**
 * Provides the authVerifier of this CreateSessionData.
 * @return {string} The authVerifier of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.getAuthVerifier = function() {
  return this._authVerifier;
};

/**
 * Sets the clientIdentifier of this CreateSessionData.
 * @param {string} clientIdentifier The clientIdentifier of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.setClientIdentifier = function(clientIdentifier) {
  this._clientIdentifier = clientIdentifier;
  return this;
};

/**
 * Provides the clientIdentifier of this CreateSessionData.
 * @return {string} The clientIdentifier of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.getClientIdentifier = function() {
  return this._clientIdentifier;
};

/**
 * Sets the mailAddress of this CreateSessionData.
 * @param {string} mailAddress The mailAddress of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this CreateSessionData.
 * @return {string} The mailAddress of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the user of this CreateSessionData.
 * @param {string} user The user of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this CreateSessionData.
 * @return {string} The user of this CreateSessionData.
 */
tutao.entity.sys.CreateSessionData.prototype.getUser = function() {
  return this._user;
};

/**
 * Loads the user of this CreateSessionData.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded user of this CreateSessionData or an exception if the loading failed.
 */
tutao.entity.sys.CreateSessionData.prototype.loadUser = function() {
  return tutao.entity.sys.User.load(this._user);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.CreateSessionData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "23";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.CreateSessionData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CreateSessionData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
