"use strict";

tutao.provide('tutao.entity.sys.DomainInfo');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DomainInfo = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._domain = null;
    this._validatedMxRecord = null;
    this._catchAllUserGroup = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.DomainInfo.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DomainInfo.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._domain = data.domain;
  this._validatedMxRecord = data.validatedMxRecord;
  this._catchAllUserGroup = data.catchAllUserGroup;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.DomainInfo.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    domain: this._domain, 
    validatedMxRecord: this._validatedMxRecord, 
    catchAllUserGroup: this._catchAllUserGroup
  };
};

/**
 * Sets the id of this DomainInfo.
 * @param {string} id The id of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this DomainInfo.
 * @return {string} The id of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the domain of this DomainInfo.
 * @param {string} domain The domain of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.setDomain = function(domain) {
  this._domain = domain;
  return this;
};

/**
 * Provides the domain of this DomainInfo.
 * @return {string} The domain of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.getDomain = function() {
  return this._domain;
};

/**
 * Sets the validatedMxRecord of this DomainInfo.
 * @param {boolean} validatedMxRecord The validatedMxRecord of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.setValidatedMxRecord = function(validatedMxRecord) {
  this._validatedMxRecord = validatedMxRecord ? '1' : '0';
  return this;
};

/**
 * Provides the validatedMxRecord of this DomainInfo.
 * @return {boolean} The validatedMxRecord of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.getValidatedMxRecord = function() {
  return this._validatedMxRecord != '0';
};

/**
 * Sets the catchAllUserGroup of this DomainInfo.
 * @param {string} catchAllUserGroup The catchAllUserGroup of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.setCatchAllUserGroup = function(catchAllUserGroup) {
  this._catchAllUserGroup = catchAllUserGroup;
  return this;
};

/**
 * Provides the catchAllUserGroup of this DomainInfo.
 * @return {string} The catchAllUserGroup of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.getCatchAllUserGroup = function() {
  return this._catchAllUserGroup;
};

/**
 * Loads the catchAllUserGroup of this DomainInfo.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded catchAllUserGroup of this DomainInfo or an exception if the loading failed.
 */
tutao.entity.sys.DomainInfo.prototype.loadCatchAllUserGroup = function() {
  return tutao.entity.sys.Group.load(this._catchAllUserGroup);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.DomainInfo.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
