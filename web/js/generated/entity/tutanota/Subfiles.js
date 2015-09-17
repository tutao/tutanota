"use strict";

tutao.provide('tutao.entity.tutanota.Subfiles');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Subfiles = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._files = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.Subfiles.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Subfiles.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._files = data.files;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.Subfiles.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    files: this._files
  };
};

/**
 * The id of the Subfiles type.
 */
tutao.entity.tutanota.Subfiles.prototype.TYPE_ID = 11;

/**
 * The id of the files attribute.
 */
tutao.entity.tutanota.Subfiles.prototype.FILES_ATTRIBUTE_ID = 27;

/**
 * Sets the id of this Subfiles.
 * @param {string} id The id of this Subfiles.
 */
tutao.entity.tutanota.Subfiles.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Subfiles.
 * @return {string} The id of this Subfiles.
 */
tutao.entity.tutanota.Subfiles.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the files of this Subfiles.
 * @param {string} files The files of this Subfiles.
 */
tutao.entity.tutanota.Subfiles.prototype.setFiles = function(files) {
  this._files = files;
  return this;
};

/**
 * Provides the files of this Subfiles.
 * @return {string} The files of this Subfiles.
 */
tutao.entity.tutanota.Subfiles.prototype.getFiles = function() {
  return this._files;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.Subfiles.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
