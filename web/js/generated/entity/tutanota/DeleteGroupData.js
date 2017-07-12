"use strict";

tutao.provide('tutao.entity.tutanota.DeleteGroupData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DeleteGroupData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._restore = null;
    this._group = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.DeleteGroupData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DeleteGroupData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._restore = data.restore;
  this._group = data.group;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.DeleteGroupData.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.DeleteGroupData.PATH = '/rest/tutanota/mailgroupservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.DeleteGroupData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DeleteGroupData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    restore: this._restore, 
    group: this._group
  };
};

/**
 * Sets the format of this DeleteGroupData.
 * @param {string} format The format of this DeleteGroupData.
 */
tutao.entity.tutanota.DeleteGroupData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DeleteGroupData.
 * @return {string} The format of this DeleteGroupData.
 */
tutao.entity.tutanota.DeleteGroupData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the restore of this DeleteGroupData.
 * @param {boolean} restore The restore of this DeleteGroupData.
 */
tutao.entity.tutanota.DeleteGroupData.prototype.setRestore = function(restore) {
  this._restore = restore ? '1' : '0';
  return this;
};

/**
 * Provides the restore of this DeleteGroupData.
 * @return {boolean} The restore of this DeleteGroupData.
 */
tutao.entity.tutanota.DeleteGroupData.prototype.getRestore = function() {
  return this._restore != '0';
};

/**
 * Sets the group of this DeleteGroupData.
 * @param {string} group The group of this DeleteGroupData.
 */
tutao.entity.tutanota.DeleteGroupData.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this DeleteGroupData.
 * @return {string} The group of this DeleteGroupData.
 */
tutao.entity.tutanota.DeleteGroupData.prototype.getGroup = function() {
  return this._group;
};

/**
 * Loads the group of this DeleteGroupData.
 * @return {Promise.<tutao.entity.tutanota.Group>} Resolves to the loaded group of this DeleteGroupData or an exception if the loading failed.
 */
tutao.entity.tutanota.DeleteGroupData.prototype.loadGroup = function() {
  return tutao.entity.tutanota.Group.load(this._group);
};

/**
 * Invokes DELETE on a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.DeleteGroupData>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.DeleteGroupData.prototype.erase = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "20";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.deleteService(tutao.entity.tutanota.DeleteGroupData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.DeleteGroupData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
