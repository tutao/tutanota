"use strict";

tutao.provide('tutao.entity.tutanota.MailListDeletions');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailListDeletions = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._deletionDate = null;
    this._originalMailList = null;
    this._mails = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.MailListDeletions.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailListDeletions.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._deletionDate = data.deletionDate;
  this._originalMailList = data.originalMailList;
  this._mails = data.mails;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MailListDeletions.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    deletionDate: this._deletionDate, 
    originalMailList: this._originalMailList, 
    mails: this._mails
  };
};

/**
 * Sets the id of this MailListDeletions.
 * @param {string} id The id of this MailListDeletions.
 */
tutao.entity.tutanota.MailListDeletions.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this MailListDeletions.
 * @return {string} The id of this MailListDeletions.
 */
tutao.entity.tutanota.MailListDeletions.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the deletionDate of this MailListDeletions.
 * @param {Date} deletionDate The deletionDate of this MailListDeletions.
 */
tutao.entity.tutanota.MailListDeletions.prototype.setDeletionDate = function(deletionDate) {
  this._deletionDate = String(deletionDate.getTime());
  return this;
};

/**
 * Provides the deletionDate of this MailListDeletions.
 * @return {Date} The deletionDate of this MailListDeletions.
 */
tutao.entity.tutanota.MailListDeletions.prototype.getDeletionDate = function() {
  if (isNaN(this._deletionDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._deletionDate);
  }
  return new Date(Number(this._deletionDate));
};

/**
 * Sets the originalMailList of this MailListDeletions.
 * @param {string} originalMailList The originalMailList of this MailListDeletions.
 */
tutao.entity.tutanota.MailListDeletions.prototype.setOriginalMailList = function(originalMailList) {
  this._originalMailList = originalMailList;
  return this;
};

/**
 * Provides the originalMailList of this MailListDeletions.
 * @return {string} The originalMailList of this MailListDeletions.
 */
tutao.entity.tutanota.MailListDeletions.prototype.getOriginalMailList = function() {
  return this._originalMailList;
};

/**
 * Sets the mails of this MailListDeletions.
 * @param {string} mails The mails of this MailListDeletions.
 */
tutao.entity.tutanota.MailListDeletions.prototype.setMails = function(mails) {
  this._mails = mails;
  return this;
};

/**
 * Provides the mails of this MailListDeletions.
 * @return {string} The mails of this MailListDeletions.
 */
tutao.entity.tutanota.MailListDeletions.prototype.getMails = function() {
  return this._mails;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MailListDeletions.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
