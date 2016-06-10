"use strict";

tutao.provide('tutao.entity.tutanota.DraftAttachment');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftAttachment = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._ownerEncFileSessionKey = null;
    this._existingFile = null;
    this._newFile = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.DraftAttachment.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftAttachment.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._ownerEncFileSessionKey = data.ownerEncFileSessionKey;
  this._existingFile = data.existingFile;
  this._newFile = (data.newFile) ? new tutao.entity.tutanota.NewDraftAttachment(parent, data.newFile) : null;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DraftAttachment.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    ownerEncFileSessionKey: this._ownerEncFileSessionKey, 
    existingFile: this._existingFile, 
    newFile: tutao.entity.EntityHelper.aggregatesToJsonData(this._newFile)
  };
};

/**
 * Sets the id of this DraftAttachment.
 * @param {string} id The id of this DraftAttachment.
 */
tutao.entity.tutanota.DraftAttachment.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this DraftAttachment.
 * @return {string} The id of this DraftAttachment.
 */
tutao.entity.tutanota.DraftAttachment.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the ownerEncFileSessionKey of this DraftAttachment.
 * @param {string} ownerEncFileSessionKey The ownerEncFileSessionKey of this DraftAttachment.
 */
tutao.entity.tutanota.DraftAttachment.prototype.setOwnerEncFileSessionKey = function(ownerEncFileSessionKey) {
  this._ownerEncFileSessionKey = ownerEncFileSessionKey;
  return this;
};

/**
 * Provides the ownerEncFileSessionKey of this DraftAttachment.
 * @return {string} The ownerEncFileSessionKey of this DraftAttachment.
 */
tutao.entity.tutanota.DraftAttachment.prototype.getOwnerEncFileSessionKey = function() {
  return this._ownerEncFileSessionKey;
};

/**
 * Sets the existingFile of this DraftAttachment.
 * @param {Array.<string>} existingFile The existingFile of this DraftAttachment.
 */
tutao.entity.tutanota.DraftAttachment.prototype.setExistingFile = function(existingFile) {
  this._existingFile = existingFile;
  return this;
};

/**
 * Provides the existingFile of this DraftAttachment.
 * @return {Array.<string>} The existingFile of this DraftAttachment.
 */
tutao.entity.tutanota.DraftAttachment.prototype.getExistingFile = function() {
  return this._existingFile;
};

/**
 * Loads the existingFile of this DraftAttachment.
 * @return {Promise.<tutao.entity.tutanota.File>} Resolves to the loaded existingFile of this DraftAttachment or an exception if the loading failed.
 */
tutao.entity.tutanota.DraftAttachment.prototype.loadExistingFile = function() {
  return tutao.entity.tutanota.File.load(this._existingFile);
};

/**
 * Sets the newFile of this DraftAttachment.
 * @param {tutao.entity.tutanota.NewDraftAttachment} newFile The newFile of this DraftAttachment.
 */
tutao.entity.tutanota.DraftAttachment.prototype.setNewFile = function(newFile) {
  this._newFile = newFile;
  return this;
};

/**
 * Provides the newFile of this DraftAttachment.
 * @return {tutao.entity.tutanota.NewDraftAttachment} The newFile of this DraftAttachment.
 */
tutao.entity.tutanota.DraftAttachment.prototype.getNewFile = function() {
  return this._newFile;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.DraftAttachment.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
