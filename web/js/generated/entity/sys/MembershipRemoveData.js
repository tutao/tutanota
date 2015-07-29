"use strict";

tutao.provide('tutao.entity.sys.MembershipRemoveData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MembershipRemoveData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._group = null;
    this._user = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.MembershipRemoveData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MembershipRemoveData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._group = data.group;
  this._user = data.user;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.MembershipRemoveData.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.MembershipRemoveData.PATH = '/rest/sys/membershipservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.MembershipRemoveData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.MembershipRemoveData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    group: this._group, 
    user: this._user
  };
};

/**
 * The id of the MembershipRemoveData type.
 */
tutao.entity.sys.MembershipRemoveData.prototype.TYPE_ID = 867;

/**
 * The id of the group attribute.
 */
tutao.entity.sys.MembershipRemoveData.prototype.GROUP_ATTRIBUTE_ID = 870;

/**
 * The id of the user attribute.
 */
tutao.entity.sys.MembershipRemoveData.prototype.USER_ATTRIBUTE_ID = 869;

/**
 * Sets the format of this MembershipRemoveData.
 * @param {string} format The format of this MembershipRemoveData.
 */
tutao.entity.sys.MembershipRemoveData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MembershipRemoveData.
 * @return {string} The format of this MembershipRemoveData.
 */
tutao.entity.sys.MembershipRemoveData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the group of this MembershipRemoveData.
 * @param {string} group The group of this MembershipRemoveData.
 */
tutao.entity.sys.MembershipRemoveData.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this MembershipRemoveData.
 * @return {string} The group of this MembershipRemoveData.
 */
tutao.entity.sys.MembershipRemoveData.prototype.getGroup = function() {
  return this._group;
};

/**
 * Loads the group of this MembershipRemoveData.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded group of this MembershipRemoveData or an exception if the loading failed.
 */
tutao.entity.sys.MembershipRemoveData.prototype.loadGroup = function() {
  return tutao.entity.sys.Group.load(this._group);
};

/**
 * Sets the user of this MembershipRemoveData.
 * @param {string} user The user of this MembershipRemoveData.
 */
tutao.entity.sys.MembershipRemoveData.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this MembershipRemoveData.
 * @return {string} The user of this MembershipRemoveData.
 */
tutao.entity.sys.MembershipRemoveData.prototype.getUser = function() {
  return this._user;
};

/**
 * Loads the user of this MembershipRemoveData.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded user of this MembershipRemoveData or an exception if the loading failed.
 */
tutao.entity.sys.MembershipRemoveData.prototype.loadUser = function() {
  return tutao.entity.sys.User.load(this._user);
};

/**
 * Invokes DELETE on a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.MembershipRemoveData=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.MembershipRemoveData.prototype.erase = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 9;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.deleteService(tutao.entity.sys.MembershipRemoveData.PATH, this, parameters, headers, null);
};
