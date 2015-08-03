"use strict";

tutao.provide('tutao.entity.sys.PriceRequestData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PriceRequestData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._accountType = null;
    this._business = null;
    this._count = null;
    this._featureType = null;
    this._paymentInterval = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.PriceRequestData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PriceRequestData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._accountType = data.accountType;
  this._business = data.business;
  this._count = data.count;
  this._featureType = data.featureType;
  this._paymentInterval = data.paymentInterval;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PriceRequestData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    accountType: this._accountType, 
    business: this._business, 
    count: this._count, 
    featureType: this._featureType, 
    paymentInterval: this._paymentInterval
  };
};

/**
 * The id of the PriceRequestData type.
 */
tutao.entity.sys.PriceRequestData.prototype.TYPE_ID = 836;

/**
 * The id of the accountType attribute.
 */
tutao.entity.sys.PriceRequestData.prototype.ACCOUNTTYPE_ATTRIBUTE_ID = 842;

/**
 * The id of the business attribute.
 */
tutao.entity.sys.PriceRequestData.prototype.BUSINESS_ATTRIBUTE_ID = 840;

/**
 * The id of the count attribute.
 */
tutao.entity.sys.PriceRequestData.prototype.COUNT_ATTRIBUTE_ID = 839;

/**
 * The id of the featureType attribute.
 */
tutao.entity.sys.PriceRequestData.prototype.FEATURETYPE_ATTRIBUTE_ID = 838;

/**
 * The id of the paymentInterval attribute.
 */
tutao.entity.sys.PriceRequestData.prototype.PAYMENTINTERVAL_ATTRIBUTE_ID = 841;

/**
 * Sets the id of this PriceRequestData.
 * @param {string} id The id of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this PriceRequestData.
 * @return {string} The id of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the accountType of this PriceRequestData.
 * @param {string} accountType The accountType of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.setAccountType = function(accountType) {
  this._accountType = accountType;
  return this;
};

/**
 * Provides the accountType of this PriceRequestData.
 * @return {string} The accountType of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.getAccountType = function() {
  return this._accountType;
};

/**
 * Sets the business of this PriceRequestData.
 * @param {boolean} business The business of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.setBusiness = function(business) {
  if (business == null) {
    this._business = null;
  } else {
    this._business = business ? '1' : '0';
  }
  return this;
};

/**
 * Provides the business of this PriceRequestData.
 * @return {boolean} The business of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.getBusiness = function() {
  if (this._business == null) {
    return null;
  }
  return this._business == '1';
};

/**
 * Sets the count of this PriceRequestData.
 * @param {string} count The count of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.setCount = function(count) {
  this._count = count;
  return this;
};

/**
 * Provides the count of this PriceRequestData.
 * @return {string} The count of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.getCount = function() {
  return this._count;
};

/**
 * Sets the featureType of this PriceRequestData.
 * @param {string} featureType The featureType of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.setFeatureType = function(featureType) {
  this._featureType = featureType;
  return this;
};

/**
 * Provides the featureType of this PriceRequestData.
 * @return {string} The featureType of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.getFeatureType = function() {
  return this._featureType;
};

/**
 * Sets the paymentInterval of this PriceRequestData.
 * @param {string} paymentInterval The paymentInterval of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.setPaymentInterval = function(paymentInterval) {
  this._paymentInterval = paymentInterval;
  return this;
};

/**
 * Provides the paymentInterval of this PriceRequestData.
 * @return {string} The paymentInterval of this PriceRequestData.
 */
tutao.entity.sys.PriceRequestData.prototype.getPaymentInterval = function() {
  return this._paymentInterval;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PriceRequestData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
