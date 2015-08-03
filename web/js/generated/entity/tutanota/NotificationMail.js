"use strict";

tutao.provide('tutao.entity.tutanota.NotificationMail');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.NotificationMail = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._bodyText = null;
    this._mailboxLink = null;
    this._recipientMailAddress = null;
    this._recipientName = null;
    this._subject = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.NotificationMail.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.NotificationMail.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._bodyText = data.bodyText;
  this._mailboxLink = data.mailboxLink;
  this._recipientMailAddress = data.recipientMailAddress;
  this._recipientName = data.recipientName;
  this._subject = data.subject;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.NotificationMail.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    bodyText: this._bodyText, 
    mailboxLink: this._mailboxLink, 
    recipientMailAddress: this._recipientMailAddress, 
    recipientName: this._recipientName, 
    subject: this._subject
  };
};

/**
 * The id of the NotificationMail type.
 */
tutao.entity.tutanota.NotificationMail.prototype.TYPE_ID = 223;

/**
 * The id of the bodyText attribute.
 */
tutao.entity.tutanota.NotificationMail.prototype.BODYTEXT_ATTRIBUTE_ID = 226;

/**
 * The id of the mailboxLink attribute.
 */
tutao.entity.tutanota.NotificationMail.prototype.MAILBOXLINK_ATTRIBUTE_ID = 417;

/**
 * The id of the recipientMailAddress attribute.
 */
tutao.entity.tutanota.NotificationMail.prototype.RECIPIENTMAILADDRESS_ATTRIBUTE_ID = 227;

/**
 * The id of the recipientName attribute.
 */
tutao.entity.tutanota.NotificationMail.prototype.RECIPIENTNAME_ATTRIBUTE_ID = 228;

/**
 * The id of the subject attribute.
 */
tutao.entity.tutanota.NotificationMail.prototype.SUBJECT_ATTRIBUTE_ID = 225;

/**
 * Sets the id of this NotificationMail.
 * @param {string} id The id of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this NotificationMail.
 * @return {string} The id of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the bodyText of this NotificationMail.
 * @param {string} bodyText The bodyText of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.setBodyText = function(bodyText) {
  this._bodyText = bodyText;
  return this;
};

/**
 * Provides the bodyText of this NotificationMail.
 * @return {string} The bodyText of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.getBodyText = function() {
  return this._bodyText;
};

/**
 * Sets the mailboxLink of this NotificationMail.
 * @param {string} mailboxLink The mailboxLink of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.setMailboxLink = function(mailboxLink) {
  this._mailboxLink = mailboxLink;
  return this;
};

/**
 * Provides the mailboxLink of this NotificationMail.
 * @return {string} The mailboxLink of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.getMailboxLink = function() {
  return this._mailboxLink;
};

/**
 * Sets the recipientMailAddress of this NotificationMail.
 * @param {string} recipientMailAddress The recipientMailAddress of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.setRecipientMailAddress = function(recipientMailAddress) {
  this._recipientMailAddress = recipientMailAddress;
  return this;
};

/**
 * Provides the recipientMailAddress of this NotificationMail.
 * @return {string} The recipientMailAddress of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.getRecipientMailAddress = function() {
  return this._recipientMailAddress;
};

/**
 * Sets the recipientName of this NotificationMail.
 * @param {string} recipientName The recipientName of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.setRecipientName = function(recipientName) {
  this._recipientName = recipientName;
  return this;
};

/**
 * Provides the recipientName of this NotificationMail.
 * @return {string} The recipientName of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.getRecipientName = function() {
  return this._recipientName;
};

/**
 * Sets the subject of this NotificationMail.
 * @param {string} subject The subject of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.setSubject = function(subject) {
  this._subject = subject;
  return this;
};

/**
 * Provides the subject of this NotificationMail.
 * @return {string} The subject of this NotificationMail.
 */
tutao.entity.tutanota.NotificationMail.prototype.getSubject = function() {
  return this._subject;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.NotificationMail.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
