"use strict";

tutao.provide('tutao.entity.sys.InvoiceHistory');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceHistory = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._changes = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.InvoiceHistory.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.InvoiceHistory.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._changes = data.changes;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.InvoiceHistory.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    changes: this._changes
  };
};

/**
 * The id of the InvoiceHistory type.
 */
tutao.entity.sys.InvoiceHistory.prototype.TYPE_ID = 907;

/**
 * The id of the changes attribute.
 */
tutao.entity.sys.InvoiceHistory.prototype.CHANGES_ATTRIBUTE_ID = 909;

/**
 * Sets the id of this InvoiceHistory.
 * @param {string} id The id of this InvoiceHistory.
 */
tutao.entity.sys.InvoiceHistory.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this InvoiceHistory.
 * @return {string} The id of this InvoiceHistory.
 */
tutao.entity.sys.InvoiceHistory.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the changes of this InvoiceHistory.
 * @param {string} changes The changes of this InvoiceHistory.
 */
tutao.entity.sys.InvoiceHistory.prototype.setChanges = function(changes) {
  this._changes = changes;
  return this;
};

/**
 * Provides the changes of this InvoiceHistory.
 * @return {string} The changes of this InvoiceHistory.
 */
tutao.entity.sys.InvoiceHistory.prototype.getChanges = function() {
  return this._changes;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.InvoiceHistory.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
