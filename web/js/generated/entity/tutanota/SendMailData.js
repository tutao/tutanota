"use strict";

tutao.provide('tutao.entity.tutanota.SendMailData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendMailData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._bodyText = null;
    this._bodyText_ = null;
    this._bucketEncSessionKey = null;
    this._confidential = null;
    this._confidential_ = null;
    this._conversationType = null;
    this._language = null;
    this._ownerEncSessionKey = null;
    this._previousMessageId = null;
    this._senderMailAddress = null;
    this._senderName = null;
    this._senderName_ = null;
    this._senderNameUnencrypted = null;
    this._subject = null;
    this._subject_ = null;
    this._symEncSessionKey = null;
    this._attachments = [];
    this._bccRecipients = [];
    this._ccRecipients = [];
    this._toRecipients = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.SendMailData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendMailData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._bodyText = data.bodyText;
  this._bodyText_ = null;
  this._bucketEncSessionKey = data.bucketEncSessionKey;
  this._confidential = data.confidential;
  this._confidential_ = null;
  this._conversationType = data.conversationType;
  this._language = data.language;
  this._ownerEncSessionKey = data.ownerEncSessionKey;
  this._previousMessageId = data.previousMessageId;
  this._senderMailAddress = data.senderMailAddress;
  this._senderName = data.senderName;
  this._senderName_ = null;
  this._senderNameUnencrypted = data.senderNameUnencrypted;
  this._subject = data.subject;
  this._subject_ = null;
  this._symEncSessionKey = data.symEncSessionKey;
  this._attachments = [];
  for (var i=0; i < data.attachments.length; i++) {
    this._attachments.push(new tutao.entity.tutanota.Attachment(this, data.attachments[i]));
  }
  this._bccRecipients = [];
  for (var i=0; i < data.bccRecipients.length; i++) {
    this._bccRecipients.push(new tutao.entity.tutanota.Recipient(this, data.bccRecipients[i]));
  }
  this._ccRecipients = [];
  for (var i=0; i < data.ccRecipients.length; i++) {
    this._ccRecipients.push(new tutao.entity.tutanota.Recipient(this, data.ccRecipients[i]));
  }
  this._toRecipients = [];
  for (var i=0; i < data.toRecipients.length; i++) {
    this._toRecipients.push(new tutao.entity.tutanota.Recipient(this, data.toRecipients[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.SendMailData.MODEL_VERSION = '18';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.SendMailData.PATH = '/rest/tutanota/mailservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.SendMailData.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.SendMailData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    bodyText: this._bodyText, 
    bucketEncSessionKey: this._bucketEncSessionKey, 
    confidential: this._confidential, 
    conversationType: this._conversationType, 
    language: this._language, 
    ownerEncSessionKey: this._ownerEncSessionKey, 
    previousMessageId: this._previousMessageId, 
    senderMailAddress: this._senderMailAddress, 
    senderName: this._senderName, 
    senderNameUnencrypted: this._senderNameUnencrypted, 
    subject: this._subject, 
    symEncSessionKey: this._symEncSessionKey, 
    attachments: tutao.entity.EntityHelper.aggregatesToJsonData(this._attachments), 
    bccRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._bccRecipients), 
    ccRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._ccRecipients), 
    toRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._toRecipients)
  };
};

/**
 * Sets the format of this SendMailData.
 * @param {string} format The format of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SendMailData.
 * @return {string} The format of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the bodyText of this SendMailData.
 * @param {string} bodyText The bodyText of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setBodyText = function(bodyText) {
  var dataToEncrypt = bodyText;
  this._bodyText = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._bodyText_ = bodyText;
  return this;
};

/**
 * Provides the bodyText of this SendMailData.
 * @return {string} The bodyText of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getBodyText = function() {
  if (this._bodyText_ != null) {
    return this._bodyText_;
  }
  if (this._bodyText == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._bodyText);
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
 * Sets the bucketEncSessionKey of this SendMailData.
 * @param {string} bucketEncSessionKey The bucketEncSessionKey of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setBucketEncSessionKey = function(bucketEncSessionKey) {
  this._bucketEncSessionKey = bucketEncSessionKey;
  return this;
};

/**
 * Provides the bucketEncSessionKey of this SendMailData.
 * @return {string} The bucketEncSessionKey of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getBucketEncSessionKey = function() {
  return this._bucketEncSessionKey;
};

/**
 * Sets the confidential of this SendMailData.
 * @param {boolean} confidential The confidential of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setConfidential = function(confidential) {
  var dataToEncrypt = (confidential) ? '1' : '0';
  this._confidential = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._confidential_ = confidential;
  return this;
};

/**
 * Provides the confidential of this SendMailData.
 * @return {boolean} The confidential of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getConfidential = function() {
  if (this._confidential_ != null) {
    return this._confidential_;
  }
  if (this._confidential == "" || !this._entityHelper.getSessionKey()) {
    return false;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._confidential);
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
 * Sets the conversationType of this SendMailData.
 * @param {string} conversationType The conversationType of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setConversationType = function(conversationType) {
  this._conversationType = conversationType;
  return this;
};

/**
 * Provides the conversationType of this SendMailData.
 * @return {string} The conversationType of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getConversationType = function() {
  return this._conversationType;
};

/**
 * Sets the language of this SendMailData.
 * @param {string} language The language of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setLanguage = function(language) {
  this._language = language;
  return this;
};

/**
 * Provides the language of this SendMailData.
 * @return {string} The language of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getLanguage = function() {
  return this._language;
};

/**
 * Sets the ownerEncSessionKey of this SendMailData.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this._ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this SendMailData.
 * @return {string} The ownerEncSessionKey of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getOwnerEncSessionKey = function() {
  return this._ownerEncSessionKey;
};

/**
 * Sets the previousMessageId of this SendMailData.
 * @param {string} previousMessageId The previousMessageId of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setPreviousMessageId = function(previousMessageId) {
  this._previousMessageId = previousMessageId;
  return this;
};

/**
 * Provides the previousMessageId of this SendMailData.
 * @return {string} The previousMessageId of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getPreviousMessageId = function() {
  return this._previousMessageId;
};

/**
 * Sets the senderMailAddress of this SendMailData.
 * @param {string} senderMailAddress The senderMailAddress of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setSenderMailAddress = function(senderMailAddress) {
  this._senderMailAddress = senderMailAddress;
  return this;
};

/**
 * Provides the senderMailAddress of this SendMailData.
 * @return {string} The senderMailAddress of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getSenderMailAddress = function() {
  return this._senderMailAddress;
};

/**
 * Sets the senderName of this SendMailData.
 * @param {string} senderName The senderName of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setSenderName = function(senderName) {
  var dataToEncrypt = senderName;
  this._senderName = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._senderName_ = senderName;
  return this;
};

/**
 * Provides the senderName of this SendMailData.
 * @return {string} The senderName of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getSenderName = function() {
  if (this._senderName_ != null) {
    return this._senderName_;
  }
  if (this._senderName == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._senderName);
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
 * Sets the senderNameUnencrypted of this SendMailData.
 * @param {string} senderNameUnencrypted The senderNameUnencrypted of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setSenderNameUnencrypted = function(senderNameUnencrypted) {
  this._senderNameUnencrypted = senderNameUnencrypted;
  return this;
};

/**
 * Provides the senderNameUnencrypted of this SendMailData.
 * @return {string} The senderNameUnencrypted of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getSenderNameUnencrypted = function() {
  return this._senderNameUnencrypted;
};

/**
 * Sets the subject of this SendMailData.
 * @param {string} subject The subject of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setSubject = function(subject) {
  var dataToEncrypt = subject;
  this._subject = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._subject_ = subject;
  return this;
};

/**
 * Provides the subject of this SendMailData.
 * @return {string} The subject of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getSubject = function() {
  if (this._subject_ != null) {
    return this._subject_;
  }
  if (this._subject == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._subject);
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
 * Sets the symEncSessionKey of this SendMailData.
 * @param {string} symEncSessionKey The symEncSessionKey of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setSymEncSessionKey = function(symEncSessionKey) {
  this._symEncSessionKey = symEncSessionKey;
  return this;
};

/**
 * Provides the symEncSessionKey of this SendMailData.
 * @return {string} The symEncSessionKey of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getSymEncSessionKey = function() {
  return this._symEncSessionKey;
};

/**
 * Provides the attachments of this SendMailData.
 * @return {Array.<tutao.entity.tutanota.Attachment>} The attachments of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getAttachments = function() {
  return this._attachments;
};

/**
 * Provides the bccRecipients of this SendMailData.
 * @return {Array.<tutao.entity.tutanota.Recipient>} The bccRecipients of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getBccRecipients = function() {
  return this._bccRecipients;
};

/**
 * Provides the ccRecipients of this SendMailData.
 * @return {Array.<tutao.entity.tutanota.Recipient>} The ccRecipients of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getCcRecipients = function() {
  return this._ccRecipients;
};

/**
 * Provides the toRecipients of this SendMailData.
 * @return {Array.<tutao.entity.tutanota.Recipient>} The toRecipients of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getToRecipients = function() {
  return this._toRecipients;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.SendMailReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.SendMailData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "18";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.SendMailData.PATH, this, parameters, headers, tutao.entity.tutanota.SendMailReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.SendMailData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
