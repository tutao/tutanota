"use strict";

tutao.provide('tutao.entity.sys.U2fRegisteredDevice');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.U2fRegisteredDevice = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._compromised = null;
    this._counter = null;
    this._keyHandle = null;
    this._publicKey = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.U2fRegisteredDevice.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._compromised = data.compromised;
  this._counter = data.counter;
  this._keyHandle = data.keyHandle;
  this._publicKey = data.publicKey;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    compromised: this._compromised, 
    counter: this._counter, 
    keyHandle: this._keyHandle, 
    publicKey: this._publicKey
  };
};

/**
 * Sets the id of this U2fRegisteredDevice.
 * @param {string} id The id of this U2fRegisteredDevice.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this U2fRegisteredDevice.
 * @return {string} The id of this U2fRegisteredDevice.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the compromised of this U2fRegisteredDevice.
 * @param {boolean} compromised The compromised of this U2fRegisteredDevice.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.setCompromised = function(compromised) {
  this._compromised = compromised ? '1' : '0';
  return this;
};

/**
 * Provides the compromised of this U2fRegisteredDevice.
 * @return {boolean} The compromised of this U2fRegisteredDevice.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.getCompromised = function() {
  return this._compromised != '0';
};

/**
 * Sets the counter of this U2fRegisteredDevice.
 * @param {string} counter The counter of this U2fRegisteredDevice.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.setCounter = function(counter) {
  this._counter = counter;
  return this;
};

/**
 * Provides the counter of this U2fRegisteredDevice.
 * @return {string} The counter of this U2fRegisteredDevice.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.getCounter = function() {
  return this._counter;
};

/**
 * Sets the keyHandle of this U2fRegisteredDevice.
 * @param {string} keyHandle The keyHandle of this U2fRegisteredDevice.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.setKeyHandle = function(keyHandle) {
  this._keyHandle = keyHandle;
  return this;
};

/**
 * Provides the keyHandle of this U2fRegisteredDevice.
 * @return {string} The keyHandle of this U2fRegisteredDevice.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.getKeyHandle = function() {
  return this._keyHandle;
};

/**
 * Sets the publicKey of this U2fRegisteredDevice.
 * @param {string} publicKey The publicKey of this U2fRegisteredDevice.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.setPublicKey = function(publicKey) {
  this._publicKey = publicKey;
  return this;
};

/**
 * Provides the publicKey of this U2fRegisteredDevice.
 * @return {string} The publicKey of this U2fRegisteredDevice.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.getPublicKey = function() {
  return this._publicKey;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.U2fRegisteredDevice.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
