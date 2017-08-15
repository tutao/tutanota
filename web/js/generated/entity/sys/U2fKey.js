"use strict";

tutao.provide('tutao.entity.sys.U2fKey');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.U2fKey = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._keyHandle = null;
    this._secondFactor = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.U2fKey.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.U2fKey.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._keyHandle = data.keyHandle;
  this._secondFactor = data.secondFactor;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.U2fKey.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    keyHandle: this._keyHandle, 
    secondFactor: this._secondFactor
  };
};

/**
 * Sets the id of this U2fKey.
 * @param {string} id The id of this U2fKey.
 */
tutao.entity.sys.U2fKey.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this U2fKey.
 * @return {string} The id of this U2fKey.
 */
tutao.entity.sys.U2fKey.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the keyHandle of this U2fKey.
 * @param {string} keyHandle The keyHandle of this U2fKey.
 */
tutao.entity.sys.U2fKey.prototype.setKeyHandle = function(keyHandle) {
  this._keyHandle = keyHandle;
  return this;
};

/**
 * Provides the keyHandle of this U2fKey.
 * @return {string} The keyHandle of this U2fKey.
 */
tutao.entity.sys.U2fKey.prototype.getKeyHandle = function() {
  return this._keyHandle;
};

/**
 * Sets the secondFactor of this U2fKey.
 * @param {Array.<string>} secondFactor The secondFactor of this U2fKey.
 */
tutao.entity.sys.U2fKey.prototype.setSecondFactor = function(secondFactor) {
  this._secondFactor = secondFactor;
  return this;
};

/**
 * Provides the secondFactor of this U2fKey.
 * @return {Array.<string>} The secondFactor of this U2fKey.
 */
tutao.entity.sys.U2fKey.prototype.getSecondFactor = function() {
  return this._secondFactor;
};

/**
 * Loads the secondFactor of this U2fKey.
 * @return {Promise.<tutao.entity.sys.SecondFactor>} Resolves to the loaded secondFactor of this U2fKey or an exception if the loading failed.
 */
tutao.entity.sys.U2fKey.prototype.loadSecondFactor = function() {
  return tutao.entity.sys.SecondFactor.load(this._secondFactor);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.U2fKey.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
