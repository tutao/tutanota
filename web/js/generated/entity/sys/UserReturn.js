"use strict";

tutao.provide('tutao.entity.sys.UserReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._user = null;
    this._userGroup = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.UserReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.UserReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._user = data.user;
  this._userGroup = data.userGroup;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.UserReturn.MODEL_VERSION = '9';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.UserReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.UserReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    user: this._user, 
    userGroup: this._userGroup
  };
};

/**
 * The id of the UserReturn type.
 */
tutao.entity.sys.UserReturn.prototype.TYPE_ID = 392;

/**
 * The id of the user attribute.
 */
tutao.entity.sys.UserReturn.prototype.USER_ATTRIBUTE_ID = 394;

/**
 * The id of the userGroup attribute.
 */
tutao.entity.sys.UserReturn.prototype.USERGROUP_ATTRIBUTE_ID = 395;

/**
 * Sets the format of this UserReturn.
 * @param {string} format The format of this UserReturn.
 */
tutao.entity.sys.UserReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this UserReturn.
 * @return {string} The format of this UserReturn.
 */
tutao.entity.sys.UserReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the user of this UserReturn.
 * @param {string} user The user of this UserReturn.
 */
tutao.entity.sys.UserReturn.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this UserReturn.
 * @return {string} The user of this UserReturn.
 */
tutao.entity.sys.UserReturn.prototype.getUser = function() {
  return this._user;
};

/**
 * Loads the user of this UserReturn.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded user of this UserReturn or an exception if the loading failed.
 */
tutao.entity.sys.UserReturn.prototype.loadUser = function() {
  return tutao.entity.sys.User.load(this._user);
};

/**
 * Sets the userGroup of this UserReturn.
 * @param {string} userGroup The userGroup of this UserReturn.
 */
tutao.entity.sys.UserReturn.prototype.setUserGroup = function(userGroup) {
  this._userGroup = userGroup;
  return this;
};

/**
 * Provides the userGroup of this UserReturn.
 * @return {string} The userGroup of this UserReturn.
 */
tutao.entity.sys.UserReturn.prototype.getUserGroup = function() {
  return this._userGroup;
};

/**
 * Loads the userGroup of this UserReturn.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded userGroup of this UserReturn or an exception if the loading failed.
 */
tutao.entity.sys.UserReturn.prototype.loadUserGroup = function() {
  return tutao.entity.sys.Group.load(this._userGroup);
};
