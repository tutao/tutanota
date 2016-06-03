"use strict";

tutao.provide('tutao.entity.sys.PushIdentifier');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PushIdentifier = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__owner = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._identifier = null;
    this._language = null;
    this._pushServiceType = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PushIdentifier.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PushIdentifier.prototype.updateData = function(data) {
  this.__area = data._area;
  this.__format = data._format;
  this.__id = data._id;
  this.__owner = data._owner;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._identifier = data.identifier;
  this._language = data.language;
  this._pushServiceType = data.pushServiceType;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PushIdentifier.MODEL_VERSION = '17';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.PushIdentifier.PATH = '/rest/sys/pushidentifier';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.PushIdentifier.ROOT_INSTANCE_ID = 'A3N5cwACcQ';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.PushIdentifier.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PushIdentifier.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PushIdentifier.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _owner: this.__owner, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    identifier: this._identifier, 
    language: this._language, 
    pushServiceType: this._pushServiceType
  };
};

/**
 * The id of the PushIdentifier type.
 */
tutao.entity.sys.PushIdentifier.prototype.TYPE_ID = 625;

/**
 * The id of the _area attribute.
 */
tutao.entity.sys.PushIdentifier.prototype._AREA_ATTRIBUTE_ID = 631;

/**
 * The id of the _owner attribute.
 */
tutao.entity.sys.PushIdentifier.prototype._OWNER_ATTRIBUTE_ID = 630;

/**
 * The id of the _ownerGroup attribute.
 */
tutao.entity.sys.PushIdentifier.prototype._OWNERGROUP_ATTRIBUTE_ID = 1028;

/**
 * The id of the identifier attribute.
 */
tutao.entity.sys.PushIdentifier.prototype.IDENTIFIER_ATTRIBUTE_ID = 633;

/**
 * The id of the language attribute.
 */
tutao.entity.sys.PushIdentifier.prototype.LANGUAGE_ATTRIBUTE_ID = 634;

/**
 * The id of the pushServiceType attribute.
 */
tutao.entity.sys.PushIdentifier.prototype.PUSHSERVICETYPE_ATTRIBUTE_ID = 632;

/**
 * Provides the id of this PushIdentifier.
 * @return {Array.<string>} The id of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this PushIdentifier.
 * @param {string} area The area of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this PushIdentifier.
 * @return {string} The area of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this PushIdentifier.
 * @param {string} format The format of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PushIdentifier.
 * @return {string} The format of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this PushIdentifier.
 * @param {string} owner The owner of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this PushIdentifier.
 * @return {string} The owner of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the ownerGroup of this PushIdentifier.
 * @param {string} ownerGroup The ownerGroup of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this PushIdentifier.
 * @return {string} The ownerGroup of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this PushIdentifier.
 * @param {string} permissions The permissions of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this PushIdentifier.
 * @return {string} The permissions of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the identifier of this PushIdentifier.
 * @param {string} identifier The identifier of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.setIdentifier = function(identifier) {
  this._identifier = identifier;
  return this;
};

/**
 * Provides the identifier of this PushIdentifier.
 * @return {string} The identifier of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.getIdentifier = function() {
  return this._identifier;
};

/**
 * Sets the language of this PushIdentifier.
 * @param {string} language The language of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.setLanguage = function(language) {
  this._language = language;
  return this;
};

/**
 * Provides the language of this PushIdentifier.
 * @return {string} The language of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.getLanguage = function() {
  return this._language;
};

/**
 * Sets the pushServiceType of this PushIdentifier.
 * @param {string} pushServiceType The pushServiceType of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.setPushServiceType = function(pushServiceType) {
  this._pushServiceType = pushServiceType;
  return this;
};

/**
 * Provides the pushServiceType of this PushIdentifier.
 * @return {string} The pushServiceType of this PushIdentifier.
 */
tutao.entity.sys.PushIdentifier.prototype.getPushServiceType = function() {
  return this._pushServiceType;
};

/**
 * Loads a PushIdentifier from the server.
 * @param {Array.<string>} id The id of the PushIdentifier.
 * @return {Promise.<tutao.entity.sys.PushIdentifier>} Resolves to the PushIdentifier or an exception if the loading failed.
 */
tutao.entity.sys.PushIdentifier.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.PushIdentifier, tutao.entity.sys.PushIdentifier.PATH, id[1], id[0], {"v" : "17"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple PushIdentifiers from the server.
 * @param {Array.<Array.<string>>} ids The ids of the PushIdentifiers to load.
 * @return {Promise.<Array.<tutao.entity.sys.PushIdentifier>>} Resolves to an array of PushIdentifier or rejects with an exception if the loading failed.
 */
tutao.entity.sys.PushIdentifier.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.PushIdentifier, tutao.entity.sys.PushIdentifier.PATH, ids, {"v": "17"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Stores PushIdentifier on the server and updates this instance with _id and _permission values generated on the server.
 * @param {string} listId The list id of the PushIdentifier.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.sys.PushIdentifier.prototype.setup = function(listId) {
  var self = this;
  self._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postElement(tutao.entity.sys.PushIdentifier.PATH, self, listId, {"v": "17"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = [listId, entity.getGeneratedId()];
    self.setPermissions(entity.getPermissionListId());
  });
};

/**
 * Updates this PushIdentifier on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.PushIdentifier.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.PushIdentifier.PATH, this, {"v": "17"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this PushIdentifier on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.sys.PushIdentifier.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.sys.PushIdentifier.PATH, this.__id[1], this.__id[0], {"v": "17"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Creates a new PushIdentifier list on the server.
 * @param {string} ownerGroupId The group for which the list shall be created.
 * @return {Promise.<string>} Resolves to the id of the new tutao.entity.sys.PushIdentifier list or rejects with an exception if the createList failed.
 */
tutao.entity.sys.PushIdentifier.createList = function(ownerGroupId) {
  var params = tutao.entity.EntityHelper.createPostListPermissionMap(ownerGroupId);
  params["v"] = "17";
  return tutao.locator.entityRestClient.postList(tutao.entity.sys.PushIdentifier.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(returnEntity) {
    return returnEntity.getGeneratedId();
  });
};

/**
 * Provides a  list of PushIdentifiers loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.PushIdentifier>>} Resolves to an array of PushIdentifier or rejects with an exception if the loading failed.
 */
tutao.entity.sys.PushIdentifier.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.PushIdentifier, tutao.entity.sys.PushIdentifier.PATH, listId, start, count, reverse, {"v": "17"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.PushIdentifier.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.PushIdentifier.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PushIdentifier.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
