"use strict";

tutao.provide('tutao.entity.sys.UserAuthentication');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserAuthentication = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._secondFactors = null;
    this._sessions = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.UserAuthentication.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserAuthentication.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._secondFactors = data.secondFactors;
  this._sessions = data.sessions;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.UserAuthentication.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    secondFactors: this._secondFactors, 
    sessions: this._sessions
  };
};

/**
 * Sets the id of this UserAuthentication.
 * @param {string} id The id of this UserAuthentication.
 */
tutao.entity.sys.UserAuthentication.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this UserAuthentication.
 * @return {string} The id of this UserAuthentication.
 */
tutao.entity.sys.UserAuthentication.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the secondFactors of this UserAuthentication.
 * @param {string} secondFactors The secondFactors of this UserAuthentication.
 */
tutao.entity.sys.UserAuthentication.prototype.setSecondFactors = function(secondFactors) {
  this._secondFactors = secondFactors;
  return this;
};

/**
 * Provides the secondFactors of this UserAuthentication.
 * @return {string} The secondFactors of this UserAuthentication.
 */
tutao.entity.sys.UserAuthentication.prototype.getSecondFactors = function() {
  return this._secondFactors;
};

/**
 * Sets the sessions of this UserAuthentication.
 * @param {string} sessions The sessions of this UserAuthentication.
 */
tutao.entity.sys.UserAuthentication.prototype.setSessions = function(sessions) {
  this._sessions = sessions;
  return this;
};

/**
 * Provides the sessions of this UserAuthentication.
 * @return {string} The sessions of this UserAuthentication.
 */
tutao.entity.sys.UserAuthentication.prototype.getSessions = function() {
  return this._sessions;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.UserAuthentication.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
