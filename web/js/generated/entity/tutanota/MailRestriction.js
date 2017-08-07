"use strict";

tutao.provide('tutao.entity.tutanota.MailRestriction');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailRestriction = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._delegationGroups_removed = [];
    this._participantGroupInfos = [];
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.MailRestriction.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailRestriction.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._delegationGroups_removed = data.delegationGroups_removed;
  this._participantGroupInfos = data.participantGroupInfos;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MailRestriction.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    delegationGroups_removed: this._delegationGroups_removed, 
    participantGroupInfos: this._participantGroupInfos
  };
};

/**
 * Sets the id of this MailRestriction.
 * @param {string} id The id of this MailRestriction.
 */
tutao.entity.tutanota.MailRestriction.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this MailRestriction.
 * @return {string} The id of this MailRestriction.
 */
tutao.entity.tutanota.MailRestriction.prototype.getId = function() {
  return this.__id;
};

/**
 * Provides the delegationGroups_removed of this MailRestriction.
 * @return {Array.<string>} The delegationGroups_removed of this MailRestriction.
 */
tutao.entity.tutanota.MailRestriction.prototype.getDelegationGroups_removed = function() {
  return this._delegationGroups_removed;
};

/**
 * Provides the participantGroupInfos of this MailRestriction.
 * @return {Array.<Array.<string>>} The participantGroupInfos of this MailRestriction.
 */
tutao.entity.tutanota.MailRestriction.prototype.getParticipantGroupInfos = function() {
  return this._participantGroupInfos;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MailRestriction.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
