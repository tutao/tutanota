"use strict";

tutao.provide('tutao.entity.tutanota.MailFolderRef');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailFolderRef = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._folders = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.MailFolderRef.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailFolderRef.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._folders = data.folders;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MailFolderRef.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    folders: this._folders
  };
};

/**
 * Sets the id of this MailFolderRef.
 * @param {string} id The id of this MailFolderRef.
 */
tutao.entity.tutanota.MailFolderRef.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this MailFolderRef.
 * @return {string} The id of this MailFolderRef.
 */
tutao.entity.tutanota.MailFolderRef.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the folders of this MailFolderRef.
 * @param {string} folders The folders of this MailFolderRef.
 */
tutao.entity.tutanota.MailFolderRef.prototype.setFolders = function(folders) {
  this._folders = folders;
  return this;
};

/**
 * Provides the folders of this MailFolderRef.
 * @return {string} The folders of this MailFolderRef.
 */
tutao.entity.tutanota.MailFolderRef.prototype.getFolders = function() {
  return this._folders;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MailFolderRef.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
