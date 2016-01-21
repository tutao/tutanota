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
    this._bucketEncSessionKey = null;
    this._confidential = null;
    this._conversationType = null;
    this._language = null;
    this._listEncSessionKey = null;
    this._previousMessageId = null;
    this._senderMailAddress = null;
    this._senderName = null;
    this._senderNameUnencrypted = null;
    this._sharableEncSessionKey = null;
    this._subject = null;
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
  this._bucketEncSessionKey = data.bucketEncSessionKey;
  this._confidential = data.confidential;
  this._conversationType = data.conversationType;
  this._language = data.language;
  this._listEncSessionKey = data.listEncSessionKey;
  this._previousMessageId = data.previousMessageId;
  this._senderMailAddress = data.senderMailAddress;
  this._senderName = data.senderName;
  this._senderNameUnencrypted = data.senderNameUnencrypted;
  this._sharableEncSessionKey = data.sharableEncSessionKey;
  this._subject = data.subject;
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
tutao.entity.tutanota.SendMailData.MODEL_VERSION = '12';

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
    listEncSessionKey: this._listEncSessionKey, 
    previousMessageId: this._previousMessageId, 
    senderMailAddress: this._senderMailAddress, 
    senderName: this._senderName, 
    senderNameUnencrypted: this._senderNameUnencrypted, 
    sharableEncSessionKey: this._sharableEncSessionKey, 
    subject: this._subject, 
    symEncSessionKey: this._symEncSessionKey, 
    attachments: tutao.entity.EntityHelper.aggregatesToJsonData(this._attachments), 
    bccRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._bccRecipients), 
    ccRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._ccRecipients), 
    toRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._toRecipients)
  };
};

/**
 * The id of the SendMailData type.
 */
tutao.entity.tutanota.SendMailData.prototype.TYPE_ID = 229;

/**
 * The id of the bodyText attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.BODYTEXT_ATTRIBUTE_ID = 233;

/**
 * The id of the bucketEncSessionKey attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.BUCKETENCSESSIONKEY_ATTRIBUTE_ID = 241;

/**
 * The id of the confidential attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.CONFIDENTIAL_ATTRIBUTE_ID = 427;

/**
 * The id of the conversationType attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.CONVERSATIONTYPE_ATTRIBUTE_ID = 237;

/**
 * The id of the language attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.LANGUAGE_ATTRIBUTE_ID = 231;

/**
 * The id of the listEncSessionKey attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.LISTENCSESSIONKEY_ATTRIBUTE_ID = 238;

/**
 * The id of the previousMessageId attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.PREVIOUSMESSAGEID_ATTRIBUTE_ID = 236;

/**
 * The id of the senderMailAddress attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.SENDERMAILADDRESS_ATTRIBUTE_ID = 467;

/**
 * The id of the senderName attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.SENDERNAME_ATTRIBUTE_ID = 234;

/**
 * The id of the senderNameUnencrypted attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.SENDERNAMEUNENCRYPTED_ATTRIBUTE_ID = 235;

/**
 * The id of the sharableEncSessionKey attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.SHARABLEENCSESSIONKEY_ATTRIBUTE_ID = 240;

/**
 * The id of the subject attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.SUBJECT_ATTRIBUTE_ID = 232;

/**
 * The id of the symEncSessionKey attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.SYMENCSESSIONKEY_ATTRIBUTE_ID = 239;

/**
 * The id of the attachments attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.ATTACHMENTS_ATTRIBUTE_ID = 245;

/**
 * The id of the bccRecipients attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.BCCRECIPIENTS_ATTRIBUTE_ID = 244;

/**
 * The id of the ccRecipients attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.CCRECIPIENTS_ATTRIBUTE_ID = 243;

/**
 * The id of the toRecipients attribute.
 */
tutao.entity.tutanota.SendMailData.prototype.TORECIPIENTS_ATTRIBUTE_ID = 242;

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
  return this;
};

/**
 * Provides the bodyText of this SendMailData.
 * @return {string} The bodyText of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getBodyText = function() {
  if (this._bodyText == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._bodyText);
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
  return this;
};

/**
 * Provides the confidential of this SendMailData.
 * @return {boolean} The confidential of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getConfidential = function() {
  if (this._confidential == "" || !this._entityHelper.getSessionKey()) {
    return false;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._confidential);
    return value != '0';
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
 * Sets the listEncSessionKey of this SendMailData.
 * @param {string} listEncSessionKey The listEncSessionKey of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setListEncSessionKey = function(listEncSessionKey) {
  this._listEncSessionKey = listEncSessionKey;
  return this;
};

/**
 * Provides the listEncSessionKey of this SendMailData.
 * @return {string} The listEncSessionKey of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getListEncSessionKey = function() {
  return this._listEncSessionKey;
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
  return this;
};

/**
 * Provides the senderName of this SendMailData.
 * @return {string} The senderName of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getSenderName = function() {
  if (this._senderName == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._senderName);
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
 * Sets the sharableEncSessionKey of this SendMailData.
 * @param {string} sharableEncSessionKey The sharableEncSessionKey of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setSharableEncSessionKey = function(sharableEncSessionKey) {
  this._sharableEncSessionKey = sharableEncSessionKey;
  return this;
};

/**
 * Provides the sharableEncSessionKey of this SendMailData.
 * @return {string} The sharableEncSessionKey of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getSharableEncSessionKey = function() {
  return this._sharableEncSessionKey;
};

/**
 * Sets the subject of this SendMailData.
 * @param {string} subject The subject of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.setSubject = function(subject) {
  var dataToEncrypt = subject;
  this._subject = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the subject of this SendMailData.
 * @return {string} The subject of this SendMailData.
 */
tutao.entity.tutanota.SendMailData.prototype.getSubject = function() {
  if (this._subject == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._subject);
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
 * @return {Promise.<tutao.entity.tutanota.SendMailReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.SendMailData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 12;
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
