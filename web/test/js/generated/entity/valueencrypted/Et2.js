"use strict";

tutao.provide('tutao.entity.valueencrypted.Et2');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueencrypted.Et2 = function(data) {
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
    this._aggregationAny = [];
    this._aggregationOne = null;
    this._list = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.valueencrypted.Et2.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueencrypted.Et2.prototype.updateData = function(data) {
  this.__area = data._area;
  this.__format = data._format;
  this.__id = data._id;
  this.__owner = data._owner;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._aggregationAny = [];
  for (var i=0; i < data.aggregationAny.length; i++) {
    this._aggregationAny.push(new tutao.entity.valueencrypted.Aggregated(this, data.aggregationAny[i]));
  }
  this._aggregationOne = (data.aggregationOne) ? new tutao.entity.valueencrypted.Aggregated(this, data.aggregationOne) : null;
  this._list = data.list;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.valueencrypted.Et2.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.valueencrypted.Et2.PATH = '/rest/valueencrypted/et2';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.valueencrypted.Et2.ROOT_INSTANCE_ID = 'DnZhbHVlZW5jcnlwdGVkADE';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.valueencrypted.Et2.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.valueencrypted.Et2.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.valueencrypted.Et2.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _owner: this.__owner, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    aggregationAny: tutao.entity.EntityHelper.aggregatesToJsonData(this._aggregationAny), 
    aggregationOne: tutao.entity.EntityHelper.aggregatesToJsonData(this._aggregationOne), 
    list: this._list
  };
};

/**
 * The id of the Et2 type.
 */
tutao.entity.valueencrypted.Et2.prototype.TYPE_ID = 49;

/**
 * The id of the _area attribute.
 */
tutao.entity.valueencrypted.Et2.prototype._AREA_ATTRIBUTE_ID = 57;

/**
 * The id of the _owner attribute.
 */
tutao.entity.valueencrypted.Et2.prototype._OWNER_ATTRIBUTE_ID = 56;

/**
 * The id of the _ownerEncSessionKey attribute.
 */
tutao.entity.valueencrypted.Et2.prototype._OWNERENCSESSIONKEY_ATTRIBUTE_ID = 55;

/**
 * The id of the _ownerGroup attribute.
 */
tutao.entity.valueencrypted.Et2.prototype._OWNERGROUP_ATTRIBUTE_ID = 54;

/**
 * The id of the aggregationAny attribute.
 */
tutao.entity.valueencrypted.Et2.prototype.AGGREGATIONANY_ATTRIBUTE_ID = 60;

/**
 * The id of the aggregationOne attribute.
 */
tutao.entity.valueencrypted.Et2.prototype.AGGREGATIONONE_ATTRIBUTE_ID = 59;

/**
 * The id of the list attribute.
 */
tutao.entity.valueencrypted.Et2.prototype.LIST_ATTRIBUTE_ID = 58;

/**
 * Provides the id of this Et2.
 * @return {string} The id of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this Et2.
 * @param {string} area The area of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this Et2.
 * @return {string} The area of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this Et2.
 * @param {string} format The format of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Et2.
 * @return {string} The format of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this Et2.
 * @param {string} owner The owner of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this Et2.
 * @return {string} The owner of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the ownerEncSessionKey of this Et2.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this Et2.
 * @return {string} The ownerEncSessionKey of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this Et2.
 * @param {string} ownerGroup The ownerGroup of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this Et2.
 * @return {string} The ownerGroup of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this Et2.
 * @param {string} permissions The permissions of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Et2.
 * @return {string} The permissions of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Provides the aggregationAny of this Et2.
 * @return {Array.<tutao.entity.valueencrypted.Aggregated>} The aggregationAny of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.getAggregationAny = function() {
  return this._aggregationAny;
};

/**
 * Sets the aggregationOne of this Et2.
 * @param {tutao.entity.valueencrypted.Aggregated} aggregationOne The aggregationOne of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.setAggregationOne = function(aggregationOne) {
  this._aggregationOne = aggregationOne;
  return this;
};

/**
 * Provides the aggregationOne of this Et2.
 * @return {tutao.entity.valueencrypted.Aggregated} The aggregationOne of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.getAggregationOne = function() {
  return this._aggregationOne;
};

/**
 * Sets the list of this Et2.
 * @param {string} list The list of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.setList = function(list) {
  this._list = list;
  return this;
};

/**
 * Provides the list of this Et2.
 * @return {string} The list of this Et2.
 */
tutao.entity.valueencrypted.Et2.prototype.getList = function() {
  return this._list;
};

/**
 * Loads a Et2 from the server.
 * @param {string} id The id of the Et2.
 * @return {Promise.<tutao.entity.valueencrypted.Et2>} Resolves to the Et2 or an exception if the loading failed.
 */
tutao.entity.valueencrypted.Et2.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.valueencrypted.Et2, tutao.entity.valueencrypted.Et2.PATH, id, null, {"v" : "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple Et2s from the server.
 * @param {Array.<string>} ids The ids of the Et2s to load.
 * @return {Promise.<Array.<tutao.entity.valueencrypted.Et2>>} Resolves to an array of Et2 or rejects with an exception if the loading failed.
 */
tutao.entity.valueencrypted.Et2.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.valueencrypted.Et2, tutao.entity.valueencrypted.Et2.PATH, ids, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Stores this Et2 on the server and updates this instance with _id and _permission values generated on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.valueencrypted.Et2.prototype.setup = function() {
  var self = this;
  var params = { "v" : "1" };
  return tutao.locator.entityRestClient.postElement(tutao.entity.valueencrypted.Et2.PATH, this, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = entity.getGeneratedId();
    self.setPermissions(entity.getPermissionListId());
    self._entityHelper.notifyObservers(false);
  })
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.valueencrypted.Et2.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "1";
  return tutao.locator.entityRestClient.putElement(tutao.entity.valueencrypted.Et2.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this Et2 on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.valueencrypted.Et2.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.valueencrypted.Et2.PATH, this, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this Et2 on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.valueencrypted.Et2.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.valueencrypted.Et2.PATH, this.__id, null, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.valueencrypted.Et2.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.valueencrypted.Et2.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.valueencrypted.Et2.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
