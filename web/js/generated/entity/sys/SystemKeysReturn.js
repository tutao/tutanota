"use strict";

tutao.provide('tutao.entity.sys.SystemKeysReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SystemKeysReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._freeGroupKey = null;
    this._premiumGroupKey = null;
    this._starterGroupKey = null;
    this._systemAdminPubKey = null;
    this._systemAdminPubKeyVersion = null;
    this._freeGroup = null;
    this._premiumGroup = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SystemKeysReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SystemKeysReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._freeGroupKey = data.freeGroupKey;
  this._premiumGroupKey = data.premiumGroupKey;
  this._starterGroupKey = data.starterGroupKey;
  this._systemAdminPubKey = data.systemAdminPubKey;
  this._systemAdminPubKeyVersion = data.systemAdminPubKeyVersion;
  this._freeGroup = data.freeGroup;
  this._premiumGroup = data.premiumGroup;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SystemKeysReturn.MODEL_VERSION = '11';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.SystemKeysReturn.PATH = '/rest/sys/systemkeysservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SystemKeysReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SystemKeysReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    freeGroupKey: this._freeGroupKey, 
    premiumGroupKey: this._premiumGroupKey, 
    starterGroupKey: this._starterGroupKey, 
    systemAdminPubKey: this._systemAdminPubKey, 
    systemAdminPubKeyVersion: this._systemAdminPubKeyVersion, 
    freeGroup: this._freeGroup, 
    premiumGroup: this._premiumGroup
  };
};

/**
 * The id of the SystemKeysReturn type.
 */
tutao.entity.sys.SystemKeysReturn.prototype.TYPE_ID = 301;

/**
 * The id of the freeGroupKey attribute.
 */
tutao.entity.sys.SystemKeysReturn.prototype.FREEGROUPKEY_ATTRIBUTE_ID = 305;

/**
 * The id of the premiumGroupKey attribute.
 */
tutao.entity.sys.SystemKeysReturn.prototype.PREMIUMGROUPKEY_ATTRIBUTE_ID = 306;

/**
 * The id of the starterGroupKey attribute.
 */
tutao.entity.sys.SystemKeysReturn.prototype.STARTERGROUPKEY_ATTRIBUTE_ID = 307;

/**
 * The id of the systemAdminPubKey attribute.
 */
tutao.entity.sys.SystemKeysReturn.prototype.SYSTEMADMINPUBKEY_ATTRIBUTE_ID = 303;

/**
 * The id of the systemAdminPubKeyVersion attribute.
 */
tutao.entity.sys.SystemKeysReturn.prototype.SYSTEMADMINPUBKEYVERSION_ATTRIBUTE_ID = 304;

/**
 * The id of the freeGroup attribute.
 */
tutao.entity.sys.SystemKeysReturn.prototype.FREEGROUP_ATTRIBUTE_ID = 880;

/**
 * The id of the premiumGroup attribute.
 */
tutao.entity.sys.SystemKeysReturn.prototype.PREMIUMGROUP_ATTRIBUTE_ID = 881;

/**
 * Sets the format of this SystemKeysReturn.
 * @param {string} format The format of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SystemKeysReturn.
 * @return {string} The format of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the freeGroupKey of this SystemKeysReturn.
 * @param {string} freeGroupKey The freeGroupKey of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.setFreeGroupKey = function(freeGroupKey) {
  this._freeGroupKey = freeGroupKey;
  return this;
};

/**
 * Provides the freeGroupKey of this SystemKeysReturn.
 * @return {string} The freeGroupKey of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.getFreeGroupKey = function() {
  return this._freeGroupKey;
};

/**
 * Sets the premiumGroupKey of this SystemKeysReturn.
 * @param {string} premiumGroupKey The premiumGroupKey of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.setPremiumGroupKey = function(premiumGroupKey) {
  this._premiumGroupKey = premiumGroupKey;
  return this;
};

/**
 * Provides the premiumGroupKey of this SystemKeysReturn.
 * @return {string} The premiumGroupKey of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.getPremiumGroupKey = function() {
  return this._premiumGroupKey;
};

/**
 * Sets the starterGroupKey of this SystemKeysReturn.
 * @param {string} starterGroupKey The starterGroupKey of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.setStarterGroupKey = function(starterGroupKey) {
  this._starterGroupKey = starterGroupKey;
  return this;
};

/**
 * Provides the starterGroupKey of this SystemKeysReturn.
 * @return {string} The starterGroupKey of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.getStarterGroupKey = function() {
  return this._starterGroupKey;
};

/**
 * Sets the systemAdminPubKey of this SystemKeysReturn.
 * @param {string} systemAdminPubKey The systemAdminPubKey of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.setSystemAdminPubKey = function(systemAdminPubKey) {
  this._systemAdminPubKey = systemAdminPubKey;
  return this;
};

/**
 * Provides the systemAdminPubKey of this SystemKeysReturn.
 * @return {string} The systemAdminPubKey of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.getSystemAdminPubKey = function() {
  return this._systemAdminPubKey;
};

/**
 * Sets the systemAdminPubKeyVersion of this SystemKeysReturn.
 * @param {string} systemAdminPubKeyVersion The systemAdminPubKeyVersion of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.setSystemAdminPubKeyVersion = function(systemAdminPubKeyVersion) {
  this._systemAdminPubKeyVersion = systemAdminPubKeyVersion;
  return this;
};

/**
 * Provides the systemAdminPubKeyVersion of this SystemKeysReturn.
 * @return {string} The systemAdminPubKeyVersion of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.getSystemAdminPubKeyVersion = function() {
  return this._systemAdminPubKeyVersion;
};

/**
 * Sets the freeGroup of this SystemKeysReturn.
 * @param {string} freeGroup The freeGroup of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.setFreeGroup = function(freeGroup) {
  this._freeGroup = freeGroup;
  return this;
};

/**
 * Provides the freeGroup of this SystemKeysReturn.
 * @return {string} The freeGroup of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.getFreeGroup = function() {
  return this._freeGroup;
};

/**
 * Loads the freeGroup of this SystemKeysReturn.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded freeGroup of this SystemKeysReturn or an exception if the loading failed.
 */
tutao.entity.sys.SystemKeysReturn.prototype.loadFreeGroup = function() {
  return tutao.entity.sys.Group.load(this._freeGroup);
};

/**
 * Sets the premiumGroup of this SystemKeysReturn.
 * @param {string} premiumGroup The premiumGroup of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.setPremiumGroup = function(premiumGroup) {
  this._premiumGroup = premiumGroup;
  return this;
};

/**
 * Provides the premiumGroup of this SystemKeysReturn.
 * @return {string} The premiumGroup of this SystemKeysReturn.
 */
tutao.entity.sys.SystemKeysReturn.prototype.getPremiumGroup = function() {
  return this._premiumGroup;
};

/**
 * Loads the premiumGroup of this SystemKeysReturn.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded premiumGroup of this SystemKeysReturn or an exception if the loading failed.
 */
tutao.entity.sys.SystemKeysReturn.prototype.loadPremiumGroup = function() {
  return tutao.entity.sys.Group.load(this._premiumGroup);
};

/**
 * Loads from the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.SystemKeysReturn>} Resolves to SystemKeysReturn or an exception if the loading failed.
 */
tutao.entity.sys.SystemKeysReturn.load = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 11;
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.SystemKeysReturn, tutao.entity.sys.SystemKeysReturn.PATH, null, null, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.SystemKeysReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
