"use strict";

tutao.provide('tutao.entity.tutanota.PasswordAutoAuthenticationReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.PasswordAutoAuthenticationReturn = function(data) {
  if (data) {
    this.__format = data._format;
  } else {
    this.__format = "0";
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.PasswordAutoAuthenticationReturn.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.PasswordAutoAuthenticationReturn.MODEL_VERSION = '6';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.PasswordAutoAuthenticationReturn.PATH = '/rest/tutanota/passwordautoauthenticationservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.PasswordAutoAuthenticationReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.PasswordAutoAuthenticationReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format
  };
};

/**
 * The id of the PasswordAutoAuthenticationReturn type.
 */
tutao.entity.tutanota.PasswordAutoAuthenticationReturn.prototype.TYPE_ID = 317;

/**
 * Sets the format of this PasswordAutoAuthenticationReturn.
 * @param {string} format The format of this PasswordAutoAuthenticationReturn.
 */
tutao.entity.tutanota.PasswordAutoAuthenticationReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PasswordAutoAuthenticationReturn.
 * @return {string} The format of this PasswordAutoAuthenticationReturn.
 */
tutao.entity.tutanota.PasswordAutoAuthenticationReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.PasswordAutoAuthenticationReturn>} Resolves to PasswordAutoAuthenticationReturn or an exception if the loading failed.
 */
tutao.entity.tutanota.PasswordAutoAuthenticationReturn.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 6;
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.PasswordAutoAuthenticationReturn, tutao.entity.tutanota.PasswordAutoAuthenticationReturn.PATH, null, null, parameters, headers);
};
