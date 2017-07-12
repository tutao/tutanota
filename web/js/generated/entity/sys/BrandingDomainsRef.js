"use strict";

tutao.provide('tutao.entity.sys.BrandingDomainsRef');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BrandingDomainsRef = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._domains = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.BrandingDomainsRef.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BrandingDomainsRef.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._domains = data.domains;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.BrandingDomainsRef.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    domains: this._domains
  };
};

/**
 * Sets the id of this BrandingDomainsRef.
 * @param {string} id The id of this BrandingDomainsRef.
 */
tutao.entity.sys.BrandingDomainsRef.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this BrandingDomainsRef.
 * @return {string} The id of this BrandingDomainsRef.
 */
tutao.entity.sys.BrandingDomainsRef.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the domains of this BrandingDomainsRef.
 * @param {string} domains The domains of this BrandingDomainsRef.
 */
tutao.entity.sys.BrandingDomainsRef.prototype.setDomains = function(domains) {
  this._domains = domains;
  return this;
};

/**
 * Provides the domains of this BrandingDomainsRef.
 * @return {string} The domains of this BrandingDomainsRef.
 */
tutao.entity.sys.BrandingDomainsRef.prototype.getDomains = function() {
  return this._domains;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.BrandingDomainsRef.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
