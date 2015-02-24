"use strict";

tutao.provide('tutao.entity.sys.KeyPair');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.KeyPair = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._pubKey = null;
    this._symEncPrivKey = null;
    this._version = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.KeyPair.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.KeyPair.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._pubKey = data.pubKey;
  this._symEncPrivKey = data.symEncPrivKey;
  this._version = data.version;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.KeyPair.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    pubKey: this._pubKey, 
    symEncPrivKey: this._symEncPrivKey, 
    version: this._version
  };
};

/**
 * The id of the KeyPair type.
 */
tutao.entity.sys.KeyPair.prototype.TYPE_ID = 0;

/**
 * The id of the pubKey attribute.
 */
tutao.entity.sys.KeyPair.prototype.PUBKEY_ATTRIBUTE_ID = 2;

/**
 * The id of the symEncPrivKey attribute.
 */
tutao.entity.sys.KeyPair.prototype.SYMENCPRIVKEY_ATTRIBUTE_ID = 3;

/**
 * The id of the version attribute.
 */
tutao.entity.sys.KeyPair.prototype.VERSION_ATTRIBUTE_ID = 4;

/**
 * Sets the id of this KeyPair.
 * @param {string} id The id of this KeyPair.
 */
tutao.entity.sys.KeyPair.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this KeyPair.
 * @return {string} The id of this KeyPair.
 */
tutao.entity.sys.KeyPair.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the pubKey of this KeyPair.
 * @param {string} pubKey The pubKey of this KeyPair.
 */
tutao.entity.sys.KeyPair.prototype.setPubKey = function(pubKey) {
  this._pubKey = pubKey;
  return this;
};

/**
 * Provides the pubKey of this KeyPair.
 * @return {string} The pubKey of this KeyPair.
 */
tutao.entity.sys.KeyPair.prototype.getPubKey = function() {
  return this._pubKey;
};

/**
 * Sets the symEncPrivKey of this KeyPair.
 * @param {string} symEncPrivKey The symEncPrivKey of this KeyPair.
 */
tutao.entity.sys.KeyPair.prototype.setSymEncPrivKey = function(symEncPrivKey) {
  this._symEncPrivKey = symEncPrivKey;
  return this;
};

/**
 * Provides the symEncPrivKey of this KeyPair.
 * @return {string} The symEncPrivKey of this KeyPair.
 */
tutao.entity.sys.KeyPair.prototype.getSymEncPrivKey = function() {
  return this._symEncPrivKey;
};

/**
 * Sets the version of this KeyPair.
 * @param {string} version The version of this KeyPair.
 */
tutao.entity.sys.KeyPair.prototype.setVersion = function(version) {
  this._version = version;
  return this;
};

/**
 * Provides the version of this KeyPair.
 * @return {string} The version of this KeyPair.
 */
tutao.entity.sys.KeyPair.prototype.getVersion = function() {
  return this._version;
};
