"use strict";

tutao.provide('tutao.entity.tutanota.DataBlock');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DataBlock = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._blockData = null;
    this._size = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.DataBlock.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DataBlock.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._blockData = data.blockData;
  this._size = data.size;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DataBlock.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    blockData: this._blockData, 
    size: this._size
  };
};

/**
 * The id of the DataBlock type.
 */
tutao.entity.tutanota.DataBlock.prototype.TYPE_ID = 0;

/**
 * The id of the blockData attribute.
 */
tutao.entity.tutanota.DataBlock.prototype.BLOCKDATA_ATTRIBUTE_ID = 3;

/**
 * The id of the size attribute.
 */
tutao.entity.tutanota.DataBlock.prototype.SIZE_ATTRIBUTE_ID = 2;

/**
 * Sets the id of this DataBlock.
 * @param {string} id The id of this DataBlock.
 */
tutao.entity.tutanota.DataBlock.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this DataBlock.
 * @return {string} The id of this DataBlock.
 */
tutao.entity.tutanota.DataBlock.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the blockData of this DataBlock.
 * @param {string} blockData The blockData of this DataBlock.
 */
tutao.entity.tutanota.DataBlock.prototype.setBlockData = function(blockData) {
  this._blockData = blockData;
  return this;
};

/**
 * Provides the blockData of this DataBlock.
 * @return {string} The blockData of this DataBlock.
 */
tutao.entity.tutanota.DataBlock.prototype.getBlockData = function() {
  return this._blockData;
};

/**
 * Sets the size of this DataBlock.
 * @param {string} size The size of this DataBlock.
 */
tutao.entity.tutanota.DataBlock.prototype.setSize = function(size) {
  this._size = size;
  return this;
};

/**
 * Provides the size of this DataBlock.
 * @return {string} The size of this DataBlock.
 */
tutao.entity.tutanota.DataBlock.prototype.getSize = function() {
  return this._size;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.DataBlock.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
