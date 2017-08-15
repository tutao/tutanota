"use strict";

tutao.provide('tutao.entity.sys.U2fResponseData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.U2fResponseData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._clientData = null;
    this._keyHandle = null;
    this._signatureData = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.U2fResponseData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.U2fResponseData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._clientData = data.clientData;
  this._keyHandle = data.keyHandle;
  this._signatureData = data.signatureData;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.U2fResponseData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    clientData: this._clientData, 
    keyHandle: this._keyHandle, 
    signatureData: this._signatureData
  };
};

/**
 * Sets the id of this U2fResponseData.
 * @param {string} id The id of this U2fResponseData.
 */
tutao.entity.sys.U2fResponseData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this U2fResponseData.
 * @return {string} The id of this U2fResponseData.
 */
tutao.entity.sys.U2fResponseData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the clientData of this U2fResponseData.
 * @param {string} clientData The clientData of this U2fResponseData.
 */
tutao.entity.sys.U2fResponseData.prototype.setClientData = function(clientData) {
  this._clientData = clientData;
  return this;
};

/**
 * Provides the clientData of this U2fResponseData.
 * @return {string} The clientData of this U2fResponseData.
 */
tutao.entity.sys.U2fResponseData.prototype.getClientData = function() {
  return this._clientData;
};

/**
 * Sets the keyHandle of this U2fResponseData.
 * @param {string} keyHandle The keyHandle of this U2fResponseData.
 */
tutao.entity.sys.U2fResponseData.prototype.setKeyHandle = function(keyHandle) {
  this._keyHandle = keyHandle;
  return this;
};

/**
 * Provides the keyHandle of this U2fResponseData.
 * @return {string} The keyHandle of this U2fResponseData.
 */
tutao.entity.sys.U2fResponseData.prototype.getKeyHandle = function() {
  return this._keyHandle;
};

/**
 * Sets the signatureData of this U2fResponseData.
 * @param {string} signatureData The signatureData of this U2fResponseData.
 */
tutao.entity.sys.U2fResponseData.prototype.setSignatureData = function(signatureData) {
  this._signatureData = signatureData;
  return this;
};

/**
 * Provides the signatureData of this U2fResponseData.
 * @return {string} The signatureData of this U2fResponseData.
 */
tutao.entity.sys.U2fResponseData.prototype.getSignatureData = function() {
  return this._signatureData;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.U2fResponseData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
