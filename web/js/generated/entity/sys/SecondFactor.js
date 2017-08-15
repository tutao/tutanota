"use strict";

tutao.provide('tutao.entity.sys.SecondFactor');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactor = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._name = null;
    this._type = null;
    this._u2f = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.SecondFactor.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.SecondFactor.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._name = data.name;
  this._type = data.type;
  this._u2f = (data.u2f) ? new tutao.entity.sys.U2fRegisteredDevice(this, data.u2f) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.SecondFactor.MODEL_VERSION = '23';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.SecondFactor.PATH = '/rest/sys/secondfactor';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.SecondFactor.ROOT_INSTANCE_ID = 'A3N5cwAEkA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.SecondFactor.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.SecondFactor.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.SecondFactor.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    name: this._name, 
    type: this._type, 
    u2f: tutao.entity.EntityHelper.aggregatesToJsonData(this._u2f)
  };
};

/**
 * Provides the id of this SecondFactor.
 * @return {Array.<string>} The id of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this SecondFactor.
 * @param {string} format The format of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SecondFactor.
 * @return {string} The format of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this SecondFactor.
 * @param {string} ownerGroup The ownerGroup of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this SecondFactor.
 * @return {string} The ownerGroup of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this SecondFactor.
 * @param {string} permissions The permissions of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this SecondFactor.
 * @return {string} The permissions of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the name of this SecondFactor.
 * @param {string} name The name of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.setName = function(name) {
  this._name = name;
  return this;
};

/**
 * Provides the name of this SecondFactor.
 * @return {string} The name of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.getName = function() {
  return this._name;
};

/**
 * Sets the type of this SecondFactor.
 * @param {string} type The type of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this SecondFactor.
 * @return {string} The type of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.getType = function() {
  return this._type;
};

/**
 * Sets the u2f of this SecondFactor.
 * @param {tutao.entity.sys.U2fRegisteredDevice} u2f The u2f of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.setU2f = function(u2f) {
  this._u2f = u2f;
  return this;
};

/**
 * Provides the u2f of this SecondFactor.
 * @return {tutao.entity.sys.U2fRegisteredDevice} The u2f of this SecondFactor.
 */
tutao.entity.sys.SecondFactor.prototype.getU2f = function() {
  return this._u2f;
};

/**
 * Loads a SecondFactor from the server.
 * @param {Array.<string>} id The id of the SecondFactor.
 * @return {Promise.<tutao.entity.sys.SecondFactor>} Resolves to the SecondFactor or an exception if the loading failed.
 */
tutao.entity.sys.SecondFactor.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.SecondFactor, tutao.entity.sys.SecondFactor.PATH, id[1], id[0], {"v" : "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple SecondFactors from the server.
 * @param {Array.<Array.<string>>} ids The ids of the SecondFactors to load.
 * @return {Promise.<Array.<tutao.entity.sys.SecondFactor>>} Resolves to an array of SecondFactor or rejects with an exception if the loading failed.
 */
tutao.entity.sys.SecondFactor.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.SecondFactor, tutao.entity.sys.SecondFactor.PATH, ids, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Stores SecondFactor on the server and updates this instance with _id and _permission values generated on the server.
 * @param {string} listId The list id of the SecondFactor.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.sys.SecondFactor.prototype.setup = function(listId) {
  var self = this;
  self._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postElement(tutao.entity.sys.SecondFactor.PATH, self, listId, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = [listId, entity.getGeneratedId()];
    self.setPermissions(entity.getPermissionListId());
  });
};

/**
 * Updates this SecondFactor on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.SecondFactor.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.SecondFactor.PATH, this, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Creates a new SecondFactor list on the server.
 * @param {string} ownerGroupId The group for which the list shall be created.
 * @return {Promise.<string>} Resolves to the id of the new tutao.entity.sys.SecondFactor list or rejects with an exception if the createList failed.
 */
tutao.entity.sys.SecondFactor.createList = function(ownerGroupId) {
  var params = tutao.entity.EntityHelper.createPostListPermissionMap(ownerGroupId);
  params["v"] = "23";
  return tutao.locator.entityRestClient.postList(tutao.entity.sys.SecondFactor.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(returnEntity) {
    return returnEntity.getGeneratedId();
  });
};

/**
 * Provides a  list of SecondFactors loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.SecondFactor>>} Resolves to an array of SecondFactor or rejects with an exception if the loading failed.
 */
tutao.entity.sys.SecondFactor.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.SecondFactor, tutao.entity.sys.SecondFactor.PATH, listId, start, count, reverse, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.SecondFactor.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.SecondFactor.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.SecondFactor.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
