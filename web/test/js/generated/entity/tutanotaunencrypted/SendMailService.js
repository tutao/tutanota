"use strict";

tutao.provide('tutao.entity.tutanotaunencrypted.SendMailService');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaunencrypted.SendMailService = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._body = null;
    this._title = null;
    this._recipients = [];
    this._sender = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanotaunencrypted.SendMailService.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.updateData = function(data) {
  this.__format = data._format;
  this._body = data.body;
  this._title = data.title;
  this._recipients = [];
  for (var i=0; i < data.recipients.length; i++) {
    this._recipients.push(new tutao.entity.tutanotaunencrypted.MailAddress(this, data.recipients[i]));
  }
  this._sender = (data.sender) ? new tutao.entity.tutanotaunencrypted.MailAddress(this, data.sender) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanotaunencrypted.SendMailService.MODEL_VERSION = '1';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.toJsonData = function() {
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
tutao.entity.tutanotaunencrypted.SendMailService.prototype.TYPE_ID = 55;

/**
 * The id of the body attribute.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.BODY_ATTRIBUTE_ID = 58;

/**
 * The id of the title attribute.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.TITLE_ATTRIBUTE_ID = 57;

/**
 * The id of the recipients attribute.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.RECIPIENTS_ATTRIBUTE_ID = 60;

/**
 * The id of the sender attribute.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.SENDER_ATTRIBUTE_ID = 59;

/**
 * Sets the format of this SendMailService.
 * @param {string} format The format of this SendMailService.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SendMailService.
 * @return {string} The format of this SendMailService.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the body of this SendMailService.
 * @param {string} body The body of this SendMailService.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.setBody = function(body) {
  this._body = body;
  return this;
};

/**
 * Provides the body of this SendMailService.
 * @return {string} The body of this SendMailService.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.getBody = function() {
  return this._body;
};

/**
 * Sets the title of this SendMailService.
 * @param {string} title The title of this SendMailService.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.setTitle = function(title) {
  this._title = title;
  return this;
};

/**
 * Provides the title of this SendMailService.
 * @return {string} The title of this SendMailService.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.getTitle = function() {
  return this._title;
};

/**
 * Provides the recipients of this SendMailService.
 * @return {Array.<tutao.entity.tutanotaunencrypted.MailAddress>} The recipients of this SendMailService.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.getRecipients = function() {
  return this._recipients;
};

/**
 * Sets the sender of this SendMailService.
 * @param {tutao.entity.tutanotaunencrypted.MailAddress} sender The sender of this SendMailService.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.setSender = function(sender) {
  this._sender = sender;
  return this;
};

/**
 * Provides the sender of this SendMailService.
 * @return {tutao.entity.tutanotaunencrypted.MailAddress} The sender of this SendMailService.
 */
tutao.entity.tutanotaunencrypted.SendMailService.prototype.getSender = function() {
  return this._sender;
};
