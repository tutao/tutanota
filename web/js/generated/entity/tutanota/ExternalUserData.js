"use strict";

tutao.provide('tutao.entity.tutanota.ExternalUserData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ExternalUserData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._externalMailEncMailBoxSessionKey = null;
    this._externalMailEncMailGroupInfoSessionKey = null;
    this._externalUserEncEntropy = null;
    this._externalUserEncMailGroupKey = null;
    this._externalUserEncTutanotaPropertiesSessionKey = null;
    this._externalUserEncUserGroupInfoSessionKey = null;
    this._internalMailEncMailGroupInfoSessionKey = null;
    this._internalMailEncUserGroupInfoSessionKey = null;
    this._userEncClientKey = null;
    this._verifier = null;
    this._userGroupData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.ExternalUserData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ExternalUserData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._externalMailEncMailBoxSessionKey = data.externalMailEncMailBoxSessionKey;
  this._externalMailEncMailGroupInfoSessionKey = data.externalMailEncMailGroupInfoSessionKey;
  this._externalUserEncEntropy = data.externalUserEncEntropy;
  this._externalUserEncMailGroupKey = data.externalUserEncMailGroupKey;
  this._externalUserEncTutanotaPropertiesSessionKey = data.externalUserEncTutanotaPropertiesSessionKey;
  this._externalUserEncUserGroupInfoSessionKey = data.externalUserEncUserGroupInfoSessionKey;
  this._internalMailEncMailGroupInfoSessionKey = data.internalMailEncMailGroupInfoSessionKey;
  this._internalMailEncUserGroupInfoSessionKey = data.internalMailEncUserGroupInfoSessionKey;
  this._userEncClientKey = data.userEncClientKey;
  this._verifier = data.verifier;
  this._userGroupData = (data.userGroupData) ? new tutao.entity.tutanota.CreateExternalUserGroupData(this, data.userGroupData) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.ExternalUserData.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.ExternalUserData.PATH = '/rest/tutanota/externaluserservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.ExternalUserData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ExternalUserData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    externalMailEncMailBoxSessionKey: this._externalMailEncMailBoxSessionKey, 
    externalMailEncMailGroupInfoSessionKey: this._externalMailEncMailGroupInfoSessionKey, 
    externalUserEncEntropy: this._externalUserEncEntropy, 
    externalUserEncMailGroupKey: this._externalUserEncMailGroupKey, 
    externalUserEncTutanotaPropertiesSessionKey: this._externalUserEncTutanotaPropertiesSessionKey, 
    externalUserEncUserGroupInfoSessionKey: this._externalUserEncUserGroupInfoSessionKey, 
    internalMailEncMailGroupInfoSessionKey: this._internalMailEncMailGroupInfoSessionKey, 
    internalMailEncUserGroupInfoSessionKey: this._internalMailEncUserGroupInfoSessionKey, 
    userEncClientKey: this._userEncClientKey, 
    verifier: this._verifier, 
    userGroupData: tutao.entity.EntityHelper.aggregatesToJsonData(this._userGroupData)
  };
};

/**
 * Sets the format of this ExternalUserData.
 * @param {string} format The format of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ExternalUserData.
 * @return {string} The format of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the externalMailEncMailBoxSessionKey of this ExternalUserData.
 * @param {string} externalMailEncMailBoxSessionKey The externalMailEncMailBoxSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setExternalMailEncMailBoxSessionKey = function(externalMailEncMailBoxSessionKey) {
  this._externalMailEncMailBoxSessionKey = externalMailEncMailBoxSessionKey;
  return this;
};

/**
 * Provides the externalMailEncMailBoxSessionKey of this ExternalUserData.
 * @return {string} The externalMailEncMailBoxSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getExternalMailEncMailBoxSessionKey = function() {
  return this._externalMailEncMailBoxSessionKey;
};

/**
 * Sets the externalMailEncMailGroupInfoSessionKey of this ExternalUserData.
 * @param {string} externalMailEncMailGroupInfoSessionKey The externalMailEncMailGroupInfoSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setExternalMailEncMailGroupInfoSessionKey = function(externalMailEncMailGroupInfoSessionKey) {
  this._externalMailEncMailGroupInfoSessionKey = externalMailEncMailGroupInfoSessionKey;
  return this;
};

/**
 * Provides the externalMailEncMailGroupInfoSessionKey of this ExternalUserData.
 * @return {string} The externalMailEncMailGroupInfoSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getExternalMailEncMailGroupInfoSessionKey = function() {
  return this._externalMailEncMailGroupInfoSessionKey;
};

/**
 * Sets the externalUserEncEntropy of this ExternalUserData.
 * @param {string} externalUserEncEntropy The externalUserEncEntropy of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setExternalUserEncEntropy = function(externalUserEncEntropy) {
  this._externalUserEncEntropy = externalUserEncEntropy;
  return this;
};

/**
 * Provides the externalUserEncEntropy of this ExternalUserData.
 * @return {string} The externalUserEncEntropy of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getExternalUserEncEntropy = function() {
  return this._externalUserEncEntropy;
};

/**
 * Sets the externalUserEncMailGroupKey of this ExternalUserData.
 * @param {string} externalUserEncMailGroupKey The externalUserEncMailGroupKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setExternalUserEncMailGroupKey = function(externalUserEncMailGroupKey) {
  this._externalUserEncMailGroupKey = externalUserEncMailGroupKey;
  return this;
};

/**
 * Provides the externalUserEncMailGroupKey of this ExternalUserData.
 * @return {string} The externalUserEncMailGroupKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getExternalUserEncMailGroupKey = function() {
  return this._externalUserEncMailGroupKey;
};

/**
 * Sets the externalUserEncTutanotaPropertiesSessionKey of this ExternalUserData.
 * @param {string} externalUserEncTutanotaPropertiesSessionKey The externalUserEncTutanotaPropertiesSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setExternalUserEncTutanotaPropertiesSessionKey = function(externalUserEncTutanotaPropertiesSessionKey) {
  this._externalUserEncTutanotaPropertiesSessionKey = externalUserEncTutanotaPropertiesSessionKey;
  return this;
};

/**
 * Provides the externalUserEncTutanotaPropertiesSessionKey of this ExternalUserData.
 * @return {string} The externalUserEncTutanotaPropertiesSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getExternalUserEncTutanotaPropertiesSessionKey = function() {
  return this._externalUserEncTutanotaPropertiesSessionKey;
};

/**
 * Sets the externalUserEncUserGroupInfoSessionKey of this ExternalUserData.
 * @param {string} externalUserEncUserGroupInfoSessionKey The externalUserEncUserGroupInfoSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setExternalUserEncUserGroupInfoSessionKey = function(externalUserEncUserGroupInfoSessionKey) {
  this._externalUserEncUserGroupInfoSessionKey = externalUserEncUserGroupInfoSessionKey;
  return this;
};

/**
 * Provides the externalUserEncUserGroupInfoSessionKey of this ExternalUserData.
 * @return {string} The externalUserEncUserGroupInfoSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getExternalUserEncUserGroupInfoSessionKey = function() {
  return this._externalUserEncUserGroupInfoSessionKey;
};

/**
 * Sets the internalMailEncMailGroupInfoSessionKey of this ExternalUserData.
 * @param {string} internalMailEncMailGroupInfoSessionKey The internalMailEncMailGroupInfoSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setInternalMailEncMailGroupInfoSessionKey = function(internalMailEncMailGroupInfoSessionKey) {
  this._internalMailEncMailGroupInfoSessionKey = internalMailEncMailGroupInfoSessionKey;
  return this;
};

/**
 * Provides the internalMailEncMailGroupInfoSessionKey of this ExternalUserData.
 * @return {string} The internalMailEncMailGroupInfoSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getInternalMailEncMailGroupInfoSessionKey = function() {
  return this._internalMailEncMailGroupInfoSessionKey;
};

/**
 * Sets the internalMailEncUserGroupInfoSessionKey of this ExternalUserData.
 * @param {string} internalMailEncUserGroupInfoSessionKey The internalMailEncUserGroupInfoSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setInternalMailEncUserGroupInfoSessionKey = function(internalMailEncUserGroupInfoSessionKey) {
  this._internalMailEncUserGroupInfoSessionKey = internalMailEncUserGroupInfoSessionKey;
  return this;
};

/**
 * Provides the internalMailEncUserGroupInfoSessionKey of this ExternalUserData.
 * @return {string} The internalMailEncUserGroupInfoSessionKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getInternalMailEncUserGroupInfoSessionKey = function() {
  return this._internalMailEncUserGroupInfoSessionKey;
};

/**
 * Sets the userEncClientKey of this ExternalUserData.
 * @param {string} userEncClientKey The userEncClientKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setUserEncClientKey = function(userEncClientKey) {
  this._userEncClientKey = userEncClientKey;
  return this;
};

/**
 * Provides the userEncClientKey of this ExternalUserData.
 * @return {string} The userEncClientKey of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getUserEncClientKey = function() {
  return this._userEncClientKey;
};

/**
 * Sets the verifier of this ExternalUserData.
 * @param {string} verifier The verifier of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setVerifier = function(verifier) {
  this._verifier = verifier;
  return this;
};

/**
 * Provides the verifier of this ExternalUserData.
 * @return {string} The verifier of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getVerifier = function() {
  return this._verifier;
};

/**
 * Sets the userGroupData of this ExternalUserData.
 * @param {tutao.entity.tutanota.CreateExternalUserGroupData} userGroupData The userGroupData of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setUserGroupData = function(userGroupData) {
  this._userGroupData = userGroupData;
  return this;
};

/**
 * Provides the userGroupData of this ExternalUserData.
 * @return {tutao.entity.tutanota.CreateExternalUserGroupData} The userGroupData of this ExternalUserData.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getUserGroupData = function() {
  return this._userGroupData;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.ExternalUserData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "20";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.ExternalUserData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ExternalUserData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
