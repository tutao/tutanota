"use strict";

goog.provide('tutao.entity.tutanotaencrypted.SendMailService');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaencrypted.SendMailService = function(data) {
  if (data) {
    this.__format = data._format;
    this._body = data.body;
    this._title = data.title;
    this._recipients = [];
    for (var i=0; i < data.recipients.length; i++) {
      this._recipients.push(new tutao.entity.tutanotaencrypted.MailAddress(this, data.recipients[i]));
    }
    this._sender = (data.sender) ? new tutao.entity.tutanotaencrypted.MailAddress(this, data.sender) : null;
  } else {
    this.__format = "0";
    this._body = null;
    this._title = null;
    this._recipients = [];
    this._sender = null;
  };
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanotaencrypted.SendMailService.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanotaencrypted.SendMailService.MODEL_VERSION = '1';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    body: this._body, 
    title: this._title, 
    recipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._recipients), 
    sender: tutao.entity.EntityHelper.aggregatesToJsonData(this._sender)
  };
};

/**
 * The id of the SendMailService type.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.TYPE_ID = 56;

/**
 * The id of the body attribute.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.BODY_ATTRIBUTE_ID = 59;

/**
 * The id of the title attribute.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.TITLE_ATTRIBUTE_ID = 58;

/**
 * The id of the recipients attribute.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.RECIPIENTS_ATTRIBUTE_ID = 61;

/**
 * The id of the sender attribute.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.SENDER_ATTRIBUTE_ID = 60;

/**
 * Sets the format of this SendMailService.
 * @param {string} format The format of this SendMailService.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SendMailService.
 * @return {string} The format of this SendMailService.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the body of this SendMailService.
 * @param {string} body The body of this SendMailService.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.setBody = function(body) {
  this._body = body;
  return this;
};

/**
 * Provides the body of this SendMailService.
 * @return {string} The body of this SendMailService.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.getBody = function() {
  return this._body;
};

/**
 * Sets the title of this SendMailService.
 * @param {string} title The title of this SendMailService.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.setTitle = function(title) {
  this._title = title;
  return this;
};

/**
 * Provides the title of this SendMailService.
 * @return {string} The title of this SendMailService.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.getTitle = function() {
  return this._title;
};

/**
 * Provides the recipients of this SendMailService.
 * @return {Array.<tutao.entity.tutanotaencrypted.MailAddress>} The recipients of this SendMailService.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.getRecipients = function() {
  return this._recipients;
};

/**
 * Sets the sender of this SendMailService.
 * @param {tutao.entity.tutanotaencrypted.MailAddress} sender The sender of this SendMailService.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.setSender = function(sender) {
  this._sender = sender;
  return this;
};

/**
 * Provides the sender of this SendMailService.
 * @return {tutao.entity.tutanotaencrypted.MailAddress} The sender of this SendMailService.
 */
tutao.entity.tutanotaencrypted.SendMailService.prototype.getSender = function() {
  return this._sender;
};
