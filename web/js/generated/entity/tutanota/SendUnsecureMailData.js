"use strict";

tutao.provide('tutao.entity.tutanota.SendUnsecureMailData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendUnsecureMailData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._bodyText = null;
    this._conversationType = null;
    this._language = null;
    this._listEncSessionKey = null;
    this._mailSessionKey = null;
    this._previousMessageId = null;
    this._senderMailAddress = null;
    this._senderName = null;
    this._sharableEncSessionKey = null;
    this._subject = null;
    this._symEncSessionKey = null;
    this._attachments = [];
    this._bccRecipients = [];
    this._ccRecipients = [];
    this._toRecipients = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.SendUnsecureMailData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._bodyText = data.bodyText;
  this._conversationType = data.conversationType;
  this._language = data.language;
  this._listEncSessionKey = data.listEncSessionKey;
  this._mailSessionKey = data.mailSessionKey;
  this._previousMessageId = data.previousMessageId;
  this._senderMailAddress = data.senderMailAddress;
  this._senderName = data.senderName;
  this._sharableEncSessionKey = data.sharableEncSessionKey;
  this._subject = data.subject;
  this._symEncSessionKey = data.symEncSessionKey;
  this._attachments = [];
  for (var i=0; i < data.attachments.length; i++) {
    this._attachments.push(new tutao.entity.tutanota.UnsecureAttachment(this, data.attachments[i]));
  }
  this._bccRecipients = [];
  for (var i=0; i < data.bccRecipients.length; i++) {
    this._bccRecipients.push(new tutao.entity.tutanota.UnsecureRecipient(this, data.bccRecipients[i]));
  }
  this._ccRecipients = [];
  for (var i=0; i < data.ccRecipients.length; i++) {
    this._ccRecipients.push(new tutao.entity.tutanota.UnsecureRecipient(this, data.ccRecipients[i]));
  }
  this._toRecipients = [];
  for (var i=0; i < data.toRecipients.length; i++) {
    this._toRecipients.push(new tutao.entity.tutanota.UnsecureRecipient(this, data.toRecipients[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.SendUnsecureMailData.MODEL_VERSION = '11';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.SendUnsecureMailData.PATH = '/rest/tutanota/sendunsecuremailservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    bodyText: this._bodyText, 
    conversationType: this._conversationType, 
    language: this._language, 
    listEncSessionKey: this._listEncSessionKey, 
    mailSessionKey: this._mailSessionKey, 
    previousMessageId: this._previousMessageId, 
    senderMailAddress: this._senderMailAddress, 
    senderName: this._senderName, 
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
 * The id of the SendUnsecureMailData type.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.TYPE_ID = 288;

/**
 * The id of the bodyText attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.BODYTEXT_ATTRIBUTE_ID = 292;

/**
 * The id of the conversationType attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.CONVERSATIONTYPE_ATTRIBUTE_ID = 295;

/**
 * The id of the language attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.LANGUAGE_ATTRIBUTE_ID = 290;

/**
 * The id of the listEncSessionKey attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.LISTENCSESSIONKEY_ATTRIBUTE_ID = 297;

/**
 * The id of the mailSessionKey attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.MAILSESSIONKEY_ATTRIBUTE_ID = 296;

/**
 * The id of the previousMessageId attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.PREVIOUSMESSAGEID_ATTRIBUTE_ID = 294;

/**
 * The id of the senderMailAddress attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.SENDERMAILADDRESS_ATTRIBUTE_ID = 468;

/**
 * The id of the senderName attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.SENDERNAME_ATTRIBUTE_ID = 293;

/**
 * The id of the sharableEncSessionKey attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.SHARABLEENCSESSIONKEY_ATTRIBUTE_ID = 299;

/**
 * The id of the subject attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.SUBJECT_ATTRIBUTE_ID = 291;

/**
 * The id of the symEncSessionKey attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.SYMENCSESSIONKEY_ATTRIBUTE_ID = 298;

/**
 * The id of the attachments attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.ATTACHMENTS_ATTRIBUTE_ID = 303;

/**
 * The id of the bccRecipients attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.BCCRECIPIENTS_ATTRIBUTE_ID = 302;

/**
 * The id of the ccRecipients attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.CCRECIPIENTS_ATTRIBUTE_ID = 301;

/**
 * The id of the toRecipients attribute.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.TORECIPIENTS_ATTRIBUTE_ID = 300;

/**
 * Sets the format of this SendUnsecureMailData.
 * @param {string} format The format of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SendUnsecureMailData.
 * @return {string} The format of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the bodyText of this SendUnsecureMailData.
 * @param {string} bodyText The bodyText of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setBodyText = function(bodyText) {
  this._bodyText = bodyText;
  return this;
};

/**
 * Provides the bodyText of this SendUnsecureMailData.
 * @return {string} The bodyText of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getBodyText = function() {
  return this._bodyText;
};

/**
 * Sets the conversationType of this SendUnsecureMailData.
 * @param {string} conversationType The conversationType of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setConversationType = function(conversationType) {
  this._conversationType = conversationType;
  return this;
};

/**
 * Provides the conversationType of this SendUnsecureMailData.
 * @return {string} The conversationType of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getConversationType = function() {
  return this._conversationType;
};

/**
 * Sets the language of this SendUnsecureMailData.
 * @param {string} language The language of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setLanguage = function(language) {
  this._language = language;
  return this;
};

/**
 * Provides the language of this SendUnsecureMailData.
 * @return {string} The language of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getLanguage = function() {
  return this._language;
};

/**
 * Sets the listEncSessionKey of this SendUnsecureMailData.
 * @param {string} listEncSessionKey The listEncSessionKey of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setListEncSessionKey = function(listEncSessionKey) {
  this._listEncSessionKey = listEncSessionKey;
  return this;
};

/**
 * Provides the listEncSessionKey of this SendUnsecureMailData.
 * @return {string} The listEncSessionKey of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getListEncSessionKey = function() {
  return this._listEncSessionKey;
};

/**
 * Sets the mailSessionKey of this SendUnsecureMailData.
 * @param {string} mailSessionKey The mailSessionKey of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setMailSessionKey = function(mailSessionKey) {
  this._mailSessionKey = mailSessionKey;
  return this;
};

/**
 * Provides the mailSessionKey of this SendUnsecureMailData.
 * @return {string} The mailSessionKey of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getMailSessionKey = function() {
  return this._mailSessionKey;
};

/**
 * Sets the previousMessageId of this SendUnsecureMailData.
 * @param {string} previousMessageId The previousMessageId of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setPreviousMessageId = function(previousMessageId) {
  this._previousMessageId = previousMessageId;
  return this;
};

/**
 * Provides the previousMessageId of this SendUnsecureMailData.
 * @return {string} The previousMessageId of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getPreviousMessageId = function() {
  return this._previousMessageId;
};

/**
 * Sets the senderMailAddress of this SendUnsecureMailData.
 * @param {string} senderMailAddress The senderMailAddress of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setSenderMailAddress = function(senderMailAddress) {
  this._senderMailAddress = senderMailAddress;
  return this;
};

/**
 * Provides the senderMailAddress of this SendUnsecureMailData.
 * @return {string} The senderMailAddress of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getSenderMailAddress = function() {
  return this._senderMailAddress;
};

/**
 * Sets the senderName of this SendUnsecureMailData.
 * @param {string} senderName The senderName of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setSenderName = function(senderName) {
  this._senderName = senderName;
  return this;
};

/**
 * Provides the senderName of this SendUnsecureMailData.
 * @return {string} The senderName of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getSenderName = function() {
  return this._senderName;
};

/**
 * Sets the sharableEncSessionKey of this SendUnsecureMailData.
 * @param {string} sharableEncSessionKey The sharableEncSessionKey of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setSharableEncSessionKey = function(sharableEncSessionKey) {
  this._sharableEncSessionKey = sharableEncSessionKey;
  return this;
};

/**
 * Provides the sharableEncSessionKey of this SendUnsecureMailData.
 * @return {string} The sharableEncSessionKey of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getSharableEncSessionKey = function() {
  return this._sharableEncSessionKey;
};

/**
 * Sets the subject of this SendUnsecureMailData.
 * @param {string} subject The subject of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setSubject = function(subject) {
  this._subject = subject;
  return this;
};

/**
 * Provides the subject of this SendUnsecureMailData.
 * @return {string} The subject of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getSubject = function() {
  return this._subject;
};

/**
 * Sets the symEncSessionKey of this SendUnsecureMailData.
 * @param {string} symEncSessionKey The symEncSessionKey of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setSymEncSessionKey = function(symEncSessionKey) {
  this._symEncSessionKey = symEncSessionKey;
  return this;
};

/**
 * Provides the symEncSessionKey of this SendUnsecureMailData.
 * @return {string} The symEncSessionKey of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getSymEncSessionKey = function() {
  return this._symEncSessionKey;
};

/**
 * Provides the attachments of this SendUnsecureMailData.
 * @return {Array.<tutao.entity.tutanota.UnsecureAttachment>} The attachments of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getAttachments = function() {
  return this._attachments;
};

/**
 * Provides the bccRecipients of this SendUnsecureMailData.
 * @return {Array.<tutao.entity.tutanota.UnsecureRecipient>} The bccRecipients of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getBccRecipients = function() {
  return this._bccRecipients;
};

/**
 * Provides the ccRecipients of this SendUnsecureMailData.
 * @return {Array.<tutao.entity.tutanota.UnsecureRecipient>} The ccRecipients of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getCcRecipients = function() {
  return this._ccRecipients;
};

/**
 * Provides the toRecipients of this SendUnsecureMailData.
 * @return {Array.<tutao.entity.tutanota.UnsecureRecipient>} The toRecipients of this SendUnsecureMailData.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getToRecipients = function() {
  return this._toRecipients;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.SendUnsecureMailReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 11;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.SendUnsecureMailData.PATH, this, parameters, headers, tutao.entity.tutanota.SendUnsecureMailReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.SendUnsecureMailData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
