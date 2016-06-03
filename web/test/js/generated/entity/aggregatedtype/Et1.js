"use strict";

tutao.provide('tutao.entity.aggregatedtype.Et1');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.aggregatedtype.Et1 = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__owner = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._anyAggregated = [];
    this._oneAggregated = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.aggregatedtype.Et1.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.aggregatedtype.Et1.prototype.updateData = function(data) {
  this.__area = data._area;
  this.__format = data._format;
  this.__id = data._id;
  this.__owner = data._owner;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._anyAggregated = [];
  for (var i=0; i < data.anyAggregated.length; i++) {
    this._anyAggregated.push(new tutao.entity.aggregatedtype.At2(this, data.anyAggregated[i]));
  }
  this._oneAggregated = (data.oneAggregated) ? new tutao.entity.aggregatedtype.At2(this, data.oneAggregated) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.aggregatedtype.Et1.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.aggregatedtype.Et1.PATH = '/rest/aggregatedtype/et1';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.aggregatedtype.Et1.ROOT_INSTANCE_ID = 'DmFnZ3JlZ2F0ZWR0eXBlAA8';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.aggregatedtype.Et1.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.aggregatedtype.Et1.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.aggregatedtype.Et1.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _owner: this.__owner, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    anyAggregated: tutao.entity.EntityHelper.aggregatesToJsonData(this._anyAggregated), 
    oneAggregated: tutao.entity.EntityHelper.aggregatesToJsonData(this._oneAggregated)
  };
};

/**
 * The id of the Et1 type.
 */
tutao.entity.aggregatedtype.Et1.prototype.TYPE_ID = 15;

/**
 * The id of the _area attribute.
 */
tutao.entity.aggregatedtype.Et1.prototype._AREA_ATTRIBUTE_ID = 23;

/**
 * The id of the _owner attribute.
 */
tutao.entity.aggregatedtype.Et1.prototype._OWNER_ATTRIBUTE_ID = 22;

/**
 * The id of the _ownerEncSessionKey attribute.
 */
tutao.entity.aggregatedtype.Et1.prototype._OWNERENCSESSIONKEY_ATTRIBUTE_ID = 21;

/**
 * The id of the _ownerGroup attribute.
 */
tutao.entity.aggregatedtype.Et1.prototype._OWNERGROUP_ATTRIBUTE_ID = 20;

/**
 * The id of the anyAggregated attribute.
 */
tutao.entity.aggregatedtype.Et1.prototype.ANYAGGREGATED_ATTRIBUTE_ID = 40;

/**
 * The id of the oneAggregated attribute.
 */
tutao.entity.aggregatedtype.Et1.prototype.ONEAGGREGATED_ATTRIBUTE_ID = 39;

/**
 * Provides the id of this Et1.
 * @return {string} The id of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this Et1.
 * @param {string} area The area of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this Et1.
 * @return {string} The area of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this Et1.
 * @param {string} format The format of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Et1.
 * @return {string} The format of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this Et1.
 * @param {string} owner The owner of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this Et1.
 * @return {string} The owner of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the ownerEncSessionKey of this Et1.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this Et1.
 * @return {string} The ownerEncSessionKey of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this Et1.
 * @param {string} ownerGroup The ownerGroup of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this Et1.
 * @return {string} The ownerGroup of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this Et1.
 * @param {string} permissions The permissions of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Et1.
 * @return {string} The permissions of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Provides the anyAggregated of this Et1.
 * @return {Array.<tutao.entity.aggregatedtype.At2>} The anyAggregated of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.getAnyAggregated = function() {
  return this._anyAggregated;
};

/**
 * Sets the oneAggregated of this Et1.
 * @param {tutao.entity.aggregatedtype.At2} oneAggregated The oneAggregated of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.setOneAggregated = function(oneAggregated) {
  this._oneAggregated = oneAggregated;
  return this;
};

/**
 * Provides the oneAggregated of this Et1.
 * @return {tutao.entity.aggregatedtype.At2} The oneAggregated of this Et1.
 */
tutao.entity.aggregatedtype.Et1.prototype.getOneAggregated = function() {
  return this._oneAggregated;
};

/**
 * Loads a Et1 from the server.
 * @param {string} id The id of the Et1.
 * @return {Promise.<tutao.entity.aggregatedtype.Et1>} Resolves to the Et1 or an exception if the loading failed.
 */
tutao.entity.aggregatedtype.Et1.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.aggregatedtype.Et1, tutao.entity.aggregatedtype.Et1.PATH, id, null, {"v" : "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple Et1s from the server.
 * @param {Array.<string>} ids The ids of the Et1s to load.
 * @return {Promise.<Array.<tutao.entity.aggregatedtype.Et1>>} Resolves to an array of Et1 or rejects with an exception if the loading failed.
 */
tutao.entity.aggregatedtype.Et1.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.aggregatedtype.Et1, tutao.entity.aggregatedtype.Et1.PATH, ids, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Stores this Et1 on the server and updates this instance with _id and _permission values generated on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.aggregatedtype.Et1.prototype.setup = function() {
  var self = this;
  var params = { "v" : "1" };
  return tutao.locator.entityRestClient.postElement(tutao.entity.aggregatedtype.Et1.PATH, this, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = entity.getGeneratedId();
    self.setPermissions(entity.getPermissionListId());
    self._entityHelper.notifyObservers(false);
  })
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.aggregatedtype.Et1.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "1";
  return tutao.locator.entityRestClient.putElement(tutao.entity.aggregatedtype.Et1.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this Et1 on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.aggregatedtype.Et1.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.aggregatedtype.Et1.PATH, this, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this Et1 on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.aggregatedtype.Et1.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.aggregatedtype.Et1.PATH, this.__id, null, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.aggregatedtype.Et1.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.aggregatedtype.Et1.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.aggregatedtype.Et1.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
