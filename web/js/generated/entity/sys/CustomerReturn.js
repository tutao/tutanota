"use strict";

tutao.provide('tutao.entity.sys.CustomerReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._adminUser = null;
    this._adminUserGroup = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CustomerReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._adminUser = data.adminUser;
  this._adminUserGroup = data.adminUserGroup;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CustomerReturn.MODEL_VERSION = '17';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CustomerReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CustomerReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    adminUser: this._adminUser, 
    adminUserGroup: this._adminUserGroup
  };
};

/**
 * Sets the format of this CustomerReturn.
 * @param {string} format The format of this CustomerReturn.
 */
tutao.entity.sys.CustomerReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CustomerReturn.
 * @return {string} The format of this CustomerReturn.
 */
tutao.entity.sys.CustomerReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the adminUser of this CustomerReturn.
 * @param {string} adminUser The adminUser of this CustomerReturn.
 */
tutao.entity.sys.CustomerReturn.prototype.setAdminUser = function(adminUser) {
  this._adminUser = adminUser;
  return this;
};

/**
 * Provides the adminUser of this CustomerReturn.
 * @return {string} The adminUser of this CustomerReturn.
 */
tutao.entity.sys.CustomerReturn.prototype.getAdminUser = function() {
  return this._adminUser;
};

/**
 * Loads the adminUser of this CustomerReturn.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded adminUser of this CustomerReturn or an exception if the loading failed.
 */
tutao.entity.sys.CustomerReturn.prototype.loadAdminUser = function() {
  return tutao.entity.sys.User.load(this._adminUser);
};

/**
 * Sets the adminUserGroup of this CustomerReturn.
 * @param {string} adminUserGroup The adminUserGroup of this CustomerReturn.
 */
tutao.entity.sys.CustomerReturn.prototype.setAdminUserGroup = function(adminUserGroup) {
  this._adminUserGroup = adminUserGroup;
  return this;
};

/**
 * Provides the adminUserGroup of this CustomerReturn.
 * @return {string} The adminUserGroup of this CustomerReturn.
 */
tutao.entity.sys.CustomerReturn.prototype.getAdminUserGroup = function() {
  return this._adminUserGroup;
};

/**
 * Loads the adminUserGroup of this CustomerReturn.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded adminUserGroup of this CustomerReturn or an exception if the loading failed.
 */
tutao.entity.sys.CustomerReturn.prototype.loadAdminUserGroup = function() {
  return tutao.entity.sys.Group.load(this._adminUserGroup);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CustomerReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
