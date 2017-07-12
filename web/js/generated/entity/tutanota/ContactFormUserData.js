"use strict";

tutao.provide('tutao.entity.tutanota.ContactFormUserData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormUserData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._mailEncMailBoxSessionKey = null;
    this._ownerEncMailGroupInfoSessionKey = null;
    this._pwEncUserGroupKey = null;
    this._salt = null;
    this._userEncClientKey = null;
    this._userEncEntropy = null;
    this._userEncMailGroupKey = null;
    this._userEncTutanotaPropertiesSessionKey = null;
    this._verifier = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ContactFormUserData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._mailEncMailBoxSessionKey = data.mailEncMailBoxSessionKey;
  this._ownerEncMailGroupInfoSessionKey = data.ownerEncMailGroupInfoSessionKey;
  this._pwEncUserGroupKey = data.pwEncUserGroupKey;
  this._salt = data.salt;
  this._userEncClientKey = data.userEncClientKey;
  this._userEncEntropy = data.userEncEntropy;
  this._userEncMailGroupKey = data.userEncMailGroupKey;
  this._userEncTutanotaPropertiesSessionKey = data.userEncTutanotaPropertiesSessionKey;
  this._verifier = data.verifier;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    mailEncMailBoxSessionKey: this._mailEncMailBoxSessionKey, 
    ownerEncMailGroupInfoSessionKey: this._ownerEncMailGroupInfoSessionKey, 
    pwEncUserGroupKey: this._pwEncUserGroupKey, 
    salt: this._salt, 
    userEncClientKey: this._userEncClientKey, 
    userEncEntropy: this._userEncEntropy, 
    userEncMailGroupKey: this._userEncMailGroupKey, 
    userEncTutanotaPropertiesSessionKey: this._userEncTutanotaPropertiesSessionKey, 
    verifier: this._verifier
  };
};

/**
 * Sets the id of this ContactFormUserData.
 * @param {string} id The id of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ContactFormUserData.
 * @return {string} The id of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the mailEncMailBoxSessionKey of this ContactFormUserData.
 * @param {string} mailEncMailBoxSessionKey The mailEncMailBoxSessionKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.setMailEncMailBoxSessionKey = function(mailEncMailBoxSessionKey) {
  this._mailEncMailBoxSessionKey = mailEncMailBoxSessionKey;
  return this;
};

/**
 * Provides the mailEncMailBoxSessionKey of this ContactFormUserData.
 * @return {string} The mailEncMailBoxSessionKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.getMailEncMailBoxSessionKey = function() {
  return this._mailEncMailBoxSessionKey;
};

/**
 * Sets the ownerEncMailGroupInfoSessionKey of this ContactFormUserData.
 * @param {string} ownerEncMailGroupInfoSessionKey The ownerEncMailGroupInfoSessionKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.setOwnerEncMailGroupInfoSessionKey = function(ownerEncMailGroupInfoSessionKey) {
  this._ownerEncMailGroupInfoSessionKey = ownerEncMailGroupInfoSessionKey;
  return this;
};

/**
 * Provides the ownerEncMailGroupInfoSessionKey of this ContactFormUserData.
 * @return {string} The ownerEncMailGroupInfoSessionKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.getOwnerEncMailGroupInfoSessionKey = function() {
  return this._ownerEncMailGroupInfoSessionKey;
};

/**
 * Sets the pwEncUserGroupKey of this ContactFormUserData.
 * @param {string} pwEncUserGroupKey The pwEncUserGroupKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.setPwEncUserGroupKey = function(pwEncUserGroupKey) {
  this._pwEncUserGroupKey = pwEncUserGroupKey;
  return this;
};

/**
 * Provides the pwEncUserGroupKey of this ContactFormUserData.
 * @return {string} The pwEncUserGroupKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.getPwEncUserGroupKey = function() {
  return this._pwEncUserGroupKey;
};

/**
 * Sets the salt of this ContactFormUserData.
 * @param {string} salt The salt of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.setSalt = function(salt) {
  this._salt = salt;
  return this;
};

/**
 * Provides the salt of this ContactFormUserData.
 * @return {string} The salt of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.getSalt = function() {
  return this._salt;
};

/**
 * Sets the userEncClientKey of this ContactFormUserData.
 * @param {string} userEncClientKey The userEncClientKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.setUserEncClientKey = function(userEncClientKey) {
  this._userEncClientKey = userEncClientKey;
  return this;
};

/**
 * Provides the userEncClientKey of this ContactFormUserData.
 * @return {string} The userEncClientKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.getUserEncClientKey = function() {
  return this._userEncClientKey;
};

/**
 * Sets the userEncEntropy of this ContactFormUserData.
 * @param {string} userEncEntropy The userEncEntropy of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.setUserEncEntropy = function(userEncEntropy) {
  this._userEncEntropy = userEncEntropy;
  return this;
};

/**
 * Provides the userEncEntropy of this ContactFormUserData.
 * @return {string} The userEncEntropy of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.getUserEncEntropy = function() {
  return this._userEncEntropy;
};

/**
 * Sets the userEncMailGroupKey of this ContactFormUserData.
 * @param {string} userEncMailGroupKey The userEncMailGroupKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.setUserEncMailGroupKey = function(userEncMailGroupKey) {
  this._userEncMailGroupKey = userEncMailGroupKey;
  return this;
};

/**
 * Provides the userEncMailGroupKey of this ContactFormUserData.
 * @return {string} The userEncMailGroupKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.getUserEncMailGroupKey = function() {
  return this._userEncMailGroupKey;
};

/**
 * Sets the userEncTutanotaPropertiesSessionKey of this ContactFormUserData.
 * @param {string} userEncTutanotaPropertiesSessionKey The userEncTutanotaPropertiesSessionKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.setUserEncTutanotaPropertiesSessionKey = function(userEncTutanotaPropertiesSessionKey) {
  this._userEncTutanotaPropertiesSessionKey = userEncTutanotaPropertiesSessionKey;
  return this;
};

/**
 * Provides the userEncTutanotaPropertiesSessionKey of this ContactFormUserData.
 * @return {string} The userEncTutanotaPropertiesSessionKey of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.getUserEncTutanotaPropertiesSessionKey = function() {
  return this._userEncTutanotaPropertiesSessionKey;
};

/**
 * Sets the verifier of this ContactFormUserData.
 * @param {string} verifier The verifier of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.setVerifier = function(verifier) {
  this._verifier = verifier;
  return this;
};

/**
 * Provides the verifier of this ContactFormUserData.
 * @return {string} The verifier of this ContactFormUserData.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.getVerifier = function() {
  return this._verifier;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ContactFormUserData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
