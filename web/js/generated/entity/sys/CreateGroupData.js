"use strict";

tutao.provide('tutao.entity.sys.CreateGroupData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CreateGroupData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._adminEncGKey = null;
    this._encryptedName = null;
    this._listEncSessionKey = null;
    this._mailAddress = null;
    this._pubKey = null;
    this._symEncGKey = null;
    this._symEncPrivKey = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.CreateGroupData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CreateGroupData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._adminEncGKey = data.adminEncGKey;
  this._encryptedName = data.encryptedName;
  this._listEncSessionKey = data.listEncSessionKey;
  this._mailAddress = data.mailAddress;
  this._pubKey = data.pubKey;
  this._symEncGKey = data.symEncGKey;
  this._symEncPrivKey = data.symEncPrivKey;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CreateGroupData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    adminEncGKey: this._adminEncGKey, 
    encryptedName: this._encryptedName, 
    listEncSessionKey: this._listEncSessionKey, 
    mailAddress: this._mailAddress, 
    pubKey: this._pubKey, 
    symEncGKey: this._symEncGKey, 
    symEncPrivKey: this._symEncPrivKey
  };
};

/**
 * Sets the id of this CreateGroupData.
 * @param {string} id The id of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this CreateGroupData.
 * @return {string} The id of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the adminEncGKey of this CreateGroupData.
 * @param {string} adminEncGKey The adminEncGKey of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.setAdminEncGKey = function(adminEncGKey) {
  this._adminEncGKey = adminEncGKey;
  return this;
};

/**
 * Provides the adminEncGKey of this CreateGroupData.
 * @return {string} The adminEncGKey of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.getAdminEncGKey = function() {
  return this._adminEncGKey;
};

/**
 * Sets the encryptedName of this CreateGroupData.
 * @param {string} encryptedName The encryptedName of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.setEncryptedName = function(encryptedName) {
  this._encryptedName = encryptedName;
  return this;
};

/**
 * Provides the encryptedName of this CreateGroupData.
 * @return {string} The encryptedName of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.getEncryptedName = function() {
  return this._encryptedName;
};

/**
 * Sets the listEncSessionKey of this CreateGroupData.
 * @param {string} listEncSessionKey The listEncSessionKey of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.setListEncSessionKey = function(listEncSessionKey) {
  this._listEncSessionKey = listEncSessionKey;
  return this;
};

/**
 * Provides the listEncSessionKey of this CreateGroupData.
 * @return {string} The listEncSessionKey of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.getListEncSessionKey = function() {
  return this._listEncSessionKey;
};

/**
 * Sets the mailAddress of this CreateGroupData.
 * @param {string} mailAddress The mailAddress of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this CreateGroupData.
 * @return {string} The mailAddress of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the pubKey of this CreateGroupData.
 * @param {string} pubKey The pubKey of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.setPubKey = function(pubKey) {
  this._pubKey = pubKey;
  return this;
};

/**
 * Provides the pubKey of this CreateGroupData.
 * @return {string} The pubKey of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.getPubKey = function() {
  return this._pubKey;
};

/**
 * Sets the symEncGKey of this CreateGroupData.
 * @param {string} symEncGKey The symEncGKey of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.setSymEncGKey = function(symEncGKey) {
  this._symEncGKey = symEncGKey;
  return this;
};

/**
 * Provides the symEncGKey of this CreateGroupData.
 * @return {string} The symEncGKey of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.getSymEncGKey = function() {
  return this._symEncGKey;
};

/**
 * Sets the symEncPrivKey of this CreateGroupData.
 * @param {string} symEncPrivKey The symEncPrivKey of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.setSymEncPrivKey = function(symEncPrivKey) {
  this._symEncPrivKey = symEncPrivKey;
  return this;
};

/**
 * Provides the symEncPrivKey of this CreateGroupData.
 * @return {string} The symEncPrivKey of this CreateGroupData.
 */
tutao.entity.sys.CreateGroupData.prototype.getSymEncPrivKey = function() {
  return this._symEncPrivKey;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CreateGroupData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
