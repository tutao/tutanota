"use strict";

tutao.provide('tutao.entity.sys.CustomerProperties');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerProperties = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._externalUserWelcomeMessage = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CustomerProperties.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerProperties.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._externalUserWelcomeMessage = data.externalUserWelcomeMessage;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CustomerProperties.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.CustomerProperties.PATH = '/rest/sys/customerproperties';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.CustomerProperties.ROOT_INSTANCE_ID = 'A3N5cwACkA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.CustomerProperties.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CustomerProperties.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CustomerProperties.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    externalUserWelcomeMessage: this._externalUserWelcomeMessage
  };
};

/**
 * The id of the CustomerProperties type.
 */
tutao.entity.sys.CustomerProperties.prototype.TYPE_ID = 656;

/**
 * The id of the externalUserWelcomeMessage attribute.
 */
tutao.entity.sys.CustomerProperties.prototype.EXTERNALUSERWELCOMEMESSAGE_ATTRIBUTE_ID = 661;

/**
 * Provides the id of this CustomerProperties.
 * @return {string} The id of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this CustomerProperties.
 * @param {string} format The format of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CustomerProperties.
 * @return {string} The format of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this CustomerProperties.
 * @param {string} permissions The permissions of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this CustomerProperties.
 * @return {string} The permissions of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the externalUserWelcomeMessage of this CustomerProperties.
 * @param {string} externalUserWelcomeMessage The externalUserWelcomeMessage of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.setExternalUserWelcomeMessage = function(externalUserWelcomeMessage) {
  this._externalUserWelcomeMessage = externalUserWelcomeMessage;
  return this;
};

/**
 * Provides the externalUserWelcomeMessage of this CustomerProperties.
 * @return {string} The externalUserWelcomeMessage of this CustomerProperties.
 */
tutao.entity.sys.CustomerProperties.prototype.getExternalUserWelcomeMessage = function() {
  return this._externalUserWelcomeMessage;
};

/**
 * Loads a CustomerProperties from the server.
 * @param {string} id The id of the CustomerProperties.
 * @return {Promise.<tutao.entity.sys.CustomerProperties>} Resolves to the CustomerProperties or an exception if the loading failed.
 */
tutao.entity.sys.CustomerProperties.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.CustomerProperties, tutao.entity.sys.CustomerProperties.PATH, id, null, {"v" : 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple CustomerPropertiess from the server.
 * @param {Array.<string>} ids The ids of the CustomerPropertiess to load.
 * @return {Promise.<Array.<tutao.entity.sys.CustomerProperties>>} Resolves to an array of CustomerProperties or rejects with an exception if the loading failed.
 */
tutao.entity.sys.CustomerProperties.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.CustomerProperties, tutao.entity.sys.CustomerProperties.PATH, ids, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this CustomerProperties on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.CustomerProperties.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.CustomerProperties.PATH, this, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.CustomerProperties.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.CustomerProperties.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
