"use strict";

tutao.provide('tutao.entity.tutanota.ImapSyncConfiguration');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ImapSyncConfiguration = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._host = null;
    this._password = null;
    this._port = null;
    this._user = null;
    this._imapSyncState = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ImapSyncConfiguration.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._host = data.host;
  this._password = data.password;
  this._port = data.port;
  this._user = data.user;
  this._imapSyncState = data.imapSyncState;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    host: this._host, 
    password: this._password, 
    port: this._port, 
    user: this._user, 
    imapSyncState: this._imapSyncState
  };
};

/**
 * The id of the ImapSyncConfiguration type.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.TYPE_ID = 209;

/**
 * The id of the host attribute.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.HOST_ATTRIBUTE_ID = 211;

/**
 * The id of the password attribute.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.PASSWORD_ATTRIBUTE_ID = 214;

/**
 * The id of the port attribute.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.PORT_ATTRIBUTE_ID = 212;

/**
 * The id of the user attribute.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.USER_ATTRIBUTE_ID = 213;

/**
 * The id of the imapSyncState attribute.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.IMAPSYNCSTATE_ATTRIBUTE_ID = 215;

/**
 * Sets the id of this ImapSyncConfiguration.
 * @param {string} id The id of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ImapSyncConfiguration.
 * @return {string} The id of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the host of this ImapSyncConfiguration.
 * @param {string} host The host of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.setHost = function(host) {
  this._host = host;
  return this;
};

/**
 * Provides the host of this ImapSyncConfiguration.
 * @return {string} The host of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.getHost = function() {
  return this._host;
};

/**
 * Sets the password of this ImapSyncConfiguration.
 * @param {string} password The password of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.setPassword = function(password) {
  this._password = password;
  return this;
};

/**
 * Provides the password of this ImapSyncConfiguration.
 * @return {string} The password of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.getPassword = function() {
  return this._password;
};

/**
 * Sets the port of this ImapSyncConfiguration.
 * @param {string} port The port of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.setPort = function(port) {
  this._port = port;
  return this;
};

/**
 * Provides the port of this ImapSyncConfiguration.
 * @return {string} The port of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.getPort = function() {
  return this._port;
};

/**
 * Sets the user of this ImapSyncConfiguration.
 * @param {string} user The user of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this ImapSyncConfiguration.
 * @return {string} The user of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.getUser = function() {
  return this._user;
};

/**
 * Sets the imapSyncState of this ImapSyncConfiguration.
 * @param {string} imapSyncState The imapSyncState of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.setImapSyncState = function(imapSyncState) {
  this._imapSyncState = imapSyncState;
  return this;
};

/**
 * Provides the imapSyncState of this ImapSyncConfiguration.
 * @return {string} The imapSyncState of this ImapSyncConfiguration.
 */
tutao.entity.tutanota.ImapSyncConfiguration.prototype.getImapSyncState = function() {
  return this._imapSyncState;
};
