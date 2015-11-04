"use strict";

tutao.provide('tutao.entity.sys.PublicKeyReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PublicKeyReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._pubKey = null;
    this._pubKeyVersion = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PublicKeyReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PublicKeyReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._pubKey = data.pubKey;
  this._pubKeyVersion = data.pubKeyVersion;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PublicKeyReturn.MODEL_VERSION = '12';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.PublicKeyReturn.PATH = '/rest/sys/publickeyservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PublicKeyReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PublicKeyReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    pubKey: this._pubKey, 
    pubKeyVersion: this._pubKeyVersion
  };
};

/**
 * The id of the PublicKeyReturn type.
 */
tutao.entity.sys.PublicKeyReturn.prototype.TYPE_ID = 412;

/**
 * The id of the pubKey attribute.
 */
tutao.entity.sys.PublicKeyReturn.prototype.PUBKEY_ATTRIBUTE_ID = 414;

/**
 * The id of the pubKeyVersion attribute.
 */
tutao.entity.sys.PublicKeyReturn.prototype.PUBKEYVERSION_ATTRIBUTE_ID = 415;

/**
 * Sets the format of this PublicKeyReturn.
 * @param {string} format The format of this PublicKeyReturn.
 */
tutao.entity.sys.PublicKeyReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PublicKeyReturn.
 * @return {string} The format of this PublicKeyReturn.
 */
tutao.entity.sys.PublicKeyReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the pubKey of this PublicKeyReturn.
 * @param {string} pubKey The pubKey of this PublicKeyReturn.
 */
tutao.entity.sys.PublicKeyReturn.prototype.setPubKey = function(pubKey) {
  this._pubKey = pubKey;
  return this;
};

/**
 * Provides the pubKey of this PublicKeyReturn.
 * @return {string} The pubKey of this PublicKeyReturn.
 */
tutao.entity.sys.PublicKeyReturn.prototype.getPubKey = function() {
  return this._pubKey;
};

/**
 * Sets the pubKeyVersion of this PublicKeyReturn.
 * @param {string} pubKeyVersion The pubKeyVersion of this PublicKeyReturn.
 */
tutao.entity.sys.PublicKeyReturn.prototype.setPubKeyVersion = function(pubKeyVersion) {
  this._pubKeyVersion = pubKeyVersion;
  return this;
};

/**
 * Provides the pubKeyVersion of this PublicKeyReturn.
 * @return {string} The pubKeyVersion of this PublicKeyReturn.
 */
tutao.entity.sys.PublicKeyReturn.prototype.getPubKeyVersion = function() {
  return this._pubKeyVersion;
};

/**
 * Loads from the service.
 * @param {tutao.entity.sys.PublicKeyData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.PublicKeyReturn>} Resolves to PublicKeyReturn or an exception if the loading failed.
 */
tutao.entity.sys.PublicKeyReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 12;
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.PublicKeyReturn, tutao.entity.sys.PublicKeyReturn.PATH, entity, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PublicKeyReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
