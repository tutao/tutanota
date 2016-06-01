"use strict";

tutao.provide('tutao.entity.sys.GroupRoot');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.GroupRoot = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._externalGroupInfos = null;
    this._externalUserAreaGroupInfos = null;
    this._externalUserReferences = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.GroupRoot.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.GroupRoot.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._externalGroupInfos = data.externalGroupInfos;
  this._externalUserAreaGroupInfos = (data.externalUserAreaGroupInfos) ? new tutao.entity.sys.UserAreaGroups(this, data.externalUserAreaGroupInfos) : null;
  this._externalUserReferences = data.externalUserReferences;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.GroupRoot.MODEL_VERSION = '17';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.GroupRoot.PATH = '/rest/sys/grouproot';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.GroupRoot.ROOT_INSTANCE_ID = 'A3N5cwBu';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.GroupRoot.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.GroupRoot.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.GroupRoot.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    externalGroupInfos: this._externalGroupInfos, 
    externalUserAreaGroupInfos: tutao.entity.EntityHelper.aggregatesToJsonData(this._externalUserAreaGroupInfos), 
    externalUserReferences: this._externalUserReferences
  };
};

/**
 * The id of the GroupRoot type.
 */
tutao.entity.sys.GroupRoot.prototype.TYPE_ID = 110;

/**
 * The id of the _ownerGroup attribute.
 */
tutao.entity.sys.GroupRoot.prototype._OWNERGROUP_ATTRIBUTE_ID = 997;

/**
 * The id of the externalGroupInfos attribute.
 */
tutao.entity.sys.GroupRoot.prototype.EXTERNALGROUPINFOS_ATTRIBUTE_ID = 116;

/**
 * The id of the externalUserAreaGroupInfos attribute.
 */
tutao.entity.sys.GroupRoot.prototype.EXTERNALUSERAREAGROUPINFOS_ATTRIBUTE_ID = 998;

/**
 * The id of the externalUserReferences attribute.
 */
tutao.entity.sys.GroupRoot.prototype.EXTERNALUSERREFERENCES_ATTRIBUTE_ID = 117;

/**
 * Provides the id of this GroupRoot.
 * @return {string} The id of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this GroupRoot.
 * @param {string} format The format of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this GroupRoot.
 * @return {string} The format of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this GroupRoot.
 * @param {string} ownerGroup The ownerGroup of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this GroupRoot.
 * @return {string} The ownerGroup of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this GroupRoot.
 * @param {string} permissions The permissions of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this GroupRoot.
 * @return {string} The permissions of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the externalGroupInfos of this GroupRoot.
 * @param {string} externalGroupInfos The externalGroupInfos of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.setExternalGroupInfos = function(externalGroupInfos) {
  this._externalGroupInfos = externalGroupInfos;
  return this;
};

/**
 * Provides the externalGroupInfos of this GroupRoot.
 * @return {string} The externalGroupInfos of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.getExternalGroupInfos = function() {
  return this._externalGroupInfos;
};

/**
 * Sets the externalUserAreaGroupInfos of this GroupRoot.
 * @param {tutao.entity.sys.UserAreaGroups} externalUserAreaGroupInfos The externalUserAreaGroupInfos of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.setExternalUserAreaGroupInfos = function(externalUserAreaGroupInfos) {
  this._externalUserAreaGroupInfos = externalUserAreaGroupInfos;
  return this;
};

/**
 * Provides the externalUserAreaGroupInfos of this GroupRoot.
 * @return {tutao.entity.sys.UserAreaGroups} The externalUserAreaGroupInfos of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.getExternalUserAreaGroupInfos = function() {
  return this._externalUserAreaGroupInfos;
};

/**
 * Sets the externalUserReferences of this GroupRoot.
 * @param {string} externalUserReferences The externalUserReferences of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.setExternalUserReferences = function(externalUserReferences) {
  this._externalUserReferences = externalUserReferences;
  return this;
};

/**
 * Provides the externalUserReferences of this GroupRoot.
 * @return {string} The externalUserReferences of this GroupRoot.
 */
tutao.entity.sys.GroupRoot.prototype.getExternalUserReferences = function() {
  return this._externalUserReferences;
};

/**
 * Loads a GroupRoot from the server.
 * @param {string} id The id of the GroupRoot.
 * @return {Promise.<tutao.entity.sys.GroupRoot>} Resolves to the GroupRoot or an exception if the loading failed.
 */
tutao.entity.sys.GroupRoot.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.GroupRoot, tutao.entity.sys.GroupRoot.PATH, id, null, {"v" : "17"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple GroupRoots from the server.
 * @param {Array.<string>} ids The ids of the GroupRoots to load.
 * @return {Promise.<Array.<tutao.entity.sys.GroupRoot>>} Resolves to an array of GroupRoot or rejects with an exception if the loading failed.
 */
tutao.entity.sys.GroupRoot.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.GroupRoot, tutao.entity.sys.GroupRoot.PATH, ids, {"v": "17"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this GroupRoot on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.GroupRoot.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.GroupRoot.PATH, this, {"v": "17"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.GroupRoot.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.GroupRoot.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.GroupRoot.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
