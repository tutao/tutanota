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
    this._replyToSenderOnly = null;
    this._delegationGroups = [];
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
  this._replyToSenderOnly = data.replyToSenderOnly;
  this._delegationGroups = data.delegationGroups;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MailRestriction.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    replyToSenderOnly: this._replyToSenderOnly, 
    delegationGroups: this._delegationGroups
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
 * Sets the replyToSenderOnly of this MailRestriction.
 * @param {boolean} replyToSenderOnly The replyToSenderOnly of this MailRestriction.
 */
tutao.entity.tutanota.MailRestriction.prototype.setReplyToSenderOnly = function(replyToSenderOnly) {
  this._replyToSenderOnly = replyToSenderOnly ? '1' : '0';
  return this;
};

/**
 * Provides the replyToSenderOnly of this MailRestriction.
 * @return {boolean} The replyToSenderOnly of this MailRestriction.
 */
tutao.entity.tutanota.MailRestriction.prototype.getReplyToSenderOnly = function() {
  return this._replyToSenderOnly != '0';
};

/**
 * Provides the delegationGroups of this MailRestriction.
 * @return {Array.<string>} The delegationGroups of this MailRestriction.
 */
tutao.entity.tutanota.MailRestriction.prototype.getDelegationGroups = function() {
  return this._delegationGroups;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MailRestriction.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
