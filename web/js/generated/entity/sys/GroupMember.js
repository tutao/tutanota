"use strict";

tutao.provide('tutao.entity.sys.GroupMember');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.GroupMember = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._group = null;
    this._user = null;
    this._userGroupInfo = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.GroupMember.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.GroupMember.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._group = data.group;
  this._user = data.user;
  this._userGroupInfo = data.userGroupInfo;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.GroupMember.MODEL_VERSION = '12';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.GroupMember.PATH = '/rest/sys/groupmember';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.GroupMember.ROOT_INSTANCE_ID = 'A3N5cwAA2A';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.GroupMember.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.GroupMember.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.GroupMember.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    group: this._group, 
    user: this._user, 
    userGroupInfo: this._userGroupInfo
  };
};

/**
 * The id of the GroupMember type.
 */
tutao.entity.sys.GroupMember.prototype.TYPE_ID = 216;

/**
 * The id of the group attribute.
 */
tutao.entity.sys.GroupMember.prototype.GROUP_ATTRIBUTE_ID = 222;

/**
 * The id of the user attribute.
 */
tutao.entity.sys.GroupMember.prototype.USER_ATTRIBUTE_ID = 223;

/**
 * The id of the userGroupInfo attribute.
 */
tutao.entity.sys.GroupMember.prototype.USERGROUPINFO_ATTRIBUTE_ID = 221;

/**
 * Provides the id of this GroupMember.
 * @return {Array.<string>} The id of this GroupMember.
 */
tutao.entity.sys.GroupMember.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this GroupMember.
 * @param {string} format The format of this GroupMember.
 */
tutao.entity.sys.GroupMember.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this GroupMember.
 * @return {string} The format of this GroupMember.
 */
tutao.entity.sys.GroupMember.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this GroupMember.
 * @param {string} permissions The permissions of this GroupMember.
 */
tutao.entity.sys.GroupMember.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this GroupMember.
 * @return {string} The permissions of this GroupMember.
 */
tutao.entity.sys.GroupMember.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the group of this GroupMember.
 * @param {string} group The group of this GroupMember.
 */
tutao.entity.sys.GroupMember.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this GroupMember.
 * @return {string} The group of this GroupMember.
 */
tutao.entity.sys.GroupMember.prototype.getGroup = function() {
  return this._group;
};

/**
 * Loads the group of this GroupMember.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded group of this GroupMember or an exception if the loading failed.
 */
tutao.entity.sys.GroupMember.prototype.loadGroup = function() {
  return tutao.entity.sys.Group.load(this._group);
};

/**
 * Sets the user of this GroupMember.
 * @param {string} user The user of this GroupMember.
 */
tutao.entity.sys.GroupMember.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this GroupMember.
 * @return {string} The user of this GroupMember.
 */
tutao.entity.sys.GroupMember.prototype.getUser = function() {
  return this._user;
};

/**
 * Loads the user of this GroupMember.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded user of this GroupMember or an exception if the loading failed.
 */
tutao.entity.sys.GroupMember.prototype.loadUser = function() {
  return tutao.entity.sys.User.load(this._user);
};

/**
 * Sets the userGroupInfo of this GroupMember.
 * @param {Array.<string>} userGroupInfo The userGroupInfo of this GroupMember.
 */
tutao.entity.sys.GroupMember.prototype.setUserGroupInfo = function(userGroupInfo) {
  this._userGroupInfo = userGroupInfo;
  return this;
};

/**
 * Provides the userGroupInfo of this GroupMember.
 * @return {Array.<string>} The userGroupInfo of this GroupMember.
 */
tutao.entity.sys.GroupMember.prototype.getUserGroupInfo = function() {
  return this._userGroupInfo;
};

/**
 * Loads the userGroupInfo of this GroupMember.
 * @return {Promise.<tutao.entity.sys.GroupInfo>} Resolves to the loaded userGroupInfo of this GroupMember or an exception if the loading failed.
 */
tutao.entity.sys.GroupMember.prototype.loadUserGroupInfo = function() {
  return tutao.entity.sys.GroupInfo.load(this._userGroupInfo);
};

/**
 * Loads a GroupMember from the server.
 * @param {Array.<string>} id The id of the GroupMember.
 * @return {Promise.<tutao.entity.sys.GroupMember>} Resolves to the GroupMember or an exception if the loading failed.
 */
tutao.entity.sys.GroupMember.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.GroupMember, tutao.entity.sys.GroupMember.PATH, id[1], id[0], {"v" : 12}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple GroupMembers from the server.
 * @param {Array.<Array.<string>>} ids The ids of the GroupMembers to load.
 * @return {Promise.<Array.<tutao.entity.sys.GroupMember>>} Resolves to an array of GroupMember or rejects with an exception if the loading failed.
 */
tutao.entity.sys.GroupMember.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.GroupMember, tutao.entity.sys.GroupMember.PATH, ids, {"v": 12}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.GroupMember.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 12;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.GroupMember.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of GroupMembers loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.GroupMember>>} Resolves to an array of GroupMember or rejects with an exception if the loading failed.
 */
tutao.entity.sys.GroupMember.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.GroupMember, tutao.entity.sys.GroupMember.PATH, listId, start, count, reverse, {"v": 12}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.GroupMember.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.GroupMember.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.GroupMember.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
