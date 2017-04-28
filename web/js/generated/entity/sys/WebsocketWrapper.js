"use strict";

tutao.provide('tutao.entity.sys.WebsocketWrapper');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.WebsocketWrapper = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._clientVersion = null;
    this._eventBatchId = null;
    this._eventBatchOwner = null;
    this._modelVersions = null;
    this._msgId = null;
    this._type = null;
    this._authentication = null;
    this._chat = null;
    this._entityUpdate = null;
    this._eventBatch = [];
    this._exception = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.WebsocketWrapper.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.WebsocketWrapper.prototype.updateData = function(data) {
  this.__format = data._format;
  this._clientVersion = data.clientVersion;
  this._eventBatchId = data.eventBatchId;
  this._eventBatchOwner = data.eventBatchOwner;
  this._modelVersions = data.modelVersions;
  this._msgId = data.msgId;
  this._type = data.type;
  this._authentication = (data.authentication) ? new tutao.entity.sys.Authentication(this, data.authentication) : null;
  this._chat = (data.chat) ? new tutao.entity.sys.Chat(this, data.chat) : null;
  this._entityUpdate = (data.entityUpdate) ? new tutao.entity.sys.EntityUpdate(this, data.entityUpdate) : null;
  this._eventBatch = [];
  for (var i=0; i < data.eventBatch.length; i++) {
    this._eventBatch.push(new tutao.entity.sys.EntityUpdate(this, data.eventBatch[i]));
  }
  this._exception = (data.exception) ? new tutao.entity.sys.Exception(this, data.exception) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.WebsocketWrapper.MODEL_VERSION = '21';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.WebsocketWrapper.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.WebsocketWrapper.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    clientVersion: this._clientVersion, 
    eventBatchId: this._eventBatchId, 
    eventBatchOwner: this._eventBatchOwner, 
    modelVersions: this._modelVersions, 
    msgId: this._msgId, 
    type: this._type, 
    authentication: tutao.entity.EntityHelper.aggregatesToJsonData(this._authentication), 
    chat: tutao.entity.EntityHelper.aggregatesToJsonData(this._chat), 
    entityUpdate: tutao.entity.EntityHelper.aggregatesToJsonData(this._entityUpdate), 
    eventBatch: tutao.entity.EntityHelper.aggregatesToJsonData(this._eventBatch), 
    exception: tutao.entity.EntityHelper.aggregatesToJsonData(this._exception)
  };
};

/**
 * Sets the format of this WebsocketWrapper.
 * @param {string} format The format of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this WebsocketWrapper.
 * @return {string} The format of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the clientVersion of this WebsocketWrapper.
 * @param {string} clientVersion The clientVersion of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.setClientVersion = function(clientVersion) {
  this._clientVersion = clientVersion;
  return this;
};

/**
 * Provides the clientVersion of this WebsocketWrapper.
 * @return {string} The clientVersion of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getClientVersion = function() {
  return this._clientVersion;
};

/**
 * Sets the eventBatchId of this WebsocketWrapper.
 * @param {string} eventBatchId The eventBatchId of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.setEventBatchId = function(eventBatchId) {
  this._eventBatchId = eventBatchId;
  return this;
};

/**
 * Provides the eventBatchId of this WebsocketWrapper.
 * @return {string} The eventBatchId of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getEventBatchId = function() {
  return this._eventBatchId;
};

/**
 * Sets the eventBatchOwner of this WebsocketWrapper.
 * @param {string} eventBatchOwner The eventBatchOwner of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.setEventBatchOwner = function(eventBatchOwner) {
  this._eventBatchOwner = eventBatchOwner;
  return this;
};

/**
 * Provides the eventBatchOwner of this WebsocketWrapper.
 * @return {string} The eventBatchOwner of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getEventBatchOwner = function() {
  return this._eventBatchOwner;
};

/**
 * Sets the modelVersions of this WebsocketWrapper.
 * @param {string} modelVersions The modelVersions of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.setModelVersions = function(modelVersions) {
  this._modelVersions = modelVersions;
  return this;
};

/**
 * Provides the modelVersions of this WebsocketWrapper.
 * @return {string} The modelVersions of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getModelVersions = function() {
  return this._modelVersions;
};

/**
 * Sets the msgId of this WebsocketWrapper.
 * @param {string} msgId The msgId of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.setMsgId = function(msgId) {
  this._msgId = msgId;
  return this;
};

/**
 * Provides the msgId of this WebsocketWrapper.
 * @return {string} The msgId of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getMsgId = function() {
  return this._msgId;
};

/**
 * Sets the type of this WebsocketWrapper.
 * @param {string} type The type of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this WebsocketWrapper.
 * @return {string} The type of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getType = function() {
  return this._type;
};

/**
 * Sets the authentication of this WebsocketWrapper.
 * @param {tutao.entity.sys.Authentication} authentication The authentication of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.setAuthentication = function(authentication) {
  this._authentication = authentication;
  return this;
};

/**
 * Provides the authentication of this WebsocketWrapper.
 * @return {tutao.entity.sys.Authentication} The authentication of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getAuthentication = function() {
  return this._authentication;
};

/**
 * Sets the chat of this WebsocketWrapper.
 * @param {tutao.entity.sys.Chat} chat The chat of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.setChat = function(chat) {
  this._chat = chat;
  return this;
};

/**
 * Provides the chat of this WebsocketWrapper.
 * @return {tutao.entity.sys.Chat} The chat of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getChat = function() {
  return this._chat;
};

/**
 * Sets the entityUpdate of this WebsocketWrapper.
 * @param {tutao.entity.sys.EntityUpdate} entityUpdate The entityUpdate of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.setEntityUpdate = function(entityUpdate) {
  this._entityUpdate = entityUpdate;
  return this;
};

/**
 * Provides the entityUpdate of this WebsocketWrapper.
 * @return {tutao.entity.sys.EntityUpdate} The entityUpdate of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getEntityUpdate = function() {
  return this._entityUpdate;
};

/**
 * Provides the eventBatch of this WebsocketWrapper.
 * @return {Array.<tutao.entity.sys.EntityUpdate>} The eventBatch of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getEventBatch = function() {
  return this._eventBatch;
};

/**
 * Sets the exception of this WebsocketWrapper.
 * @param {tutao.entity.sys.Exception} exception The exception of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.setException = function(exception) {
  this._exception = exception;
  return this;
};

/**
 * Provides the exception of this WebsocketWrapper.
 * @return {tutao.entity.sys.Exception} The exception of this WebsocketWrapper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getException = function() {
  return this._exception;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.WebsocketWrapper.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
