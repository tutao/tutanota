"use strict";

tutao.provide('tutao.entity.sys.U2fChallenge');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.U2fChallenge = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._challenge = null;
    this._keys = [];
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.U2fChallenge.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.U2fChallenge.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._challenge = data.challenge;
  this._keys = [];
  for (var i=0; i < data.keys.length; i++) {
    this._keys.push(new tutao.entity.sys.U2fKey(parent, data.keys[i]));
  }
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.U2fChallenge.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    challenge: this._challenge, 
    keys: tutao.entity.EntityHelper.aggregatesToJsonData(this._keys)
  };
};

/**
 * Sets the id of this U2fChallenge.
 * @param {string} id The id of this U2fChallenge.
 */
tutao.entity.sys.U2fChallenge.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this U2fChallenge.
 * @return {string} The id of this U2fChallenge.
 */
tutao.entity.sys.U2fChallenge.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the challenge of this U2fChallenge.
 * @param {string} challenge The challenge of this U2fChallenge.
 */
tutao.entity.sys.U2fChallenge.prototype.setChallenge = function(challenge) {
  this._challenge = challenge;
  return this;
};

/**
 * Provides the challenge of this U2fChallenge.
 * @return {string} The challenge of this U2fChallenge.
 */
tutao.entity.sys.U2fChallenge.prototype.getChallenge = function() {
  return this._challenge;
};

/**
 * Provides the keys of this U2fChallenge.
 * @return {Array.<tutao.entity.sys.U2fKey>} The keys of this U2fChallenge.
 */
tutao.entity.sys.U2fChallenge.prototype.getKeys = function() {
  return this._keys;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.U2fChallenge.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
