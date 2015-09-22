"use strict";

tutao.provide('tutao.entity.sys.MembershipAddData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MembershipAddData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._symEncGKey = null;
    this._group = null;
    this._user = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.MembershipAddData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MembershipAddData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._symEncGKey = data.symEncGKey;
  this._group = data.group;
  this._user = data.user;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.MembershipAddData.MODEL_VERSION = '10';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.MembershipAddData.PATH = '/rest/sys/membershipservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.MembershipAddData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.MembershipAddData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    symEncGKey: this._symEncGKey, 
    group: this._group, 
    user: this._user
  };
};

/**
 * The id of the MembershipAddData type.
 */
tutao.entity.sys.MembershipAddData.prototype.TYPE_ID = 505;

/**
 * The id of the symEncGKey attribute.
 */
tutao.entity.sys.MembershipAddData.prototype.SYMENCGKEY_ATTRIBUTE_ID = 507;

/**
 * The id of the group attribute.
 */
tutao.entity.sys.MembershipAddData.prototype.GROUP_ATTRIBUTE_ID = 509;

/**
 * The id of the user attribute.
 */
tutao.entity.sys.MembershipAddData.prototype.USER_ATTRIBUTE_ID = 508;

/**
 * Sets the format of this MembershipAddData.
 * @param {string} format The format of this MembershipAddData.
 */
tutao.entity.sys.MembershipAddData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MembershipAddData.
 * @return {string} The format of this MembershipAddData.
 */
tutao.entity.sys.MembershipAddData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the symEncGKey of this MembershipAddData.
 * @param {string} symEncGKey The symEncGKey of this MembershipAddData.
 */
tutao.entity.sys.MembershipAddData.prototype.setSymEncGKey = function(symEncGKey) {
  this._symEncGKey = symEncGKey;
  return this;
};

/**
 * Provides the symEncGKey of this MembershipAddData.
 * @return {string} The symEncGKey of this MembershipAddData.
 */
tutao.entity.sys.MembershipAddData.prototype.getSymEncGKey = function() {
  return this._symEncGKey;
};

/**
 * Sets the group of this MembershipAddData.
 * @param {string} group The group of this MembershipAddData.
 */
tutao.entity.sys.MembershipAddData.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this MembershipAddData.
 * @return {string} The group of this MembershipAddData.
 */
tutao.entity.sys.MembershipAddData.prototype.getGroup = function() {
  return this._group;
};

/**
 * Loads the group of this MembershipAddData.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded group of this MembershipAddData or an exception if the loading failed.
 */
tutao.entity.sys.MembershipAddData.prototype.loadGroup = function() {
  return tutao.entity.sys.Group.load(this._group);
};

/**
 * Sets the user of this MembershipAddData.
 * @param {string} user The user of this MembershipAddData.
 */
tutao.entity.sys.MembershipAddData.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this MembershipAddData.
 * @return {string} The user of this MembershipAddData.
 */
tutao.entity.sys.MembershipAddData.prototype.getUser = function() {
  return this._user;
};

/**
 * Loads the user of this MembershipAddData.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded user of this MembershipAddData or an exception if the loading failed.
 */
tutao.entity.sys.MembershipAddData.prototype.loadUser = function() {
  return tutao.entity.sys.User.load(this._user);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.MembershipAddData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 10;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.MembershipAddData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.MembershipAddData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
