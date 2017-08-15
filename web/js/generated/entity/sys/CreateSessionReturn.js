"use strict";

tutao.provide('tutao.entity.sys.CreateSessionReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CreateSessionReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._accessToken = null;
    this._challenges = [];
    this._user = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CreateSessionReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CreateSessionReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._accessToken = data.accessToken;
  this._challenges = [];
  for (var i=0; i < data.challenges.length; i++) {
    this._challenges.push(new tutao.entity.sys.Challenge(this, data.challenges[i]));
  }
  this._user = data.user;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CreateSessionReturn.MODEL_VERSION = '23';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CreateSessionReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CreateSessionReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    accessToken: this._accessToken, 
    challenges: tutao.entity.EntityHelper.aggregatesToJsonData(this._challenges), 
    user: this._user
  };
};

/**
 * Sets the format of this CreateSessionReturn.
 * @param {string} format The format of this CreateSessionReturn.
 */
tutao.entity.sys.CreateSessionReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateSessionReturn.
 * @return {string} The format of this CreateSessionReturn.
 */
tutao.entity.sys.CreateSessionReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the accessToken of this CreateSessionReturn.
 * @param {string} accessToken The accessToken of this CreateSessionReturn.
 */
tutao.entity.sys.CreateSessionReturn.prototype.setAccessToken = function(accessToken) {
  this._accessToken = accessToken;
  return this;
};

/**
 * Provides the accessToken of this CreateSessionReturn.
 * @return {string} The accessToken of this CreateSessionReturn.
 */
tutao.entity.sys.CreateSessionReturn.prototype.getAccessToken = function() {
  return this._accessToken;
};

/**
 * Provides the challenges of this CreateSessionReturn.
 * @return {Array.<tutao.entity.sys.Challenge>} The challenges of this CreateSessionReturn.
 */
tutao.entity.sys.CreateSessionReturn.prototype.getChallenges = function() {
  return this._challenges;
};

/**
 * Sets the user of this CreateSessionReturn.
 * @param {string} user The user of this CreateSessionReturn.
 */
tutao.entity.sys.CreateSessionReturn.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this CreateSessionReturn.
 * @return {string} The user of this CreateSessionReturn.
 */
tutao.entity.sys.CreateSessionReturn.prototype.getUser = function() {
  return this._user;
};

/**
 * Loads the user of this CreateSessionReturn.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded user of this CreateSessionReturn or an exception if the loading failed.
 */
tutao.entity.sys.CreateSessionReturn.prototype.loadUser = function() {
  return tutao.entity.sys.User.load(this._user);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CreateSessionReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
