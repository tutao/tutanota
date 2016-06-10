"use strict";

tutao.provide('tutao.entity.sys.MigratedGroupInfoData');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MigratedGroupInfoData = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._ownerEncSessionKey = null;
    this._groupInfo = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.MigratedGroupInfoData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MigratedGroupInfoData.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._ownerEncSessionKey = data.ownerEncSessionKey;
  this._groupInfo = data.groupInfo;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.MigratedGroupInfoData.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    ownerEncSessionKey: this._ownerEncSessionKey, 
    groupInfo: this._groupInfo
  };
};

/**
 * Sets the id of this MigratedGroupInfoData.
 * @param {string} id The id of this MigratedGroupInfoData.
 */
tutao.entity.sys.MigratedGroupInfoData.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this MigratedGroupInfoData.
 * @return {string} The id of this MigratedGroupInfoData.
 */
tutao.entity.sys.MigratedGroupInfoData.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the ownerEncSessionKey of this MigratedGroupInfoData.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this MigratedGroupInfoData.
 */
tutao.entity.sys.MigratedGroupInfoData.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this._ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this MigratedGroupInfoData.
 * @return {string} The ownerEncSessionKey of this MigratedGroupInfoData.
 */
tutao.entity.sys.MigratedGroupInfoData.prototype.getOwnerEncSessionKey = function() {
  return this._ownerEncSessionKey;
};

/**
 * Sets the groupInfo of this MigratedGroupInfoData.
 * @param {Array.<string>} groupInfo The groupInfo of this MigratedGroupInfoData.
 */
tutao.entity.sys.MigratedGroupInfoData.prototype.setGroupInfo = function(groupInfo) {
  this._groupInfo = groupInfo;
  return this;
};

/**
 * Provides the groupInfo of this MigratedGroupInfoData.
 * @return {Array.<string>} The groupInfo of this MigratedGroupInfoData.
 */
tutao.entity.sys.MigratedGroupInfoData.prototype.getGroupInfo = function() {
  return this._groupInfo;
};

/**
 * Loads the groupInfo of this MigratedGroupInfoData.
 * @return {Promise.<tutao.entity.sys.GroupInfo>} Resolves to the loaded groupInfo of this MigratedGroupInfoData or an exception if the loading failed.
 */
tutao.entity.sys.MigratedGroupInfoData.prototype.loadGroupInfo = function() {
  return tutao.entity.sys.GroupInfo.load(this._groupInfo);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.MigratedGroupInfoData.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
