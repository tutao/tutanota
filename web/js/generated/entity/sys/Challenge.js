"use strict";

tutao.provide('tutao.entity.sys.Challenge');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Challenge = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._type = null;
    this._u2f = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.Challenge.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Challenge.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._type = data.type;
  this._u2f = (data.u2f) ? new tutao.entity.sys.U2fChallenge(parent, data.u2f) : null;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Challenge.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    type: this._type, 
    u2f: tutao.entity.EntityHelper.aggregatesToJsonData(this._u2f)
  };
};

/**
 * Sets the id of this Challenge.
 * @param {string} id The id of this Challenge.
 */
tutao.entity.sys.Challenge.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Challenge.
 * @return {string} The id of this Challenge.
 */
tutao.entity.sys.Challenge.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the type of this Challenge.
 * @param {string} type The type of this Challenge.
 */
tutao.entity.sys.Challenge.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this Challenge.
 * @return {string} The type of this Challenge.
 */
tutao.entity.sys.Challenge.prototype.getType = function() {
  return this._type;
};

/**
 * Sets the u2f of this Challenge.
 * @param {tutao.entity.sys.U2fChallenge} u2f The u2f of this Challenge.
 */
tutao.entity.sys.Challenge.prototype.setU2f = function(u2f) {
  this._u2f = u2f;
  return this;
};

/**
 * Provides the u2f of this Challenge.
 * @return {tutao.entity.sys.U2fChallenge} The u2f of this Challenge.
 */
tutao.entity.sys.Challenge.prototype.getU2f = function() {
  return this._u2f;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.Challenge.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
