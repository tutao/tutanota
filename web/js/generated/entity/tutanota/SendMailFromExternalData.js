"use strict";

tutao.provide('tutao.entity.tutanota.SendMailFromExternalData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendMailFromExternalData = function(data) {
  if (data) {
    this.__format = data._format;
    this._bodyText = data.bodyText;
    this._confidential = data.confidential;
    this._language = data.language;
    this._previousMessageId = data.previousMessageId;
    this._recipientBucketEncSessionKey = data.recipientBucketEncSessionKey;
    this._senderBucketEncSessionKey = data.senderBucketEncSessionKey;
    this._senderName = data.senderName;
    this._senderSymEncBucketKey = data.senderSymEncBucketKey;
    this._subject = data.subject;
    this._attachments = [];
    for (var i=0; i < data.attachments.length; i++) {
      this._attachments.push(new tutao.entity.tutanota.AttachmentFromExternal(this, data.attachments[i]));
    }
    this._toRecipient = (data.toRecipient) ? new tutao.entity.tutanota.Recipient(this, data.toRecipient) : null;
  } else {
    this.__format = "0";
    this._bodyText = null;
    this._confidential = null;
    this._language = null;
    this._previousMessageId = null;
    this._recipientBucketEncSessionKey = null;
    this._senderBucketEncSessionKey = null;
    this._senderName = null;
    this._senderSymEncBucketKey = null;
    this._subject = null;
    this._attachments = [];
    this._toRecipient = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.SendMailFromExternalData.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.SendMailFromExternalData.MODEL_VERSION = '6';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.SendMailFromExternalData.PATH = '/rest/tutanota/sendmailfromexternalservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    bodyText: this._bodyText, 
    confidential: this._confidential, 
    language: this._language, 
    previousMessageId: this._previousMessageId, 
    recipientBucketEncSessionKey: this._recipientBucketEncSessionKey, 
    senderBucketEncSessionKey: this._senderBucketEncSessionKey, 
    senderName: this._senderName, 
    senderSymEncBucketKey: this._senderSymEncBucketKey, 
    subject: this._subject, 
    attachments: tutao.entity.EntityHelper.aggregatesToJsonData(this._attachments), 
    toRecipient: tutao.entity.EntityHelper.aggregatesToJsonData(this._toRecipient)
  };
};

/**
 * The id of the SendMailFromExternalData type.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.TYPE_ID = 260;

/**
 * The id of the bodyText attribute.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.BODYTEXT_ATTRIBUTE_ID = 264;

/**
 * The id of the confidential attribute.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.CONFIDENTIAL_ATTRIBUTE_ID = 428;

/**
 * The id of the language attribute.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.LANGUAGE_ATTRIBUTE_ID = 262;

/**
 * The id of the previousMessageId attribute.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.PREVIOUSMESSAGEID_ATTRIBUTE_ID = 266;

/**
 * The id of the recipientBucketEncSessionKey attribute.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.RECIPIENTBUCKETENCSESSIONKEY_ATTRIBUTE_ID = 269;

/**
 * The id of the senderBucketEncSessionKey attribute.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.SENDERBUCKETENCSESSIONKEY_ATTRIBUTE_ID = 268;

/**
 * The id of the senderName attribute.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.SENDERNAME_ATTRIBUTE_ID = 265;

/**
 * The id of the senderSymEncBucketKey attribute.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.SENDERSYMENCBUCKETKEY_ATTRIBUTE_ID = 267;

/**
 * The id of the subject attribute.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.SUBJECT_ATTRIBUTE_ID = 263;

/**
 * The id of the attachments attribute.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.ATTACHMENTS_ATTRIBUTE_ID = 271;

/**
 * The id of the toRecipient attribute.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.TORECIPIENT_ATTRIBUTE_ID = 270;

/**
 * Sets the format of this SendMailFromExternalData.
 * @param {string} format The format of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SendMailFromExternalData.
 * @return {string} The format of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the bodyText of this SendMailFromExternalData.
 * @param {string} bodyText The bodyText of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setBodyText = function(bodyText) {
  var dataToEncrypt = bodyText;
  this._bodyText = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the bodyText of this SendMailFromExternalData.
 * @return {string} The bodyText of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getBodyText = function() {
  if (this._bodyText == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._bodyText);
  return value;
};

/**
 * Sets the confidential of this SendMailFromExternalData.
 * @param {boolean} confidential The confidential of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setConfidential = function(confidential) {
  var dataToEncrypt = (confidential) ? '1' : '0';
  this._confidential = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the confidential of this SendMailFromExternalData.
 * @return {boolean} The confidential of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getConfidential = function() {
  if (this._confidential == "") {
    return false;
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._confidential);
  if (value != '0' && value != '1') {
    throw new tutao.InvalidDataError('invalid boolean data: ' + value);
  }
  return value == '1';
};

/**
 * Sets the language of this SendMailFromExternalData.
 * @param {string} language The language of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setLanguage = function(language) {
  this._language = language;
  return this;
};

/**
 * Provides the language of this SendMailFromExternalData.
 * @return {string} The language of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getLanguage = function() {
  return this._language;
};

/**
 * Sets the previousMessageId of this SendMailFromExternalData.
 * @param {string} previousMessageId The previousMessageId of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setPreviousMessageId = function(previousMessageId) {
  this._previousMessageId = previousMessageId;
  return this;
};

/**
 * Provides the previousMessageId of this SendMailFromExternalData.
 * @return {string} The previousMessageId of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getPreviousMessageId = function() {
  return this._previousMessageId;
};

/**
 * Sets the recipientBucketEncSessionKey of this SendMailFromExternalData.
 * @param {string} recipientBucketEncSessionKey The recipientBucketEncSessionKey of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setRecipientBucketEncSessionKey = function(recipientBucketEncSessionKey) {
  this._recipientBucketEncSessionKey = recipientBucketEncSessionKey;
  return this;
};

/**
 * Provides the recipientBucketEncSessionKey of this SendMailFromExternalData.
 * @return {string} The recipientBucketEncSessionKey of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getRecipientBucketEncSessionKey = function() {
  return this._recipientBucketEncSessionKey;
};

/**
 * Sets the senderBucketEncSessionKey of this SendMailFromExternalData.
 * @param {string} senderBucketEncSessionKey The senderBucketEncSessionKey of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setSenderBucketEncSessionKey = function(senderBucketEncSessionKey) {
  this._senderBucketEncSessionKey = senderBucketEncSessionKey;
  return this;
};

/**
 * Provides the senderBucketEncSessionKey of this SendMailFromExternalData.
 * @return {string} The senderBucketEncSessionKey of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getSenderBucketEncSessionKey = function() {
  return this._senderBucketEncSessionKey;
};

/**
 * Sets the senderName of this SendMailFromExternalData.
 * @param {string} senderName The senderName of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setSenderName = function(senderName) {
  var dataToEncrypt = senderName;
  this._senderName = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the senderName of this SendMailFromExternalData.
 * @return {string} The senderName of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getSenderName = function() {
  if (this._senderName == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._senderName);
  return value;
};

/**
 * Sets the senderSymEncBucketKey of this SendMailFromExternalData.
 * @param {string} senderSymEncBucketKey The senderSymEncBucketKey of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setSenderSymEncBucketKey = function(senderSymEncBucketKey) {
  this._senderSymEncBucketKey = senderSymEncBucketKey;
  return this;
};

/**
 * Provides the senderSymEncBucketKey of this SendMailFromExternalData.
 * @return {string} The senderSymEncBucketKey of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getSenderSymEncBucketKey = function() {
  return this._senderSymEncBucketKey;
};

/**
 * Sets the subject of this SendMailFromExternalData.
 * @param {string} subject The subject of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setSubject = function(subject) {
  var dataToEncrypt = subject;
  this._subject = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the subject of this SendMailFromExternalData.
 * @return {string} The subject of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getSubject = function() {
  if (this._subject == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._subject);
  return value;
};

/**
 * Provides the attachments of this SendMailFromExternalData.
 * @return {Array.<tutao.entity.tutanota.AttachmentFromExternal>} The attachments of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getAttachments = function() {
  return this._attachments;
};

/**
 * Sets the toRecipient of this SendMailFromExternalData.
 * @param {tutao.entity.tutanota.Recipient} toRecipient The toRecipient of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setToRecipient = function(toRecipient) {
  this._toRecipient = toRecipient;
  return this;
};

/**
 * Provides the toRecipient of this SendMailFromExternalData.
 * @return {tutao.entity.tutanota.Recipient} The toRecipient of this SendMailFromExternalData.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.getToRecipient = function() {
  return this._toRecipient;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.SendMailFromExternalReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.SendMailFromExternalData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 6;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.SendMailFromExternalData.PATH, this, parameters, headers, tutao.entity.tutanota.SendMailFromExternalReturn);
};
