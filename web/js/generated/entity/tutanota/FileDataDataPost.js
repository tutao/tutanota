"use strict";

tutao.provide('tutao.entity.tutanota.FileDataDataPost');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FileDataDataPost = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._group = null;
    this._size = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.FileDataDataPost.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.updateData = function(data) {
  this.__format = data._format;
  this._group = data.group;
  this._size = data.size;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.FileDataDataPost.MODEL_VERSION = '8';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.FileDataDataPost.PATH = '/rest/tutanota/filedataservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.FileDataDataPost.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    group: this._group, 
    size: this._size
  };
};

/**
 * The id of the FileDataDataPost type.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.TYPE_ID = 335;

/**
 * The id of the group attribute.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.GROUP_ATTRIBUTE_ID = 337;

/**
 * The id of the size attribute.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.SIZE_ATTRIBUTE_ID = 338;

/**
 * Sets the format of this FileDataDataPost.
 * @param {string} format The format of this FileDataDataPost.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this FileDataDataPost.
 * @return {string} The format of this FileDataDataPost.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the group of this FileDataDataPost.
 * @param {string} group The group of this FileDataDataPost.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this FileDataDataPost.
 * @return {string} The group of this FileDataDataPost.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.getGroup = function() {
  return this._group;
};

/**
 * Sets the size of this FileDataDataPost.
 * @param {string} size The size of this FileDataDataPost.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.setSize = function(size) {
  this._size = size;
  return this;
};

/**
 * Provides the size of this FileDataDataPost.
 * @return {string} The size of this FileDataDataPost.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.getSize = function() {
  return this._size;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.FileDataReturnPost=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.FileDataDataPost.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 8;
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.FileDataDataPost.PATH, this, parameters, headers, tutao.entity.tutanota.FileDataReturnPost);
};
