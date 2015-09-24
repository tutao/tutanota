"use strict";

tutao.provide('tutao.entity.sys.EntityUpdate');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.EntityUpdate = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._application = null;
    this._instanceId = null;
    this._instanceListId = null;
    this._operation = null;
    this._type = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.EntityUpdate.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.EntityUpdate.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._application = data.application;
  this._instanceId = data.instanceId;
  this._instanceListId = data.instanceListId;
  this._operation = data.operation;
  this._type = data.type;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.EntityUpdate.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    application: this._application, 
    instanceId: this._instanceId, 
    instanceListId: this._instanceListId, 
    operation: this._operation, 
    type: this._type
  };
};

/**
 * The id of the EntityUpdate type.
 */
tutao.entity.sys.EntityUpdate.prototype.TYPE_ID = 462;

/**
 * The id of the application attribute.
 */
tutao.entity.sys.EntityUpdate.prototype.APPLICATION_ATTRIBUTE_ID = 464;

/**
 * The id of the instanceId attribute.
 */
tutao.entity.sys.EntityUpdate.prototype.INSTANCEID_ATTRIBUTE_ID = 467;

/**
 * The id of the instanceListId attribute.
 */
tutao.entity.sys.EntityUpdate.prototype.INSTANCELISTID_ATTRIBUTE_ID = 466;

/**
 * The id of the operation attribute.
 */
tutao.entity.sys.EntityUpdate.prototype.OPERATION_ATTRIBUTE_ID = 624;

/**
 * The id of the type attribute.
 */
tutao.entity.sys.EntityUpdate.prototype.TYPE_ATTRIBUTE_ID = 465;

/**
 * Sets the id of this EntityUpdate.
 * @param {string} id The id of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this EntityUpdate.
 * @return {string} The id of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the application of this EntityUpdate.
 * @param {string} application The application of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.setApplication = function(application) {
  this._application = application;
  return this;
};

/**
 * Provides the application of this EntityUpdate.
 * @return {string} The application of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.getApplication = function() {
  return this._application;
};

/**
 * Sets the instanceId of this EntityUpdate.
 * @param {string} instanceId The instanceId of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.setInstanceId = function(instanceId) {
  this._instanceId = instanceId;
  return this;
};

/**
 * Provides the instanceId of this EntityUpdate.
 * @return {string} The instanceId of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.getInstanceId = function() {
  return this._instanceId;
};

/**
 * Sets the instanceListId of this EntityUpdate.
 * @param {string} instanceListId The instanceListId of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.setInstanceListId = function(instanceListId) {
  this._instanceListId = instanceListId;
  return this;
};

/**
 * Provides the instanceListId of this EntityUpdate.
 * @return {string} The instanceListId of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.getInstanceListId = function() {
  return this._instanceListId;
};

/**
 * Sets the operation of this EntityUpdate.
 * @param {string} operation The operation of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.setOperation = function(operation) {
  this._operation = operation;
  return this;
};

/**
 * Provides the operation of this EntityUpdate.
 * @return {string} The operation of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.getOperation = function() {
  return this._operation;
};

/**
 * Sets the type of this EntityUpdate.
 * @param {string} type The type of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this EntityUpdate.
 * @return {string} The type of this EntityUpdate.
 */
tutao.entity.sys.EntityUpdate.prototype.getType = function() {
  return this._type;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.EntityUpdate.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
