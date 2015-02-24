"use strict";

tutao.provide('tutao.entity.base.PersistenceResourcePostReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.base.PersistenceResourcePostReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._generatedId = null;
    this._permissionListId = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.base.PersistenceResourcePostReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._generatedId = data.generatedId;
  this._permissionListId = data.permissionListId;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.base.PersistenceResourcePostReturn.MODEL_VERSION = '1';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    generatedId: this._generatedId, 
    permissionListId: this._permissionListId
  };
};

/**
 * The id of the PersistenceResourcePostReturn type.
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.TYPE_ID = 0;

/**
 * The id of the generatedId attribute.
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.GENERATEDID_ATTRIBUTE_ID = 2;

/**
 * The id of the permissionListId attribute.
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.PERMISSIONLISTID_ATTRIBUTE_ID = 3;

/**
 * Sets the format of this PersistenceResourcePostReturn.
 * @param {string} format The format of this PersistenceResourcePostReturn.
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PersistenceResourcePostReturn.
 * @return {string} The format of this PersistenceResourcePostReturn.
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the generatedId of this PersistenceResourcePostReturn.
 * @param {string} generatedId The generatedId of this PersistenceResourcePostReturn.
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.setGeneratedId = function(generatedId) {
  this._generatedId = generatedId;
  return this;
};

/**
 * Provides the generatedId of this PersistenceResourcePostReturn.
 * @return {string} The generatedId of this PersistenceResourcePostReturn.
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.getGeneratedId = function() {
  return this._generatedId;
};

/**
 * Sets the permissionListId of this PersistenceResourcePostReturn.
 * @param {string} permissionListId The permissionListId of this PersistenceResourcePostReturn.
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.setPermissionListId = function(permissionListId) {
  this._permissionListId = permissionListId;
  return this;
};

/**
 * Provides the permissionListId of this PersistenceResourcePostReturn.
 * @return {string} The permissionListId of this PersistenceResourcePostReturn.
 */
tutao.entity.base.PersistenceResourcePostReturn.prototype.getPermissionListId = function() {
  return this._permissionListId;
};
