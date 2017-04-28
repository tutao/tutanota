"use strict";

tutao.provide('tutao.entity.tutanota.SendDraftData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendDraftData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._bucketEncMailSessionKey = null;
    this._language = null;
    this._mailSessionKey = null;
    this._plaintext = null;
    this._senderNameUnencrypted = null;
    this._attachmentKeyData = [];
    this._internalRecipientKeyData = [];
    this._mail = null;
    this._secureExternalRecipientKeyData = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.SendDraftData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendDraftData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._bucketEncMailSessionKey = data.bucketEncMailSessionKey;
  this._language = data.language;
  this._mailSessionKey = data.mailSessionKey;
  this._plaintext = data.plaintext;
  this._senderNameUnencrypted = data.senderNameUnencrypted;
  this._attachmentKeyData = [];
  for (var i=0; i < data.attachmentKeyData.length; i++) {
    this._attachmentKeyData.push(new tutao.entity.tutanota.AttachmentKeyData(this, data.attachmentKeyData[i]));
  }
  this._internalRecipientKeyData = [];
  for (var i=0; i < data.internalRecipientKeyData.length; i++) {
    this._internalRecipientKeyData.push(new tutao.entity.tutanota.InternalRecipientKeyData(this, data.internalRecipientKeyData[i]));
  }
  this._mail = data.mail;
  this._secureExternalRecipientKeyData = [];
  for (var i=0; i < data.secureExternalRecipientKeyData.length; i++) {
    this._secureExternalRecipientKeyData.push(new tutao.entity.tutanota.SecureExternalRecipientKeyData(this, data.secureExternalRecipientKeyData[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.SendDraftData.MODEL_VERSION = '18';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.SendDraftData.PATH = '/rest/tutanota/senddraftservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.SendDraftData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.SendDraftData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    bucketEncMailSessionKey: this._bucketEncMailSessionKey, 
    language: this._language, 
    mailSessionKey: this._mailSessionKey, 
    plaintext: this._plaintext, 
    senderNameUnencrypted: this._senderNameUnencrypted, 
    attachmentKeyData: tutao.entity.EntityHelper.aggregatesToJsonData(this._attachmentKeyData), 
    internalRecipientKeyData: tutao.entity.EntityHelper.aggregatesToJsonData(this._internalRecipientKeyData), 
    mail: this._mail, 
    secureExternalRecipientKeyData: tutao.entity.EntityHelper.aggregatesToJsonData(this._secureExternalRecipientKeyData)
  };
};

/**
 * Sets the format of this SendDraftData.
 * @param {string} format The format of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SendDraftData.
 * @return {string} The format of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the bucketEncMailSessionKey of this SendDraftData.
 * @param {string} bucketEncMailSessionKey The bucketEncMailSessionKey of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.setBucketEncMailSessionKey = function(bucketEncMailSessionKey) {
  this._bucketEncMailSessionKey = bucketEncMailSessionKey;
  return this;
};

/**
 * Provides the bucketEncMailSessionKey of this SendDraftData.
 * @return {string} The bucketEncMailSessionKey of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.getBucketEncMailSessionKey = function() {
  return this._bucketEncMailSessionKey;
};

/**
 * Sets the language of this SendDraftData.
 * @param {string} language The language of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.setLanguage = function(language) {
  this._language = language;
  return this;
};

/**
 * Provides the language of this SendDraftData.
 * @return {string} The language of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.getLanguage = function() {
  return this._language;
};

/**
 * Sets the mailSessionKey of this SendDraftData.
 * @param {string} mailSessionKey The mailSessionKey of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.setMailSessionKey = function(mailSessionKey) {
  this._mailSessionKey = mailSessionKey;
  return this;
};

/**
 * Provides the mailSessionKey of this SendDraftData.
 * @return {string} The mailSessionKey of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.getMailSessionKey = function() {
  return this._mailSessionKey;
};

/**
 * Sets the plaintext of this SendDraftData.
 * @param {boolean} plaintext The plaintext of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.setPlaintext = function(plaintext) {
  this._plaintext = plaintext ? '1' : '0';
  return this;
};

/**
 * Provides the plaintext of this SendDraftData.
 * @return {boolean} The plaintext of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.getPlaintext = function() {
  return this._plaintext != '0';
};

/**
 * Sets the senderNameUnencrypted of this SendDraftData.
 * @param {string} senderNameUnencrypted The senderNameUnencrypted of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.setSenderNameUnencrypted = function(senderNameUnencrypted) {
  this._senderNameUnencrypted = senderNameUnencrypted;
  return this;
};

/**
 * Provides the senderNameUnencrypted of this SendDraftData.
 * @return {string} The senderNameUnencrypted of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.getSenderNameUnencrypted = function() {
  return this._senderNameUnencrypted;
};

/**
 * Provides the attachmentKeyData of this SendDraftData.
 * @return {Array.<tutao.entity.tutanota.AttachmentKeyData>} The attachmentKeyData of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.getAttachmentKeyData = function() {
  return this._attachmentKeyData;
};

/**
 * Provides the internalRecipientKeyData of this SendDraftData.
 * @return {Array.<tutao.entity.tutanota.InternalRecipientKeyData>} The internalRecipientKeyData of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.getInternalRecipientKeyData = function() {
  return this._internalRecipientKeyData;
};

/**
 * Sets the mail of this SendDraftData.
 * @param {Array.<string>} mail The mail of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.setMail = function(mail) {
  this._mail = mail;
  return this;
};

/**
 * Provides the mail of this SendDraftData.
 * @return {Array.<string>} The mail of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.getMail = function() {
  return this._mail;
};

/**
 * Loads the mail of this SendDraftData.
 * @return {Promise.<tutao.entity.tutanota.Mail>} Resolves to the loaded mail of this SendDraftData or an exception if the loading failed.
 */
tutao.entity.tutanota.SendDraftData.prototype.loadMail = function() {
  return tutao.entity.tutanota.Mail.load(this._mail);
};

/**
 * Provides the secureExternalRecipientKeyData of this SendDraftData.
 * @return {Array.<tutao.entity.tutanota.SecureExternalRecipientKeyData>} The secureExternalRecipientKeyData of this SendDraftData.
 */
tutao.entity.tutanota.SendDraftData.prototype.getSecureExternalRecipientKeyData = function() {
  return this._secureExternalRecipientKeyData;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.SendDraftReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.SendDraftData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "18";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.SendDraftData.PATH, this, parameters, headers, tutao.entity.tutanota.SendDraftReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.SendDraftData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
