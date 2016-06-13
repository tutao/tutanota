"use strict";

tutao.provide('tutao.entity.sys.VersionData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.VersionData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._application = null;
    this._id = null;
    this._listId = null;
    this._typeId = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.VersionData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.VersionData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._application = data.application;
  this._id = data.id;
  this._listId = data.listId;
  this._typeId = data.typeId;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.VersionData.MODEL_VERSION = '17';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.VersionData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.VersionData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    application: this._application, 
    id: this._id, 
    listId: this._listId, 
    typeId: this._typeId
  };
};

/**
 * Sets the format of this VersionData.
 * @param {string} format The format of this VersionData.
 */
tutao.entity.sys.VersionData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this VersionData.
 * @return {string} The format of this VersionData.
 */
tutao.entity.sys.VersionData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the application of this VersionData.
 * @param {string} application The application of this VersionData.
 */
tutao.entity.sys.VersionData.prototype.setApplication = function(application) {
  this._application = application;
  return this;
};

/**
 * Provides the application of this VersionData.
 * @return {string} The application of this VersionData.
 */
tutao.entity.sys.VersionData.prototype.getApplication = function() {
  return this._application;
};

/**
 * Sets the id of this VersionData.
 * @param {string} id The id of this VersionData.
 */
tutao.entity.sys.VersionData.prototype.setId = function(id) {
  this._id = id;
  return this;
};

/**
 * Provides the id of this VersionData.
 * @return {string} The id of this VersionData.
 */
tutao.entity.sys.VersionData.prototype.getId = function() {
  return this._id;
};

/**
 * Sets the listId of this VersionData.
 * @param {string} listId The listId of this VersionData.
 */
tutao.entity.sys.VersionData.prototype.setListId = function(listId) {
  this._listId = listId;
  return this;
};

/**
 * Provides the listId of this VersionData.
 * @return {string} The listId of this VersionData.
 */
tutao.entity.sys.VersionData.prototype.getListId = function() {
  return this._listId;
};

/**
 * Sets the typeId of this VersionData.
 * @param {string} typeId The typeId of this VersionData.
 */
tutao.entity.sys.VersionData.prototype.setTypeId = function(typeId) {
  this._typeId = typeId;
  return this;
};

/**
 * Provides the typeId of this VersionData.
 * @return {string} The typeId of this VersionData.
 */
tutao.entity.sys.VersionData.prototype.getTypeId = function() {
  return this._typeId;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.VersionData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
