"use strict";

tutao.provide('tutao.entity.sys.ChangePasswordData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ChangePasswordData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._code = null;
    this._pwEncUserGroupKey = null;
    this._salt = null;
    this._verifier = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.ChangePasswordData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ChangePasswordData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._code = data.code;
  this._pwEncUserGroupKey = data.pwEncUserGroupKey;
  this._salt = data.salt;
  this._verifier = data.verifier;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.ChangePasswordData.MODEL_VERSION = '13';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.ChangePasswordData.PATH = '/rest/sys/changepasswordservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.ChangePasswordData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.ChangePasswordData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    code: this._code, 
    pwEncUserGroupKey: this._pwEncUserGroupKey, 
    salt: this._salt, 
    verifier: this._verifier
  };
};

/**
 * The id of the ChangePasswordData type.
 */
tutao.entity.sys.ChangePasswordData.prototype.TYPE_ID = 534;

/**
 * The id of the code attribute.
 */
tutao.entity.sys.ChangePasswordData.prototype.CODE_ATTRIBUTE_ID = 539;

/**
 * The id of the pwEncUserGroupKey attribute.
 */
tutao.entity.sys.ChangePasswordData.prototype.PWENCUSERGROUPKEY_ATTRIBUTE_ID = 538;

/**
 * The id of the salt attribute.
 */
tutao.entity.sys.ChangePasswordData.prototype.SALT_ATTRIBUTE_ID = 537;

/**
 * The id of the verifier attribute.
 */
tutao.entity.sys.ChangePasswordData.prototype.VERIFIER_ATTRIBUTE_ID = 536;

/**
 * Sets the format of this ChangePasswordData.
 * @param {string} format The format of this ChangePasswordData.
 */
tutao.entity.sys.ChangePasswordData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ChangePasswordData.
 * @return {string} The format of this ChangePasswordData.
 */
tutao.entity.sys.ChangePasswordData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the code of this ChangePasswordData.
 * @param {string} code The code of this ChangePasswordData.
 */
tutao.entity.sys.ChangePasswordData.prototype.setCode = function(code) {
  this._code = code;
  return this;
};

/**
 * Provides the code of this ChangePasswordData.
 * @return {string} The code of this ChangePasswordData.
 */
tutao.entity.sys.ChangePasswordData.prototype.getCode = function() {
  return this._code;
};

/**
 * Sets the pwEncUserGroupKey of this ChangePasswordData.
 * @param {string} pwEncUserGroupKey The pwEncUserGroupKey of this ChangePasswordData.
 */
tutao.entity.sys.ChangePasswordData.prototype.setPwEncUserGroupKey = function(pwEncUserGroupKey) {
  this._pwEncUserGroupKey = pwEncUserGroupKey;
  return this;
};

/**
 * Provides the pwEncUserGroupKey of this ChangePasswordData.
 * @return {string} The pwEncUserGroupKey of this ChangePasswordData.
 */
tutao.entity.sys.ChangePasswordData.prototype.getPwEncUserGroupKey = function() {
  return this._pwEncUserGroupKey;
};

/**
 * Sets the salt of this ChangePasswordData.
 * @param {string} salt The salt of this ChangePasswordData.
 */
tutao.entity.sys.ChangePasswordData.prototype.setSalt = function(salt) {
  this._salt = salt;
  return this;
};

/**
 * Provides the salt of this ChangePasswordData.
 * @return {string} The salt of this ChangePasswordData.
 */
tutao.entity.sys.ChangePasswordData.prototype.getSalt = function() {
  return this._salt;
};

/**
 * Sets the verifier of this ChangePasswordData.
 * @param {string} verifier The verifier of this ChangePasswordData.
 */
tutao.entity.sys.ChangePasswordData.prototype.setVerifier = function(verifier) {
  this._verifier = verifier;
  return this;
};

/**
 * Provides the verifier of this ChangePasswordData.
 * @return {string} The verifier of this ChangePasswordData.
 */
tutao.entity.sys.ChangePasswordData.prototype.getVerifier = function() {
  return this._verifier;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.ChangePasswordData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 13;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.ChangePasswordData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.ChangePasswordData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
