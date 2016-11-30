"use strict";

tutao.provide('tutao.entity.tutanota.CreateExternalUserGroupData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateExternalUserGroupData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._internalUserEncUserGroupKey = null;
    this._mailAddress = null;
    this._externalPwEncUserGroupKey = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.CreateExternalUserGroupData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._internalUserEncUserGroupKey = data.internalUserEncUserGroupKey;
  this._mailAddress = data.mailAddress;
  this._externalPwEncUserGroupKey = data.externalPwEncUserGroupKey;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    internalUserEncUserGroupKey: this._internalUserEncUserGroupKey, 
    mailAddress: this._mailAddress, 
    externalPwEncUserGroupKey: this._externalPwEncUserGroupKey
  };
};

/**
 * Sets the id of this CreateExternalUserGroupData.
 * @param {string} id The id of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this CreateExternalUserGroupData.
 * @return {string} The id of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the internalUserEncUserGroupKey of this CreateExternalUserGroupData.
 * @param {string} internalUserEncUserGroupKey The internalUserEncUserGroupKey of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.setInternalUserEncUserGroupKey = function(internalUserEncUserGroupKey) {
  this._internalUserEncUserGroupKey = internalUserEncUserGroupKey;
  return this;
};

/**
 * Provides the internalUserEncUserGroupKey of this CreateExternalUserGroupData.
 * @return {string} The internalUserEncUserGroupKey of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.getInternalUserEncUserGroupKey = function() {
  return this._internalUserEncUserGroupKey;
};

/**
 * Sets the mailAddress of this CreateExternalUserGroupData.
 * @param {string} mailAddress The mailAddress of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this CreateExternalUserGroupData.
 * @return {string} The mailAddress of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the externalPwEncUserGroupKey of this CreateExternalUserGroupData.
 * @param {string} externalPwEncUserGroupKey The externalPwEncUserGroupKey of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.setExternalPwEncUserGroupKey = function(externalPwEncUserGroupKey) {
  this._externalPwEncUserGroupKey = externalPwEncUserGroupKey;
  return this;
};

/**
 * Provides the externalPwEncUserGroupKey of this CreateExternalUserGroupData.
 * @return {string} The externalPwEncUserGroupKey of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.getExternalPwEncUserGroupKey = function() {
  return this._externalPwEncUserGroupKey;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
