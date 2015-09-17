"use strict";

tutao.provide('tutao.entity.sys.Bucket');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Bucket = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._bucketPermissions = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.Bucket.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Bucket.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._bucketPermissions = data.bucketPermissions;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Bucket.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    bucketPermissions: this._bucketPermissions
  };
};

/**
 * The id of the Bucket type.
 */
tutao.entity.sys.Bucket.prototype.TYPE_ID = 129;

/**
 * The id of the bucketPermissions attribute.
 */
tutao.entity.sys.Bucket.prototype.BUCKETPERMISSIONS_ATTRIBUTE_ID = 131;

/**
 * Sets the id of this Bucket.
 * @param {string} id The id of this Bucket.
 */
tutao.entity.sys.Bucket.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this Bucket.
 * @return {string} The id of this Bucket.
 */
tutao.entity.sys.Bucket.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the bucketPermissions of this Bucket.
 * @param {string} bucketPermissions The bucketPermissions of this Bucket.
 */
tutao.entity.sys.Bucket.prototype.setBucketPermissions = function(bucketPermissions) {
  this._bucketPermissions = bucketPermissions;
  return this;
};

/**
 * Provides the bucketPermissions of this Bucket.
 * @return {string} The bucketPermissions of this Bucket.
 */
tutao.entity.sys.Bucket.prototype.getBucketPermissions = function() {
  return this._bucketPermissions;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.Bucket.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
