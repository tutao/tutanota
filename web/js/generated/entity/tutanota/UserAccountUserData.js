"use strict";

tutao.provide('tutao.entity.tutanota.UserAccountUserData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UserAccountUserData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._contactEncContactListSessionKey = null;
    this._customerEncContactGroupInfoSessionKey = null;
    this._customerEncFileGroupInfoSessionKey = null;
    this._customerEncMailGroupInfoSessionKey = null;
    this._encryptedName = null;
    this._fileEncFileSystemSessionKey = null;
    this._mailAddress = null;
    this._mailEncMailBoxSessionKey = null;
    this._pwEncUserGroupKey = null;
    this._salt = null;
    this._userEncClientKey = null;
    this._userEncContactGroupKey = null;
    this._userEncCustomerGroupKey = null;
    this._userEncEntropy = null;
    this._userEncFileGroupKey = null;
    this._userEncMailGroupKey = null;
    this._userEncTutanotaPropertiesSessionKey = null;
    this._verifier = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.UserAccountUserData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._contactEncContactListSessionKey = data.contactEncContactListSessionKey;
  this._customerEncContactGroupInfoSessionKey = data.customerEncContactGroupInfoSessionKey;
  this._customerEncFileGroupInfoSessionKey = data.customerEncFileGroupInfoSessionKey;
  this._customerEncMailGroupInfoSessionKey = data.customerEncMailGroupInfoSessionKey;
  this._encryptedName = data.encryptedName;
  this._fileEncFileSystemSessionKey = data.fileEncFileSystemSessionKey;
  this._mailAddress = data.mailAddress;
  this._mailEncMailBoxSessionKey = data.mailEncMailBoxSessionKey;
  this._pwEncUserGroupKey = data.pwEncUserGroupKey;
  this._salt = data.salt;
  this._userEncClientKey = data.userEncClientKey;
  this._userEncContactGroupKey = data.userEncContactGroupKey;
  this._userEncCustomerGroupKey = data.userEncCustomerGroupKey;
  this._userEncEntropy = data.userEncEntropy;
  this._userEncFileGroupKey = data.userEncFileGroupKey;
  this._userEncMailGroupKey = data.userEncMailGroupKey;
  this._userEncTutanotaPropertiesSessionKey = data.userEncTutanotaPropertiesSessionKey;
  this._verifier = data.verifier;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    contactEncContactListSessionKey: this._contactEncContactListSessionKey, 
    customerEncContactGroupInfoSessionKey: this._customerEncContactGroupInfoSessionKey, 
    customerEncFileGroupInfoSessionKey: this._customerEncFileGroupInfoSessionKey, 
    customerEncMailGroupInfoSessionKey: this._customerEncMailGroupInfoSessionKey, 
    encryptedName: this._encryptedName, 
    fileEncFileSystemSessionKey: this._fileEncFileSystemSessionKey, 
    mailAddress: this._mailAddress, 
    mailEncMailBoxSessionKey: this._mailEncMailBoxSessionKey, 
    pwEncUserGroupKey: this._pwEncUserGroupKey, 
    salt: this._salt, 
    userEncClientKey: this._userEncClientKey, 
    userEncContactGroupKey: this._userEncContactGroupKey, 
    userEncCustomerGroupKey: this._userEncCustomerGroupKey, 
    userEncEntropy: this._userEncEntropy, 
    userEncFileGroupKey: this._userEncFileGroupKey, 
    userEncMailGroupKey: this._userEncMailGroupKey, 
    userEncTutanotaPropertiesSessionKey: this._userEncTutanotaPropertiesSessionKey, 
    verifier: this._verifier
  };
};

/**
 * Sets the id of this UserAccountUserData.
 * @param {string} id The id of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this UserAccountUserData.
 * @return {string} The id of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the contactEncContactListSessionKey of this UserAccountUserData.
 * @param {string} contactEncContactListSessionKey The contactEncContactListSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setContactEncContactListSessionKey = function(contactEncContactListSessionKey) {
  this._contactEncContactListSessionKey = contactEncContactListSessionKey;
  return this;
};

/**
 * Provides the contactEncContactListSessionKey of this UserAccountUserData.
 * @return {string} The contactEncContactListSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getContactEncContactListSessionKey = function() {
  return this._contactEncContactListSessionKey;
};

/**
 * Sets the customerEncContactGroupInfoSessionKey of this UserAccountUserData.
 * @param {string} customerEncContactGroupInfoSessionKey The customerEncContactGroupInfoSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setCustomerEncContactGroupInfoSessionKey = function(customerEncContactGroupInfoSessionKey) {
  this._customerEncContactGroupInfoSessionKey = customerEncContactGroupInfoSessionKey;
  return this;
};

/**
 * Provides the customerEncContactGroupInfoSessionKey of this UserAccountUserData.
 * @return {string} The customerEncContactGroupInfoSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getCustomerEncContactGroupInfoSessionKey = function() {
  return this._customerEncContactGroupInfoSessionKey;
};

/**
 * Sets the customerEncFileGroupInfoSessionKey of this UserAccountUserData.
 * @param {string} customerEncFileGroupInfoSessionKey The customerEncFileGroupInfoSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setCustomerEncFileGroupInfoSessionKey = function(customerEncFileGroupInfoSessionKey) {
  this._customerEncFileGroupInfoSessionKey = customerEncFileGroupInfoSessionKey;
  return this;
};

/**
 * Provides the customerEncFileGroupInfoSessionKey of this UserAccountUserData.
 * @return {string} The customerEncFileGroupInfoSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getCustomerEncFileGroupInfoSessionKey = function() {
  return this._customerEncFileGroupInfoSessionKey;
};

/**
 * Sets the customerEncMailGroupInfoSessionKey of this UserAccountUserData.
 * @param {string} customerEncMailGroupInfoSessionKey The customerEncMailGroupInfoSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setCustomerEncMailGroupInfoSessionKey = function(customerEncMailGroupInfoSessionKey) {
  this._customerEncMailGroupInfoSessionKey = customerEncMailGroupInfoSessionKey;
  return this;
};

/**
 * Provides the customerEncMailGroupInfoSessionKey of this UserAccountUserData.
 * @return {string} The customerEncMailGroupInfoSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getCustomerEncMailGroupInfoSessionKey = function() {
  return this._customerEncMailGroupInfoSessionKey;
};

/**
 * Sets the encryptedName of this UserAccountUserData.
 * @param {string} encryptedName The encryptedName of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setEncryptedName = function(encryptedName) {
  this._encryptedName = encryptedName;
  return this;
};

/**
 * Provides the encryptedName of this UserAccountUserData.
 * @return {string} The encryptedName of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getEncryptedName = function() {
  return this._encryptedName;
};

/**
 * Sets the fileEncFileSystemSessionKey of this UserAccountUserData.
 * @param {string} fileEncFileSystemSessionKey The fileEncFileSystemSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setFileEncFileSystemSessionKey = function(fileEncFileSystemSessionKey) {
  this._fileEncFileSystemSessionKey = fileEncFileSystemSessionKey;
  return this;
};

/**
 * Provides the fileEncFileSystemSessionKey of this UserAccountUserData.
 * @return {string} The fileEncFileSystemSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getFileEncFileSystemSessionKey = function() {
  return this._fileEncFileSystemSessionKey;
};

/**
 * Sets the mailAddress of this UserAccountUserData.
 * @param {string} mailAddress The mailAddress of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this UserAccountUserData.
 * @return {string} The mailAddress of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the mailEncMailBoxSessionKey of this UserAccountUserData.
 * @param {string} mailEncMailBoxSessionKey The mailEncMailBoxSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setMailEncMailBoxSessionKey = function(mailEncMailBoxSessionKey) {
  this._mailEncMailBoxSessionKey = mailEncMailBoxSessionKey;
  return this;
};

/**
 * Provides the mailEncMailBoxSessionKey of this UserAccountUserData.
 * @return {string} The mailEncMailBoxSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getMailEncMailBoxSessionKey = function() {
  return this._mailEncMailBoxSessionKey;
};

/**
 * Sets the pwEncUserGroupKey of this UserAccountUserData.
 * @param {string} pwEncUserGroupKey The pwEncUserGroupKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setPwEncUserGroupKey = function(pwEncUserGroupKey) {
  this._pwEncUserGroupKey = pwEncUserGroupKey;
  return this;
};

/**
 * Provides the pwEncUserGroupKey of this UserAccountUserData.
 * @return {string} The pwEncUserGroupKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getPwEncUserGroupKey = function() {
  return this._pwEncUserGroupKey;
};

/**
 * Sets the salt of this UserAccountUserData.
 * @param {string} salt The salt of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setSalt = function(salt) {
  this._salt = salt;
  return this;
};

/**
 * Provides the salt of this UserAccountUserData.
 * @return {string} The salt of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getSalt = function() {
  return this._salt;
};

/**
 * Sets the userEncClientKey of this UserAccountUserData.
 * @param {string} userEncClientKey The userEncClientKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setUserEncClientKey = function(userEncClientKey) {
  this._userEncClientKey = userEncClientKey;
  return this;
};

/**
 * Provides the userEncClientKey of this UserAccountUserData.
 * @return {string} The userEncClientKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getUserEncClientKey = function() {
  return this._userEncClientKey;
};

/**
 * Sets the userEncContactGroupKey of this UserAccountUserData.
 * @param {string} userEncContactGroupKey The userEncContactGroupKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setUserEncContactGroupKey = function(userEncContactGroupKey) {
  this._userEncContactGroupKey = userEncContactGroupKey;
  return this;
};

/**
 * Provides the userEncContactGroupKey of this UserAccountUserData.
 * @return {string} The userEncContactGroupKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getUserEncContactGroupKey = function() {
  return this._userEncContactGroupKey;
};

/**
 * Sets the userEncCustomerGroupKey of this UserAccountUserData.
 * @param {string} userEncCustomerGroupKey The userEncCustomerGroupKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setUserEncCustomerGroupKey = function(userEncCustomerGroupKey) {
  this._userEncCustomerGroupKey = userEncCustomerGroupKey;
  return this;
};

/**
 * Provides the userEncCustomerGroupKey of this UserAccountUserData.
 * @return {string} The userEncCustomerGroupKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getUserEncCustomerGroupKey = function() {
  return this._userEncCustomerGroupKey;
};

/**
 * Sets the userEncEntropy of this UserAccountUserData.
 * @param {string} userEncEntropy The userEncEntropy of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setUserEncEntropy = function(userEncEntropy) {
  this._userEncEntropy = userEncEntropy;
  return this;
};

/**
 * Provides the userEncEntropy of this UserAccountUserData.
 * @return {string} The userEncEntropy of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getUserEncEntropy = function() {
  return this._userEncEntropy;
};

/**
 * Sets the userEncFileGroupKey of this UserAccountUserData.
 * @param {string} userEncFileGroupKey The userEncFileGroupKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setUserEncFileGroupKey = function(userEncFileGroupKey) {
  this._userEncFileGroupKey = userEncFileGroupKey;
  return this;
};

/**
 * Provides the userEncFileGroupKey of this UserAccountUserData.
 * @return {string} The userEncFileGroupKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getUserEncFileGroupKey = function() {
  return this._userEncFileGroupKey;
};

/**
 * Sets the userEncMailGroupKey of this UserAccountUserData.
 * @param {string} userEncMailGroupKey The userEncMailGroupKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setUserEncMailGroupKey = function(userEncMailGroupKey) {
  this._userEncMailGroupKey = userEncMailGroupKey;
  return this;
};

/**
 * Provides the userEncMailGroupKey of this UserAccountUserData.
 * @return {string} The userEncMailGroupKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getUserEncMailGroupKey = function() {
  return this._userEncMailGroupKey;
};

/**
 * Sets the userEncTutanotaPropertiesSessionKey of this UserAccountUserData.
 * @param {string} userEncTutanotaPropertiesSessionKey The userEncTutanotaPropertiesSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setUserEncTutanotaPropertiesSessionKey = function(userEncTutanotaPropertiesSessionKey) {
  this._userEncTutanotaPropertiesSessionKey = userEncTutanotaPropertiesSessionKey;
  return this;
};

/**
 * Provides the userEncTutanotaPropertiesSessionKey of this UserAccountUserData.
 * @return {string} The userEncTutanotaPropertiesSessionKey of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getUserEncTutanotaPropertiesSessionKey = function() {
  return this._userEncTutanotaPropertiesSessionKey;
};

/**
 * Sets the verifier of this UserAccountUserData.
 * @param {string} verifier The verifier of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.setVerifier = function(verifier) {
  this._verifier = verifier;
  return this;
};

/**
 * Provides the verifier of this UserAccountUserData.
 * @return {string} The verifier of this UserAccountUserData.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getVerifier = function() {
  return this._verifier;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.UserAccountUserData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
