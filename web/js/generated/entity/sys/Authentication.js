"use strict";

tutao.provide('tutao.entity.sys.Authentication');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Authentication = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._authVerifier = null;
    this._userId = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.Authentication.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Authentication.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._authVerifier = data.authVerifier;
  this._userId = data.userId;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Authentication.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    authVerifier: this._authVerifier, 
    userId: this._userId
  };
};

/**
 * The id of the Authentication type.
 */
tutao.entity.sys.Authentication.prototype.TYPE_ID = 453;

/**
 * The id of the authVerifier attribute.
 */
tutao.entity.sys.Authentication.prototype.AUTHVERIFIER_ATTRIBUTE_ID = 456;

/**
 * The id of the userId attribute.
 */
tutao.entity.sys.Authentication.prototype.USERID_ATTRIBUTE_ID = 455;

/**
 * Sets the id of this Authentication.
 * @param {string} id The id of this Authentication.
 */
tutao.entity.sys.Authentication.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Authentication.
 * @return {string} The id of this Authentication.
 */
tutao.entity.sys.Authentication.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the authVerifier of this Authentication.
 * @param {string} authVerifier The authVerifier of this Authentication.
 */
tutao.entity.sys.Authentication.prototype.setAuthVerifier = function(authVerifier) {
  this._authVerifier = authVerifier;
  return this;
};

/**
 * Provides the authVerifier of this Authentication.
 * @return {string} The authVerifier of this Authentication.
 */
tutao.entity.sys.Authentication.prototype.getAuthVerifier = function() {
  return this._authVerifier;
};

/**
 * Sets the userId of this Authentication.
 * @param {string} userId The userId of this Authentication.
 */
tutao.entity.sys.Authentication.prototype.setUserId = function(userId) {
  this._userId = userId;
  return this;
};

/**
 * Provides the userId of this Authentication.
 * @return {string} The userId of this Authentication.
 */
tutao.entity.sys.Authentication.prototype.getUserId = function() {
  return this._userId;
};

/**
 * Loads the userId of this Authentication.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded userId of this Authentication or an exception if the loading failed.
 */
tutao.entity.sys.Authentication.prototype.loadUserId = function() {
  return tutao.entity.sys.User.load(this._userId);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.Authentication.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
