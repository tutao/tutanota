"use strict";

tutao.provide('tutao.entity.tutanota.SendDraftReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendDraftReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._messageId = null;
    this._sentDate = null;
    this._notifications = [];
    this._sentMail = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.SendDraftReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._messageId = data.messageId;
  this._sentDate = data.sentDate;
  this._notifications = [];
  for (var i=0; i < data.notifications.length; i++) {
    this._notifications.push(new tutao.entity.tutanota.NotificationMail(this, data.notifications[i]));
  }
  this._sentMail = data.sentMail;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.SendDraftReturn.MODEL_VERSION = '20';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.SendDraftReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    messageId: this._messageId, 
    sentDate: this._sentDate, 
    notifications: tutao.entity.EntityHelper.aggregatesToJsonData(this._notifications), 
    sentMail: this._sentMail
  };
};

/**
 * Sets the format of this SendDraftReturn.
 * @param {string} format The format of this SendDraftReturn.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SendDraftReturn.
 * @return {string} The format of this SendDraftReturn.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the messageId of this SendDraftReturn.
 * @param {string} messageId The messageId of this SendDraftReturn.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.setMessageId = function(messageId) {
  this._messageId = messageId;
  return this;
};

/**
 * Provides the messageId of this SendDraftReturn.
 * @return {string} The messageId of this SendDraftReturn.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.getMessageId = function() {
  return this._messageId;
};

/**
 * Sets the sentDate of this SendDraftReturn.
 * @param {Date} sentDate The sentDate of this SendDraftReturn.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.setSentDate = function(sentDate) {
  this._sentDate = String(sentDate.getTime());
  return this;
};

/**
 * Provides the sentDate of this SendDraftReturn.
 * @return {Date} The sentDate of this SendDraftReturn.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.getSentDate = function() {
  if (isNaN(this._sentDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._sentDate);
  }
  return new Date(Number(this._sentDate));
};

/**
 * Provides the notifications of this SendDraftReturn.
 * @return {Array.<tutao.entity.tutanota.NotificationMail>} The notifications of this SendDraftReturn.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.getNotifications = function() {
  return this._notifications;
};

/**
 * Sets the sentMail of this SendDraftReturn.
 * @param {Array.<string>} sentMail The sentMail of this SendDraftReturn.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.setSentMail = function(sentMail) {
  this._sentMail = sentMail;
  return this;
};

/**
 * Provides the sentMail of this SendDraftReturn.
 * @return {Array.<string>} The sentMail of this SendDraftReturn.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.getSentMail = function() {
  return this._sentMail;
};

/**
 * Loads the sentMail of this SendDraftReturn.
 * @return {Promise.<tutao.entity.tutanota.Mail>} Resolves to the loaded sentMail of this SendDraftReturn or an exception if the loading failed.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.loadSentMail = function() {
  return tutao.entity.tutanota.Mail.load(this._sentMail);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.SendDraftReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
