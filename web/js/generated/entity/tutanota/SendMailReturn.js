"use strict";

tutao.provide('tutao.entity.tutanota.SendMailReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendMailReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._messageId = null;
    this._sentDate = null;
    this._notifications = [];
    this._senderMail = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.SendMailReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendMailReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._messageId = data.messageId;
  this._sentDate = data.sentDate;
  this._notifications = [];
  for (var i=0; i < data.notifications.length; i++) {
    this._notifications.push(new tutao.entity.tutanota.NotificationMail(this, data.notifications[i]));
  }
  this._senderMail = data.senderMail;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.SendMailReturn.MODEL_VERSION = '17';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.SendMailReturn.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.SendMailReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    messageId: this._messageId, 
    sentDate: this._sentDate, 
    notifications: tutao.entity.EntityHelper.aggregatesToJsonData(this._notifications), 
    senderMail: this._senderMail
  };
};

/**
 * Sets the format of this SendMailReturn.
 * @param {string} format The format of this SendMailReturn.
 */
tutao.entity.tutanota.SendMailReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SendMailReturn.
 * @return {string} The format of this SendMailReturn.
 */
tutao.entity.tutanota.SendMailReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the messageId of this SendMailReturn.
 * @param {string} messageId The messageId of this SendMailReturn.
 */
tutao.entity.tutanota.SendMailReturn.prototype.setMessageId = function(messageId) {
  this._messageId = messageId;
  return this;
};

/**
 * Provides the messageId of this SendMailReturn.
 * @return {string} The messageId of this SendMailReturn.
 */
tutao.entity.tutanota.SendMailReturn.prototype.getMessageId = function() {
  return this._messageId;
};

/**
 * Sets the sentDate of this SendMailReturn.
 * @param {Date} sentDate The sentDate of this SendMailReturn.
 */
tutao.entity.tutanota.SendMailReturn.prototype.setSentDate = function(sentDate) {
  this._sentDate = String(sentDate.getTime());
  return this;
};

/**
 * Provides the sentDate of this SendMailReturn.
 * @return {Date} The sentDate of this SendMailReturn.
 */
tutao.entity.tutanota.SendMailReturn.prototype.getSentDate = function() {
  if (isNaN(this._sentDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._sentDate);
  }
  return new Date(Number(this._sentDate));
};

/**
 * Provides the notifications of this SendMailReturn.
 * @return {Array.<tutao.entity.tutanota.NotificationMail>} The notifications of this SendMailReturn.
 */
tutao.entity.tutanota.SendMailReturn.prototype.getNotifications = function() {
  return this._notifications;
};

/**
 * Sets the senderMail of this SendMailReturn.
 * @param {Array.<string>} senderMail The senderMail of this SendMailReturn.
 */
tutao.entity.tutanota.SendMailReturn.prototype.setSenderMail = function(senderMail) {
  this._senderMail = senderMail;
  return this;
};

/**
 * Provides the senderMail of this SendMailReturn.
 * @return {Array.<string>} The senderMail of this SendMailReturn.
 */
tutao.entity.tutanota.SendMailReturn.prototype.getSenderMail = function() {
  return this._senderMail;
};

/**
 * Loads the senderMail of this SendMailReturn.
 * @return {Promise.<tutao.entity.tutanota.Mail>} Resolves to the loaded senderMail of this SendMailReturn or an exception if the loading failed.
 */
tutao.entity.tutanota.SendMailReturn.prototype.loadSenderMail = function() {
  return tutao.entity.tutanota.Mail.load(this._senderMail);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.SendMailReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
