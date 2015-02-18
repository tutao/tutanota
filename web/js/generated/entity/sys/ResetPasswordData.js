"use strict";

tutao.provide('tutao.entity.sys.ResetPasswordData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ResetPasswordData = function(data) {
  if (data) {
    this.__format = data._format;
    this._pwEncUserGroupKey = data.pwEncUserGroupKey;
    this._salt = data.salt;
    this._verifier = data.verifier;
    this._user = data.user;
  } else {
    this.__format = "0";
    this._pwEncUserGroupKey = null;
    this._salt = null;
    this._verifier = null;
    this._user = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.ResetPasswordData.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.ResetPasswordData.MODEL_VERSION = '7';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.ResetPasswordData.PATH = '/rest/sys/resetpasswordservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.ResetPasswordData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.ResetPasswordData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    pwEncUserGroupKey: this._pwEncUserGroupKey, 
    salt: this._salt, 
    verifier: this._verifier, 
    user: this._user
  };
};

/**
 * The id of the ResetPasswordData type.
 */
tutao.entity.sys.ResetPasswordData.prototype.TYPE_ID = 584;

/**
 * The id of the pwEncUserGroupKey attribute.
 */
tutao.entity.sys.ResetPasswordData.prototype.PWENCUSERGROUPKEY_ATTRIBUTE_ID = 588;

/**
 * The id of the salt attribute.
 */
tutao.entity.sys.ResetPasswordData.prototype.SALT_ATTRIBUTE_ID = 587;

/**
 * The id of the verifier attribute.
 */
tutao.entity.sys.ResetPasswordData.prototype.VERIFIER_ATTRIBUTE_ID = 586;

/**
 * The id of the user attribute.
 */
tutao.entity.sys.ResetPasswordData.prototype.USER_ATTRIBUTE_ID = 589;

/**
 * Sets the format of this ResetPasswordData.
 * @param {string} format The format of this ResetPasswordData.
 */
tutao.entity.sys.ResetPasswordData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ResetPasswordData.
 * @return {string} The format of this ResetPasswordData.
 */
tutao.entity.sys.ResetPasswordData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the pwEncUserGroupKey of this ResetPasswordData.
 * @param {string} pwEncUserGroupKey The pwEncUserGroupKey of this ResetPasswordData.
 */
tutao.entity.sys.ResetPasswordData.prototype.setPwEncUserGroupKey = function(pwEncUserGroupKey) {
  this._pwEncUserGroupKey = pwEncUserGroupKey;
  return this;
};

/**
 * Provides the pwEncUserGroupKey of this ResetPasswordData.
 * @return {string} The pwEncUserGroupKey of this ResetPasswordData.
 */
tutao.entity.sys.ResetPasswordData.prototype.getPwEncUserGroupKey = function() {
  return this._pwEncUserGroupKey;
};

/**
 * Sets the salt of this ResetPasswordData.
 * @param {string} salt The salt of this ResetPasswordData.
 */
tutao.entity.sys.ResetPasswordData.prototype.setSalt = function(salt) {
  this._salt = salt;
  return this;
};

/**
 * Provides the salt of this ResetPasswordData.
 * @return {string} The salt of this ResetPasswordData.
 */
tutao.entity.sys.ResetPasswordData.prototype.getSalt = function() {
  return this._salt;
};

/**
 * Sets the verifier of this ResetPasswordData.
 * @param {string} verifier The verifier of this ResetPasswordData.
 */
tutao.entity.sys.ResetPasswordData.prototype.setVerifier = function(verifier) {
  this._verifier = verifier;
  return this;
};

/**
 * Provides the verifier of this ResetPasswordData.
 * @return {string} The verifier of this ResetPasswordData.
 */
tutao.entity.sys.ResetPasswordData.prototype.getVerifier = function() {
  return this._verifier;
};

/**
 * Sets the user of this ResetPasswordData.
 * @param {string} user The user of this ResetPasswordData.
 */
tutao.entity.sys.ResetPasswordData.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this ResetPasswordData.
 * @return {string} The user of this ResetPasswordData.
 */
tutao.entity.sys.ResetPasswordData.prototype.getUser = function() {
  return this._user;
};

/**
 * Loads the user of this ResetPasswordData.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded user of this ResetPasswordData or an exception if the loading failed.
 */
tutao.entity.sys.ResetPasswordData.prototype.loadUser = function() {
  return tutao.entity.sys.User.load(this._user);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.ResetPasswordData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 7;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.ResetPasswordData.PATH, this, parameters, headers, null);
};
