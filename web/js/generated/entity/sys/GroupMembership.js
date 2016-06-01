"use strict";

tutao.provide('tutao.entity.sys.GroupMembership');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.GroupMembership = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._admin = null;
    this._groupType = null;
    this._symEncGKey = null;
    this._group = null;
    this._groupInfo = null;
    this._groupMember = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.GroupMembership.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.GroupMembership.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._admin = data.admin;
  this._groupType = data.groupType;
  this._symEncGKey = data.symEncGKey;
  this._group = data.group;
  this._groupInfo = data.groupInfo;
  this._groupMember = data.groupMember;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.GroupMembership.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    admin: this._admin, 
    groupType: this._groupType, 
    symEncGKey: this._symEncGKey, 
    group: this._group, 
    groupInfo: this._groupInfo, 
    groupMember: this._groupMember
  };
};

/**
 * The id of the GroupMembership type.
 */
tutao.entity.sys.GroupMembership.prototype.TYPE_ID = 25;

/**
 * The id of the admin attribute.
 */
tutao.entity.sys.GroupMembership.prototype.ADMIN_ATTRIBUTE_ID = 28;

/**
 * The id of the groupType attribute.
 */
tutao.entity.sys.GroupMembership.prototype.GROUPTYPE_ATTRIBUTE_ID = 1029;

/**
 * The id of the symEncGKey attribute.
 */
tutao.entity.sys.GroupMembership.prototype.SYMENCGKEY_ATTRIBUTE_ID = 27;

/**
 * The id of the group attribute.
 */
tutao.entity.sys.GroupMembership.prototype.GROUP_ATTRIBUTE_ID = 29;

/**
 * The id of the groupInfo attribute.
 */
tutao.entity.sys.GroupMembership.prototype.GROUPINFO_ATTRIBUTE_ID = 30;

/**
 * The id of the groupMember attribute.
 */
tutao.entity.sys.GroupMembership.prototype.GROUPMEMBER_ATTRIBUTE_ID = 230;

/**
 * Sets the id of this GroupMembership.
 * @param {string} id The id of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this GroupMembership.
 * @return {string} The id of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the admin of this GroupMembership.
 * @param {boolean} admin The admin of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.setAdmin = function(admin) {
  this._admin = admin ? '1' : '0';
  return this;
};

/**
 * Provides the admin of this GroupMembership.
 * @return {boolean} The admin of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.getAdmin = function() {
  return this._admin != '0';
};

/**
 * Sets the groupType of this GroupMembership.
 * @param {string} groupType The groupType of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.setGroupType = function(groupType) {
  this._groupType = groupType;
  return this;
};

/**
 * Provides the groupType of this GroupMembership.
 * @return {string} The groupType of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.getGroupType = function() {
  return this._groupType;
};

/**
 * Sets the symEncGKey of this GroupMembership.
 * @param {string} symEncGKey The symEncGKey of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.setSymEncGKey = function(symEncGKey) {
  this._symEncGKey = symEncGKey;
  return this;
};

/**
 * Provides the symEncGKey of this GroupMembership.
 * @return {string} The symEncGKey of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.getSymEncGKey = function() {
  return this._symEncGKey;
};

/**
 * Sets the group of this GroupMembership.
 * @param {string} group The group of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this GroupMembership.
 * @return {string} The group of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.getGroup = function() {
  return this._group;
};

/**
 * Loads the group of this GroupMembership.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded group of this GroupMembership or an exception if the loading failed.
 */
tutao.entity.sys.GroupMembership.prototype.loadGroup = function() {
  return tutao.entity.sys.Group.load(this._group);
};

/**
 * Sets the groupInfo of this GroupMembership.
 * @param {Array.<string>} groupInfo The groupInfo of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.setGroupInfo = function(groupInfo) {
  this._groupInfo = groupInfo;
  return this;
};

/**
 * Provides the groupInfo of this GroupMembership.
 * @return {Array.<string>} The groupInfo of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.getGroupInfo = function() {
  return this._groupInfo;
};

/**
 * Loads the groupInfo of this GroupMembership.
 * @return {Promise.<tutao.entity.sys.GroupInfo>} Resolves to the loaded groupInfo of this GroupMembership or an exception if the loading failed.
 */
tutao.entity.sys.GroupMembership.prototype.loadGroupInfo = function() {
  return tutao.entity.sys.GroupInfo.load(this._groupInfo);
};

/**
 * Sets the groupMember of this GroupMembership.
 * @param {Array.<string>} groupMember The groupMember of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.setGroupMember = function(groupMember) {
  this._groupMember = groupMember;
  return this;
};

/**
 * Provides the groupMember of this GroupMembership.
 * @return {Array.<string>} The groupMember of this GroupMembership.
 */
tutao.entity.sys.GroupMembership.prototype.getGroupMember = function() {
  return this._groupMember;
};

/**
 * Loads the groupMember of this GroupMembership.
 * @return {Promise.<tutao.entity.sys.GroupMember>} Resolves to the loaded groupMember of this GroupMembership or an exception if the loading failed.
 */
tutao.entity.sys.GroupMembership.prototype.loadGroupMember = function() {
  return tutao.entity.sys.GroupMember.load(this._groupMember);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.GroupMembership.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
