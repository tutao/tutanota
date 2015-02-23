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
    this._adminEncGKey = null;
    this._encryptedName = null;
    this._groupInfoListEncSessionKey = null;
    this._mailAddress = null;
    this._symEncGKey = null;
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
  this._adminEncGKey = data.adminEncGKey;
  this._encryptedName = data.encryptedName;
  this._groupInfoListEncSessionKey = data.groupInfoListEncSessionKey;
  this._mailAddress = data.mailAddress;
  this._symEncGKey = data.symEncGKey;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    adminEncGKey: this._adminEncGKey, 
    encryptedName: this._encryptedName, 
    groupInfoListEncSessionKey: this._groupInfoListEncSessionKey, 
    mailAddress: this._mailAddress, 
    symEncGKey: this._symEncGKey
  };
};

/**
 * The id of the CreateExternalUserGroupData type.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.TYPE_ID = 138;

/**
 * The id of the adminEncGKey attribute.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.ADMINENCGKEY_ATTRIBUTE_ID = 143;

/**
 * The id of the encryptedName attribute.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.ENCRYPTEDNAME_ATTRIBUTE_ID = 140;

/**
 * The id of the groupInfoListEncSessionKey attribute.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.GROUPINFOLISTENCSESSIONKEY_ATTRIBUTE_ID = 144;

/**
 * The id of the mailAddress attribute.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.MAILADDRESS_ATTRIBUTE_ID = 141;

/**
 * The id of the symEncGKey attribute.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.SYMENCGKEY_ATTRIBUTE_ID = 142;

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
 * Sets the adminEncGKey of this CreateExternalUserGroupData.
 * @param {string} adminEncGKey The adminEncGKey of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.setAdminEncGKey = function(adminEncGKey) {
  this._adminEncGKey = adminEncGKey;
  return this;
};

/**
 * Provides the adminEncGKey of this CreateExternalUserGroupData.
 * @return {string} The adminEncGKey of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.getAdminEncGKey = function() {
  return this._adminEncGKey;
};

/**
 * Sets the encryptedName of this CreateExternalUserGroupData.
 * @param {string} encryptedName The encryptedName of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.setEncryptedName = function(encryptedName) {
  this._encryptedName = encryptedName;
  return this;
};

/**
 * Provides the encryptedName of this CreateExternalUserGroupData.
 * @return {string} The encryptedName of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.getEncryptedName = function() {
  return this._encryptedName;
};

/**
 * Sets the groupInfoListEncSessionKey of this CreateExternalUserGroupData.
 * @param {string} groupInfoListEncSessionKey The groupInfoListEncSessionKey of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.setGroupInfoListEncSessionKey = function(groupInfoListEncSessionKey) {
  this._groupInfoListEncSessionKey = groupInfoListEncSessionKey;
  return this;
};

/**
 * Provides the groupInfoListEncSessionKey of this CreateExternalUserGroupData.
 * @return {string} The groupInfoListEncSessionKey of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.getGroupInfoListEncSessionKey = function() {
  return this._groupInfoListEncSessionKey;
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
 * Sets the symEncGKey of this CreateExternalUserGroupData.
 * @param {string} symEncGKey The symEncGKey of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.setSymEncGKey = function(symEncGKey) {
  this._symEncGKey = symEncGKey;
  return this;
};

/**
 * Provides the symEncGKey of this CreateExternalUserGroupData.
 * @return {string} The symEncGKey of this CreateExternalUserGroupData.
 */
tutao.entity.tutanota.CreateExternalUserGroupData.prototype.getSymEncGKey = function() {
  return this._symEncGKey;
};
