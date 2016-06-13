"use strict";

tutao.provide('tutao.entity.tutanota.SecureExternalRecipientKeyData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._autoTransmitPassword = null;
    this._mailAddress = null;
    this._ownerEncBucketKey = null;
    this._passwordVerifier = null;
    this._pwEncCommunicationKey = null;
    this._salt = null;
    this._saltHash = null;
    this._symEncBucketKey = null;
    this._passwordChannelPhoneNumbers = [];
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._autoTransmitPassword = data.autoTransmitPassword;
  this._mailAddress = data.mailAddress;
  this._ownerEncBucketKey = data.ownerEncBucketKey;
  this._passwordVerifier = data.passwordVerifier;
  this._pwEncCommunicationKey = data.pwEncCommunicationKey;
  this._salt = data.salt;
  this._saltHash = data.saltHash;
  this._symEncBucketKey = data.symEncBucketKey;
  this._passwordChannelPhoneNumbers = [];
  for (var i=0; i < data.passwordChannelPhoneNumbers.length; i++) {
    this._passwordChannelPhoneNumbers.push(new tutao.entity.tutanota.PasswordChannelPhoneNumber(parent, data.passwordChannelPhoneNumbers[i]));
  }
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    autoTransmitPassword: this._autoTransmitPassword, 
    mailAddress: this._mailAddress, 
    ownerEncBucketKey: this._ownerEncBucketKey, 
    passwordVerifier: this._passwordVerifier, 
    pwEncCommunicationKey: this._pwEncCommunicationKey, 
    salt: this._salt, 
    saltHash: this._saltHash, 
    symEncBucketKey: this._symEncBucketKey, 
    passwordChannelPhoneNumbers: tutao.entity.EntityHelper.aggregatesToJsonData(this._passwordChannelPhoneNumbers)
  };
};

/**
 * Sets the id of this SecureExternalRecipientKeyData.
 * @param {string} id The id of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this SecureExternalRecipientKeyData.
 * @return {string} The id of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the autoTransmitPassword of this SecureExternalRecipientKeyData.
 * @param {string} autoTransmitPassword The autoTransmitPassword of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.setAutoTransmitPassword = function(autoTransmitPassword) {
  this._autoTransmitPassword = autoTransmitPassword;
  return this;
};

/**
 * Provides the autoTransmitPassword of this SecureExternalRecipientKeyData.
 * @return {string} The autoTransmitPassword of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.getAutoTransmitPassword = function() {
  return this._autoTransmitPassword;
};

/**
 * Sets the mailAddress of this SecureExternalRecipientKeyData.
 * @param {string} mailAddress The mailAddress of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this SecureExternalRecipientKeyData.
 * @return {string} The mailAddress of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the ownerEncBucketKey of this SecureExternalRecipientKeyData.
 * @param {string} ownerEncBucketKey The ownerEncBucketKey of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.setOwnerEncBucketKey = function(ownerEncBucketKey) {
  this._ownerEncBucketKey = ownerEncBucketKey;
  return this;
};

/**
 * Provides the ownerEncBucketKey of this SecureExternalRecipientKeyData.
 * @return {string} The ownerEncBucketKey of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.getOwnerEncBucketKey = function() {
  return this._ownerEncBucketKey;
};

/**
 * Sets the passwordVerifier of this SecureExternalRecipientKeyData.
 * @param {string} passwordVerifier The passwordVerifier of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.setPasswordVerifier = function(passwordVerifier) {
  this._passwordVerifier = passwordVerifier;
  return this;
};

/**
 * Provides the passwordVerifier of this SecureExternalRecipientKeyData.
 * @return {string} The passwordVerifier of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.getPasswordVerifier = function() {
  return this._passwordVerifier;
};

/**
 * Sets the pwEncCommunicationKey of this SecureExternalRecipientKeyData.
 * @param {string} pwEncCommunicationKey The pwEncCommunicationKey of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.setPwEncCommunicationKey = function(pwEncCommunicationKey) {
  this._pwEncCommunicationKey = pwEncCommunicationKey;
  return this;
};

/**
 * Provides the pwEncCommunicationKey of this SecureExternalRecipientKeyData.
 * @return {string} The pwEncCommunicationKey of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.getPwEncCommunicationKey = function() {
  return this._pwEncCommunicationKey;
};

/**
 * Sets the salt of this SecureExternalRecipientKeyData.
 * @param {string} salt The salt of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.setSalt = function(salt) {
  this._salt = salt;
  return this;
};

/**
 * Provides the salt of this SecureExternalRecipientKeyData.
 * @return {string} The salt of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.getSalt = function() {
  return this._salt;
};

/**
 * Sets the saltHash of this SecureExternalRecipientKeyData.
 * @param {string} saltHash The saltHash of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.setSaltHash = function(saltHash) {
  this._saltHash = saltHash;
  return this;
};

/**
 * Provides the saltHash of this SecureExternalRecipientKeyData.
 * @return {string} The saltHash of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.getSaltHash = function() {
  return this._saltHash;
};

/**
 * Sets the symEncBucketKey of this SecureExternalRecipientKeyData.
 * @param {string} symEncBucketKey The symEncBucketKey of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.setSymEncBucketKey = function(symEncBucketKey) {
  this._symEncBucketKey = symEncBucketKey;
  return this;
};

/**
 * Provides the symEncBucketKey of this SecureExternalRecipientKeyData.
 * @return {string} The symEncBucketKey of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.getSymEncBucketKey = function() {
  return this._symEncBucketKey;
};

/**
 * Provides the passwordChannelPhoneNumbers of this SecureExternalRecipientKeyData.
 * @return {Array.<tutao.entity.tutanota.PasswordChannelPhoneNumber>} The passwordChannelPhoneNumbers of this SecureExternalRecipientKeyData.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.getPasswordChannelPhoneNumbers = function() {
  return this._passwordChannelPhoneNumbers;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.SecureExternalRecipientKeyData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
