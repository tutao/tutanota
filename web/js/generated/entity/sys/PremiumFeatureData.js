"use strict";

tutao.provide('tutao.entity.sys.PremiumFeatureData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PremiumFeatureData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._activationCode = null;
    this._featureName = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PremiumFeatureData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PremiumFeatureData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._activationCode = data.activationCode;
  this._featureName = data.featureName;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PremiumFeatureData.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.PremiumFeatureData.PATH = '/rest/sys/premiumfeatureservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PremiumFeatureData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PremiumFeatureData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    activationCode: this._activationCode, 
    featureName: this._featureName
  };
};

/**
 * Sets the format of this PremiumFeatureData.
 * @param {string} format The format of this PremiumFeatureData.
 */
tutao.entity.sys.PremiumFeatureData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PremiumFeatureData.
 * @return {string} The format of this PremiumFeatureData.
 */
tutao.entity.sys.PremiumFeatureData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the activationCode of this PremiumFeatureData.
 * @param {string} activationCode The activationCode of this PremiumFeatureData.
 */
tutao.entity.sys.PremiumFeatureData.prototype.setActivationCode = function(activationCode) {
  this._activationCode = activationCode;
  return this;
};

/**
 * Provides the activationCode of this PremiumFeatureData.
 * @return {string} The activationCode of this PremiumFeatureData.
 */
tutao.entity.sys.PremiumFeatureData.prototype.getActivationCode = function() {
  return this._activationCode;
};

/**
 * Sets the featureName of this PremiumFeatureData.
 * @param {string} featureName The featureName of this PremiumFeatureData.
 */
tutao.entity.sys.PremiumFeatureData.prototype.setFeatureName = function(featureName) {
  this._featureName = featureName;
  return this;
};

/**
 * Provides the featureName of this PremiumFeatureData.
 * @return {string} The featureName of this PremiumFeatureData.
 */
tutao.entity.sys.PremiumFeatureData.prototype.getFeatureName = function() {
  return this._featureName;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.PremiumFeatureReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.PremiumFeatureData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.PremiumFeatureData.PATH, this, parameters, headers, tutao.entity.sys.PremiumFeatureReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PremiumFeatureData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
