"use strict";

tutao.provide('tutao.entity.tutanota.Recipient');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Recipient = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._autoTransmitPassword = null;
    this._mailAddress = null;
    this._name = null;
    this._name_ = null;
    this._ownerEncBucketKey = null;
    this._passwordVerifier = null;
    this._pubEncBucketKey = null;
    this._pubKeyVersion = null;
    this._pwEncCommunicationKey = null;
    this._salt = null;
    this._saltHash = null;
    this._symEncBucketKey = null;
    this._type = null;
    this._passwordChannelPhoneNumbers = [];
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.Recipient.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Recipient.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._autoTransmitPassword = data.autoTransmitPassword;
  this._mailAddress = data.mailAddress;
  this._name = data.name;
  this._name_ = null;
  this._ownerEncBucketKey = data.ownerEncBucketKey;
  this._passwordVerifier = data.passwordVerifier;
  this._pubEncBucketKey = data.pubEncBucketKey;
  this._pubKeyVersion = data.pubKeyVersion;
  this._pwEncCommunicationKey = data.pwEncCommunicationKey;
  this._salt = data.salt;
  this._saltHash = data.saltHash;
  this._symEncBucketKey = data.symEncBucketKey;
  this._type = data.type;
  this._passwordChannelPhoneNumbers = [];
  for (var i=0; i < data.passwordChannelPhoneNumbers.length; i++) {
    this._passwordChannelPhoneNumbers.push(new tutao.entity.tutanota.PasswordChannelPhoneNumber(parent, data.passwordChannelPhoneNumbers[i]));
  }
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.Recipient.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    autoTransmitPassword: this._autoTransmitPassword, 
    mailAddress: this._mailAddress, 
    name: this._name, 
    ownerEncBucketKey: this._ownerEncBucketKey, 
    passwordVerifier: this._passwordVerifier, 
    pubEncBucketKey: this._pubEncBucketKey, 
    pubKeyVersion: this._pubKeyVersion, 
    pwEncCommunicationKey: this._pwEncCommunicationKey, 
    salt: this._salt, 
    saltHash: this._saltHash, 
    symEncBucketKey: this._symEncBucketKey, 
    type: this._type, 
    passwordChannelPhoneNumbers: tutao.entity.EntityHelper.aggregatesToJsonData(this._passwordChannelPhoneNumbers)
  };
};

/**
 * Sets the id of this Recipient.
 * @param {string} id The id of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Recipient.
 * @return {string} The id of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the autoTransmitPassword of this Recipient.
 * @param {string} autoTransmitPassword The autoTransmitPassword of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setAutoTransmitPassword = function(autoTransmitPassword) {
  this._autoTransmitPassword = autoTransmitPassword;
  return this;
};

/**
 * Provides the autoTransmitPassword of this Recipient.
 * @return {string} The autoTransmitPassword of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getAutoTransmitPassword = function() {
  return this._autoTransmitPassword;
};

/**
 * Sets the mailAddress of this Recipient.
 * @param {string} mailAddress The mailAddress of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this Recipient.
 * @return {string} The mailAddress of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the name of this Recipient.
 * @param {string} name The name of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setName = function(name) {
  var dataToEncrypt = name;
  this._name = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._name_ = name;
  return this;
};

/**
 * Provides the name of this Recipient.
 * @return {string} The name of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getName = function() {
  if (this._name_ != null) {
    return this._name_;
  }
  if (this._name == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._name);
    this._name_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the ownerEncBucketKey of this Recipient.
 * @param {string} ownerEncBucketKey The ownerEncBucketKey of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setOwnerEncBucketKey = function(ownerEncBucketKey) {
  this._ownerEncBucketKey = ownerEncBucketKey;
  return this;
};

/**
 * Provides the ownerEncBucketKey of this Recipient.
 * @return {string} The ownerEncBucketKey of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getOwnerEncBucketKey = function() {
  return this._ownerEncBucketKey;
};

/**
 * Sets the passwordVerifier of this Recipient.
 * @param {string} passwordVerifier The passwordVerifier of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setPasswordVerifier = function(passwordVerifier) {
  this._passwordVerifier = passwordVerifier;
  return this;
};

/**
 * Provides the passwordVerifier of this Recipient.
 * @return {string} The passwordVerifier of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getPasswordVerifier = function() {
  return this._passwordVerifier;
};

/**
 * Sets the pubEncBucketKey of this Recipient.
 * @param {string} pubEncBucketKey The pubEncBucketKey of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setPubEncBucketKey = function(pubEncBucketKey) {
  this._pubEncBucketKey = pubEncBucketKey;
  return this;
};

/**
 * Provides the pubEncBucketKey of this Recipient.
 * @return {string} The pubEncBucketKey of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getPubEncBucketKey = function() {
  return this._pubEncBucketKey;
};

/**
 * Sets the pubKeyVersion of this Recipient.
 * @param {string} pubKeyVersion The pubKeyVersion of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setPubKeyVersion = function(pubKeyVersion) {
  this._pubKeyVersion = pubKeyVersion;
  return this;
};

/**
 * Provides the pubKeyVersion of this Recipient.
 * @return {string} The pubKeyVersion of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getPubKeyVersion = function() {
  return this._pubKeyVersion;
};

/**
 * Sets the pwEncCommunicationKey of this Recipient.
 * @param {string} pwEncCommunicationKey The pwEncCommunicationKey of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setPwEncCommunicationKey = function(pwEncCommunicationKey) {
  this._pwEncCommunicationKey = pwEncCommunicationKey;
  return this;
};

/**
 * Provides the pwEncCommunicationKey of this Recipient.
 * @return {string} The pwEncCommunicationKey of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getPwEncCommunicationKey = function() {
  return this._pwEncCommunicationKey;
};

/**
 * Sets the salt of this Recipient.
 * @param {string} salt The salt of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setSalt = function(salt) {
  this._salt = salt;
  return this;
};

/**
 * Provides the salt of this Recipient.
 * @return {string} The salt of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getSalt = function() {
  return this._salt;
};

/**
 * Sets the saltHash of this Recipient.
 * @param {string} saltHash The saltHash of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setSaltHash = function(saltHash) {
  this._saltHash = saltHash;
  return this;
};

/**
 * Provides the saltHash of this Recipient.
 * @return {string} The saltHash of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getSaltHash = function() {
  return this._saltHash;
};

/**
 * Sets the symEncBucketKey of this Recipient.
 * @param {string} symEncBucketKey The symEncBucketKey of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setSymEncBucketKey = function(symEncBucketKey) {
  this._symEncBucketKey = symEncBucketKey;
  return this;
};

/**
 * Provides the symEncBucketKey of this Recipient.
 * @return {string} The symEncBucketKey of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getSymEncBucketKey = function() {
  return this._symEncBucketKey;
};

/**
 * Sets the type of this Recipient.
 * @param {string} type The type of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this Recipient.
 * @return {string} The type of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getType = function() {
  return this._type;
};

/**
 * Provides the passwordChannelPhoneNumbers of this Recipient.
 * @return {Array.<tutao.entity.tutanota.PasswordChannelPhoneNumber>} The passwordChannelPhoneNumbers of this Recipient.
 */
tutao.entity.tutanota.Recipient.prototype.getPasswordChannelPhoneNumbers = function() {
  return this._passwordChannelPhoneNumbers;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.Recipient.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
