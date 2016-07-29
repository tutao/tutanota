"use strict";

tutao.provide('tutao.entity.sys.PremiumFeatureReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PremiumFeatureReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._activatedFeature = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PremiumFeatureReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PremiumFeatureReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._activatedFeature = data.activatedFeature;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PremiumFeatureReturn.MODEL_VERSION = '18';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PremiumFeatureReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PremiumFeatureReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    activatedFeature: this._activatedFeature
  };
};

/**
 * Sets the format of this PremiumFeatureReturn.
 * @param {string} format The format of this PremiumFeatureReturn.
 */
tutao.entity.sys.PremiumFeatureReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PremiumFeatureReturn.
 * @return {string} The format of this PremiumFeatureReturn.
 */
tutao.entity.sys.PremiumFeatureReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the activatedFeature of this PremiumFeatureReturn.
 * @param {string} activatedFeature The activatedFeature of this PremiumFeatureReturn.
 */
tutao.entity.sys.PremiumFeatureReturn.prototype.setActivatedFeature = function(activatedFeature) {
  this._activatedFeature = activatedFeature;
  return this;
};

/**
 * Provides the activatedFeature of this PremiumFeatureReturn.
 * @return {string} The activatedFeature of this PremiumFeatureReturn.
 */
tutao.entity.sys.PremiumFeatureReturn.prototype.getActivatedFeature = function() {
  return this._activatedFeature;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PremiumFeatureReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
