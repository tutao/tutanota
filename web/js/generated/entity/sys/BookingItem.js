"use strict";

tutao.provide('tutao.entity.sys.BookingItem');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BookingItem = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._activation = null;
    this._deactivation = null;
    this._elementId = null;
    this._type = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.BookingItem.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.BookingItem.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._activation = data.activation;
  this._deactivation = data.deactivation;
  this._elementId = data.elementId;
  this._type = data.type;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.BookingItem.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.BookingItem.PATH = '/rest/sys/bookingitem';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.BookingItem.ROOT_INSTANCE_ID = 'A3N5cwACvA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.BookingItem.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.BookingItem.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.BookingItem.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    activation: this._activation, 
    deactivation: this._deactivation, 
    elementId: this._elementId, 
    type: this._type
  };
};

/**
 * The id of the BookingItem type.
 */
tutao.entity.sys.BookingItem.prototype.TYPE_ID = 700;

/**
 * The id of the activation attribute.
 */
tutao.entity.sys.BookingItem.prototype.ACTIVATION_ATTRIBUTE_ID = 706;

/**
 * The id of the deactivation attribute.
 */
tutao.entity.sys.BookingItem.prototype.DEACTIVATION_ATTRIBUTE_ID = 707;

/**
 * The id of the elementId attribute.
 */
tutao.entity.sys.BookingItem.prototype.ELEMENTID_ATTRIBUTE_ID = 708;

/**
 * The id of the type attribute.
 */
tutao.entity.sys.BookingItem.prototype.TYPE_ATTRIBUTE_ID = 705;

/**
 * Provides the id of this BookingItem.
 * @return {Array.<string>} The id of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this BookingItem.
 * @param {string} format The format of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this BookingItem.
 * @return {string} The format of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this BookingItem.
 * @param {string} permissions The permissions of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this BookingItem.
 * @return {string} The permissions of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the activation of this BookingItem.
 * @param {Date} activation The activation of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setActivation = function(activation) {
  this._activation = String(activation.getTime());
  return this;
};

/**
 * Provides the activation of this BookingItem.
 * @return {Date} The activation of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getActivation = function() {
  if (isNaN(this._activation)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._activation);
  }
  return new Date(Number(this._activation));
};

/**
 * Sets the deactivation of this BookingItem.
 * @param {Date} deactivation The deactivation of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setDeactivation = function(deactivation) {
  if (deactivation == null) {
    this._deactivation = null;
  } else {
    this._deactivation = String(deactivation.getTime());
  }
  return this;
};

/**
 * Provides the deactivation of this BookingItem.
 * @return {Date} The deactivation of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getDeactivation = function() {
  if (this._deactivation == null) {
    return null;
  }
  if (isNaN(this._deactivation)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._deactivation);
  }
  return new Date(Number(this._deactivation));
};

/**
 * Sets the elementId of this BookingItem.
 * @param {string} elementId The elementId of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setElementId = function(elementId) {
  this._elementId = elementId;
  return this;
};

/**
 * Provides the elementId of this BookingItem.
 * @return {string} The elementId of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getElementId = function() {
  return this._elementId;
};

/**
 * Sets the type of this BookingItem.
 * @param {string} type The type of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this BookingItem.
 * @return {string} The type of this BookingItem.
 */
tutao.entity.sys.BookingItem.prototype.getType = function() {
  return this._type;
};

/**
 * Loads a BookingItem from the server.
 * @param {Array.<string>} id The id of the BookingItem.
 * @return {Promise.<tutao.entity.sys.BookingItem>} Resolves to the BookingItem or an exception if the loading failed.
 */
tutao.entity.sys.BookingItem.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.BookingItem, tutao.entity.sys.BookingItem.PATH, id[1], id[0], {"v" : 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple BookingItems from the server.
 * @param {Array.<Array.<string>>} ids The ids of the BookingItems to load.
 * @return {Promise.<Array.<tutao.entity.sys.BookingItem>>} Resolves to an array of BookingItem or rejects with an exception if the loading failed.
 */
tutao.entity.sys.BookingItem.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.BookingItem, tutao.entity.sys.BookingItem.PATH, ids, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.BookingItem.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 9;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.BookingItem.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of BookingItems loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.BookingItem>>} Resolves to an array of BookingItem or rejects with an exception if the loading failed.
 */
tutao.entity.sys.BookingItem.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.BookingItem, tutao.entity.sys.BookingItem.PATH, listId, start, count, reverse, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.BookingItem.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.BookingItem.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
