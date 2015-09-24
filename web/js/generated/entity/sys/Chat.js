"use strict";

tutao.provide('tutao.entity.sys.Chat');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Chat = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._recipient = null;
    this._sender = null;
    this._text = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.Chat.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Chat.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._recipient = data.recipient;
  this._sender = data.sender;
  this._text = data.text;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Chat.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    recipient: this._recipient, 
    sender: this._sender, 
    text: this._text
  };
};

/**
 * The id of the Chat type.
 */
tutao.entity.sys.Chat.prototype.TYPE_ID = 457;

/**
 * The id of the recipient attribute.
 */
tutao.entity.sys.Chat.prototype.RECIPIENT_ATTRIBUTE_ID = 460;

/**
 * The id of the sender attribute.
 */
tutao.entity.sys.Chat.prototype.SENDER_ATTRIBUTE_ID = 459;

/**
 * The id of the text attribute.
 */
tutao.entity.sys.Chat.prototype.TEXT_ATTRIBUTE_ID = 461;

/**
 * Sets the id of this Chat.
 * @param {string} id The id of this Chat.
 */
tutao.entity.sys.Chat.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Chat.
 * @return {string} The id of this Chat.
 */
tutao.entity.sys.Chat.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the recipient of this Chat.
 * @param {string} recipient The recipient of this Chat.
 */
tutao.entity.sys.Chat.prototype.setRecipient = function(recipient) {
  this._recipient = recipient;
  return this;
};

/**
 * Provides the recipient of this Chat.
 * @return {string} The recipient of this Chat.
 */
tutao.entity.sys.Chat.prototype.getRecipient = function() {
  return this._recipient;
};

/**
 * Sets the sender of this Chat.
 * @param {string} sender The sender of this Chat.
 */
tutao.entity.sys.Chat.prototype.setSender = function(sender) {
  this._sender = sender;
  return this;
};

/**
 * Provides the sender of this Chat.
 * @return {string} The sender of this Chat.
 */
tutao.entity.sys.Chat.prototype.getSender = function() {
  return this._sender;
};

/**
 * Sets the text of this Chat.
 * @param {string} text The text of this Chat.
 */
tutao.entity.sys.Chat.prototype.setText = function(text) {
  this._text = text;
  return this;
};

/**
 * Provides the text of this Chat.
 * @return {string} The text of this Chat.
 */
tutao.entity.sys.Chat.prototype.getText = function() {
  return this._text;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.Chat.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
