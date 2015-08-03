"use strict";

tutao.provide('tutao.entity.sys.ExternalUserReference');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ExternalUserReference = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._user = null;
    this._userGroup = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.ExternalUserReference.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.ExternalUserReference.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._user = data.user;
  this._userGroup = data.userGroup;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.ExternalUserReference.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.ExternalUserReference.PATH = '/rest/sys/externaluserreference';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.ExternalUserReference.ROOT_INSTANCE_ID = 'A3N5cwBn';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.ExternalUserReference.GENERATED_ID = false;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.ExternalUserReference.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.ExternalUserReference.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    user: this._user, 
    userGroup: this._userGroup
  };
};

/**
 * The id of the ExternalUserReference type.
 */
tutao.entity.sys.ExternalUserReference.prototype.TYPE_ID = 103;

/**
 * The id of the user attribute.
 */
tutao.entity.sys.ExternalUserReference.prototype.USER_ATTRIBUTE_ID = 108;

/**
 * The id of the userGroup attribute.
 */
tutao.entity.sys.ExternalUserReference.prototype.USERGROUP_ATTRIBUTE_ID = 109;

/**
 * Sets the custom id of this ExternalUserReference.
 * @param {Array.<string>} id The custom id of this ExternalUserReference.
 */
tutao.entity.sys.ExternalUserReference.prototype.setId = function(id) {
  this.__id = id;
};

/**
 * Provides the id of this ExternalUserReference.
 * @return {Array.<string>} The id of this ExternalUserReference.
 */
tutao.entity.sys.ExternalUserReference.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this ExternalUserReference.
 * @param {string} format The format of this ExternalUserReference.
 */
tutao.entity.sys.ExternalUserReference.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ExternalUserReference.
 * @return {string} The format of this ExternalUserReference.
 */
tutao.entity.sys.ExternalUserReference.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this ExternalUserReference.
 * @param {string} permissions The permissions of this ExternalUserReference.
 */
tutao.entity.sys.ExternalUserReference.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this ExternalUserReference.
 * @return {string} The permissions of this ExternalUserReference.
 */
tutao.entity.sys.ExternalUserReference.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the user of this ExternalUserReference.
 * @param {string} user The user of this ExternalUserReference.
 */
tutao.entity.sys.ExternalUserReference.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this ExternalUserReference.
 * @return {string} The user of this ExternalUserReference.
 */
tutao.entity.sys.ExternalUserReference.prototype.getUser = function() {
  return this._user;
};

/**
 * Loads the user of this ExternalUserReference.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded user of this ExternalUserReference or an exception if the loading failed.
 */
tutao.entity.sys.ExternalUserReference.prototype.loadUser = function() {
  return tutao.entity.sys.User.load(this._user);
};

/**
 * Sets the userGroup of this ExternalUserReference.
 * @param {string} userGroup The userGroup of this ExternalUserReference.
 */
tutao.entity.sys.ExternalUserReference.prototype.setUserGroup = function(userGroup) {
  this._userGroup = userGroup;
  return this;
};

/**
 * Provides the userGroup of this ExternalUserReference.
 * @return {string} The userGroup of this ExternalUserReference.
 */
tutao.entity.sys.ExternalUserReference.prototype.getUserGroup = function() {
  return this._userGroup;
};

/**
 * Loads the userGroup of this ExternalUserReference.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded userGroup of this ExternalUserReference or an exception if the loading failed.
 */
tutao.entity.sys.ExternalUserReference.prototype.loadUserGroup = function() {
  return tutao.entity.sys.Group.load(this._userGroup);
};

/**
 * Loads a ExternalUserReference from the server.
 * @param {Array.<string>} id The id of the ExternalUserReference.
 * @return {Promise.<tutao.entity.sys.ExternalUserReference>} Resolves to the ExternalUserReference or an exception if the loading failed.
 */
tutao.entity.sys.ExternalUserReference.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.ExternalUserReference, tutao.entity.sys.ExternalUserReference.PATH, id[1], id[0], {"v" : 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple ExternalUserReferences from the server.
 * @param {Array.<Array.<string>>} ids The ids of the ExternalUserReferences to load.
 * @return {Promise.<Array.<tutao.entity.sys.ExternalUserReference>>} Resolves to an array of ExternalUserReference or rejects with an exception if the loading failed.
 */
tutao.entity.sys.ExternalUserReference.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.ExternalUserReference, tutao.entity.sys.ExternalUserReference.PATH, ids, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.ExternalUserReference.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 9;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.ExternalUserReference.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of ExternalUserReferences loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.ExternalUserReference>>} Resolves to an array of ExternalUserReference or rejects with an exception if the loading failed.
 */
tutao.entity.sys.ExternalUserReference.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.ExternalUserReference, tutao.entity.sys.ExternalUserReference.PATH, listId, start, count, reverse, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.ExternalUserReference.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.ExternalUserReference.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.ExternalUserReference.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
