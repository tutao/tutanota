"use strict";

tutao.provide('tutao.entity.tutanota.DraftData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._bodyText = null;
    this._bodyText_ = null;
    this._confidential = null;
    this._confidential_ = null;
    this._senderMailAddress = null;
    this._senderName = null;
    this._senderName_ = null;
    this._subject = null;
    this._subject_ = null;
    this._addedAttachments = [];
    this._bccRecipients = [];
    this._ccRecipients = [];
    this._removedAttachments = [];
    this._toRecipients = [];
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.DraftData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._bodyText = data.bodyText;
  this._bodyText_ = null;
  this._confidential = data.confidential;
  this._confidential_ = null;
  this._senderMailAddress = data.senderMailAddress;
  this._senderName = data.senderName;
  this._senderName_ = null;
  this._subject = data.subject;
  this._subject_ = null;
  this._addedAttachments = [];
  for (var i=0; i < data.addedAttachments.length; i++) {
    this._addedAttachments.push(new tutao.entity.tutanota.DraftAttachment(parent, data.addedAttachments[i]));
  }
  this._bccRecipients = [];
  for (var i=0; i < data.bccRecipients.length; i++) {
    this._bccRecipients.push(new tutao.entity.tutanota.DraftRecipient(parent, data.bccRecipients[i]));
  }
  this._ccRecipients = [];
  for (var i=0; i < data.ccRecipients.length; i++) {
    this._ccRecipients.push(new tutao.entity.tutanota.DraftRecipient(parent, data.ccRecipients[i]));
  }
  this._removedAttachments = data.removedAttachments;
  this._toRecipients = [];
  for (var i=0; i < data.toRecipients.length; i++) {
    this._toRecipients.push(new tutao.entity.tutanota.DraftRecipient(parent, data.toRecipients[i]));
  }
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DraftData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    bodyText: this._bodyText, 
    confidential: this._confidential, 
    senderMailAddress: this._senderMailAddress, 
    senderName: this._senderName, 
    subject: this._subject, 
    addedAttachments: tutao.entity.EntityHelper.aggregatesToJsonData(this._addedAttachments), 
    bccRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._bccRecipients), 
    ccRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._ccRecipients), 
    removedAttachments: this._removedAttachments, 
    toRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._toRecipients)
  };
};

/**
 * The id of the DraftData type.
 */
tutao.entity.tutanota.DraftData.prototype.TYPE_ID = 496;

/**
 * The id of the bodyText attribute.
 */
tutao.entity.tutanota.DraftData.prototype.BODYTEXT_ATTRIBUTE_ID = 499;

/**
 * The id of the confidential attribute.
 */
tutao.entity.tutanota.DraftData.prototype.CONFIDENTIAL_ATTRIBUTE_ID = 502;

/**
 * The id of the senderMailAddress attribute.
 */
tutao.entity.tutanota.DraftData.prototype.SENDERMAILADDRESS_ATTRIBUTE_ID = 500;

/**
 * The id of the senderName attribute.
 */
tutao.entity.tutanota.DraftData.prototype.SENDERNAME_ATTRIBUTE_ID = 501;

/**
 * The id of the subject attribute.
 */
tutao.entity.tutanota.DraftData.prototype.SUBJECT_ATTRIBUTE_ID = 498;

/**
 * The id of the addedAttachments attribute.
 */
tutao.entity.tutanota.DraftData.prototype.ADDEDATTACHMENTS_ATTRIBUTE_ID = 506;

/**
 * The id of the bccRecipients attribute.
 */
tutao.entity.tutanota.DraftData.prototype.BCCRECIPIENTS_ATTRIBUTE_ID = 505;

/**
 * The id of the ccRecipients attribute.
 */
tutao.entity.tutanota.DraftData.prototype.CCRECIPIENTS_ATTRIBUTE_ID = 504;

/**
 * The id of the removedAttachments attribute.
 */
tutao.entity.tutanota.DraftData.prototype.REMOVEDATTACHMENTS_ATTRIBUTE_ID = 507;

/**
 * The id of the toRecipients attribute.
 */
tutao.entity.tutanota.DraftData.prototype.TORECIPIENTS_ATTRIBUTE_ID = 503;

/**
 * Sets the id of this DraftData.
 * @param {string} id The id of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this DraftData.
 * @return {string} The id of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the bodyText of this DraftData.
 * @param {string} bodyText The bodyText of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.setBodyText = function(bodyText) {
  var dataToEncrypt = bodyText;
  this._bodyText = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._bodyText_ = bodyText;
  return this;
};

/**
 * Provides the bodyText of this DraftData.
 * @return {string} The bodyText of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.getBodyText = function() {
  if (this._bodyText_ != null) {
    return this._bodyText_;
  }
  if (this._bodyText == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._bodyText);
    this._bodyText_ = value;
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
 * Sets the confidential of this DraftData.
 * @param {boolean} confidential The confidential of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.setConfidential = function(confidential) {
  var dataToEncrypt = (confidential) ? '1' : '0';
  this._confidential = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._confidential_ = confidential;
  return this;
};

/**
 * Provides the confidential of this DraftData.
 * @return {boolean} The confidential of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.getConfidential = function() {
  if (this._confidential_ != null) {
    return this._confidential_;
  }
  if (this._confidential == "" || !this._parent._entityHelper.getSessionKey()) {
    return false;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._confidential);
    this._confidential_ = (value != '0');
    return this._confidential_;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return false;
    } else {
      throw e;
    }
  }
};

/**
 * Sets the senderMailAddress of this DraftData.
 * @param {string} senderMailAddress The senderMailAddress of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.setSenderMailAddress = function(senderMailAddress) {
  this._senderMailAddress = senderMailAddress;
  return this;
};

/**
 * Provides the senderMailAddress of this DraftData.
 * @return {string} The senderMailAddress of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.getSenderMailAddress = function() {
  return this._senderMailAddress;
};

/**
 * Sets the senderName of this DraftData.
 * @param {string} senderName The senderName of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.setSenderName = function(senderName) {
  var dataToEncrypt = senderName;
  this._senderName = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._senderName_ = senderName;
  return this;
};

/**
 * Provides the senderName of this DraftData.
 * @return {string} The senderName of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.getSenderName = function() {
  if (this._senderName_ != null) {
    return this._senderName_;
  }
  if (this._senderName == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._senderName);
    this._senderName_ = value;
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
 * Sets the subject of this DraftData.
 * @param {string} subject The subject of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.setSubject = function(subject) {
  var dataToEncrypt = subject;
  this._subject = tutao.locator.aesCrypter.encryptUtf8(this._parent._entityHelper.getSessionKey(), dataToEncrypt);
  this._subject_ = subject;
  return this;
};

/**
 * Provides the subject of this DraftData.
 * @return {string} The subject of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.getSubject = function() {
  if (this._subject_ != null) {
    return this._subject_;
  }
  if (this._subject == "" || !this._parent._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._parent._entityHelper.getSessionKey(), this._subject);
    this._subject_ = value;
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
 * Provides the addedAttachments of this DraftData.
 * @return {Array.<tutao.entity.tutanota.DraftAttachment>} The addedAttachments of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.getAddedAttachments = function() {
  return this._addedAttachments;
};

/**
 * Provides the bccRecipients of this DraftData.
 * @return {Array.<tutao.entity.tutanota.DraftRecipient>} The bccRecipients of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.getBccRecipients = function() {
  return this._bccRecipients;
};

/**
 * Provides the ccRecipients of this DraftData.
 * @return {Array.<tutao.entity.tutanota.DraftRecipient>} The ccRecipients of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.getCcRecipients = function() {
  return this._ccRecipients;
};

/**
 * Provides the removedAttachments of this DraftData.
 * @return {Array.<Array.<string>>} The removedAttachments of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.getRemovedAttachments = function() {
  return this._removedAttachments;
};

/**
 * Provides the toRecipients of this DraftData.
 * @return {Array.<tutao.entity.tutanota.DraftRecipient>} The toRecipients of this DraftData.
 */
tutao.entity.tutanota.DraftData.prototype.getToRecipients = function() {
  return this._toRecipients;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.DraftData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
