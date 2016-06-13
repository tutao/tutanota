"use strict";

tutao.provide('tutao.entity.tutanota.InternalRecipientKeyData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.InternalRecipientKeyData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._mailAddress = null;
    this._pubEncBucketKey = null;
    this._pubKeyVersion = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.InternalRecipientKeyData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.InternalRecipientKeyData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._mailAddress = data.mailAddress;
  this._pubEncBucketKey = data.pubEncBucketKey;
  this._pubKeyVersion = data.pubKeyVersion;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.InternalRecipientKeyData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    mailAddress: this._mailAddress, 
    pubEncBucketKey: this._pubEncBucketKey, 
    pubKeyVersion: this._pubKeyVersion
  };
};

/**
 * Sets the id of this InternalRecipientKeyData.
 * @param {string} id The id of this InternalRecipientKeyData.
 */
tutao.entity.tutanota.InternalRecipientKeyData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this InternalRecipientKeyData.
 * @return {string} The id of this InternalRecipientKeyData.
 */
tutao.entity.tutanota.InternalRecipientKeyData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the mailAddress of this InternalRecipientKeyData.
 * @param {string} mailAddress The mailAddress of this InternalRecipientKeyData.
 */
tutao.entity.tutanota.InternalRecipientKeyData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this InternalRecipientKeyData.
 * @return {string} The mailAddress of this InternalRecipientKeyData.
 */
tutao.entity.tutanota.InternalRecipientKeyData.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the pubEncBucketKey of this InternalRecipientKeyData.
 * @param {string} pubEncBucketKey The pubEncBucketKey of this InternalRecipientKeyData.
 */
tutao.entity.tutanota.InternalRecipientKeyData.prototype.setPubEncBucketKey = function(pubEncBucketKey) {
  this._pubEncBucketKey = pubEncBucketKey;
  return this;
};

/**
 * Provides the pubEncBucketKey of this InternalRecipientKeyData.
 * @return {string} The pubEncBucketKey of this InternalRecipientKeyData.
 */
tutao.entity.tutanota.InternalRecipientKeyData.prototype.getPubEncBucketKey = function() {
  return this._pubEncBucketKey;
};

/**
 * Sets the pubKeyVersion of this InternalRecipientKeyData.
 * @param {string} pubKeyVersion The pubKeyVersion of this InternalRecipientKeyData.
 */
tutao.entity.tutanota.InternalRecipientKeyData.prototype.setPubKeyVersion = function(pubKeyVersion) {
  this._pubKeyVersion = pubKeyVersion;
  return this;
};

/**
 * Provides the pubKeyVersion of this InternalRecipientKeyData.
 * @return {string} The pubKeyVersion of this InternalRecipientKeyData.
 */
tutao.entity.tutanota.InternalRecipientKeyData.prototype.getPubKeyVersion = function() {
  return this._pubKeyVersion;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.InternalRecipientKeyData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
