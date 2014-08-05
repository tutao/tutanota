"use strict";

goog.provide('tutao.entity.monitor.CounterSnapshotSeries');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.monitor.CounterSnapshotSeries = function(data) {
  if (data) {
    this.__format = data._format;
    this.__id = data._id;
    this.__permissions = data._permissions;
    this._snapshots = data.snapshots;
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._snapshots = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.monitor.CounterSnapshotSeries.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.monitor.CounterSnapshotSeries.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.monitor.CounterSnapshotSeries.PATH = '/rest/monitor/countersnapshotseries';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.monitor.CounterSnapshotSeries.ROOT_INSTANCE_ID = 'B21vbml0b3IABg';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.monitor.CounterSnapshotSeries.GENERATED_ID = false;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    snapshots: this._snapshots
  };
};

/**
 * The id of the CounterSnapshotSeries type.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.TYPE_ID = 6;

/**
 * The id of the snapshots attribute.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.SNAPSHOTS_ATTRIBUTE_ID = 11;

/**
 * Sets the custom id of this CounterSnapshotSeries.
 * @param {string} id The custom id of this CounterSnapshotSeries.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.setId = function(id) {
  this.__id = [null, id];
};

/**
 * Provides the id of this CounterSnapshotSeries.
 * @return {string} The id of this CounterSnapshotSeries.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this CounterSnapshotSeries.
 * @param {string} format The format of this CounterSnapshotSeries.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CounterSnapshotSeries.
 * @return {string} The format of this CounterSnapshotSeries.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this CounterSnapshotSeries.
 * @param {string} permissions The permissions of this CounterSnapshotSeries.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this CounterSnapshotSeries.
 * @return {string} The permissions of this CounterSnapshotSeries.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the snapshots of this CounterSnapshotSeries.
 * @param {string} snapshots The snapshots of this CounterSnapshotSeries.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.setSnapshots = function(snapshots) {
  this._snapshots = snapshots;
  return this;
};

/**
 * Provides the snapshots of this CounterSnapshotSeries.
 * @return {string} The snapshots of this CounterSnapshotSeries.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.getSnapshots = function() {
  return this._snapshots;
};

/**
 * Loads a CounterSnapshotSeries from the server.
 * @param {string} id The id of the CounterSnapshotSeries.
 * @return {Promise.<tutao.entity.monitor.CounterSnapshotSeries>} Resolves to the CounterSnapshotSeries or an exception if the loading failed.
 */
tutao.entity.monitor.CounterSnapshotSeries.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.monitor.CounterSnapshotSeries, tutao.entity.monitor.CounterSnapshotSeries.PATH, id, null, {"v" : 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple CounterSnapshotSeriess from the server.
 * @param {Array.<string>} ids The ids of the CounterSnapshotSeriess to load.
 * @return {Promise.<Array.<tutao.entity.monitor.CounterSnapshotSeries>>} Resolves to an array of CounterSnapshotSeries or rejects with an exception if the loading failed.
 */
tutao.entity.monitor.CounterSnapshotSeries.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.monitor.CounterSnapshotSeries, tutao.entity.monitor.CounterSnapshotSeries.PATH, ids, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.monitor.CounterSnapshotSeries.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
