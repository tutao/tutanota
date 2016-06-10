"use strict";

tutao.provide('tutao.entity.valueunencrypted.EtZeroOrOneValues');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._bool = null;
    this._bytes = null;
    this._date = null;
    this._number = null;
    this._string = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._bool = data.bool;
  this._bytes = data.bytes;
  this._date = data.date;
  this._number = data.number;
  this._string = data.string;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.PATH = '/rest/valueunencrypted/etzerooronevalues';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.ROOT_INSTANCE_ID = 'EHZhbHVldW5lbmNyeXB0ZWQACw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    bool: this._bool, 
    bytes: this._bytes, 
    date: this._date, 
    number: this._number, 
    string: this._string
  };
};

/**
 * Provides the id of this EtZeroOrOneValues.
 * @return {string} The id of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this EtZeroOrOneValues.
 * @param {string} format The format of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this EtZeroOrOneValues.
 * @return {string} The format of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this EtZeroOrOneValues.
 * @param {string} ownerGroup The ownerGroup of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this EtZeroOrOneValues.
 * @return {string} The ownerGroup of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this EtZeroOrOneValues.
 * @param {string} permissions The permissions of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this EtZeroOrOneValues.
 * @return {string} The permissions of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the bool of this EtZeroOrOneValues.
 * @param {boolean} bool The bool of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.setBool = function(bool) {
  if (bool == null) {
    this._bool = null;
  } else {
    this._bool = bool ? '1' : '0';
  }
  return this;
};

/**
 * Provides the bool of this EtZeroOrOneValues.
 * @return {boolean} The bool of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.getBool = function() {
  if (this._bool == null) {
    return null;
  }
  return this._bool != '0';
};

/**
 * Sets the bytes of this EtZeroOrOneValues.
 * @param {string} bytes The bytes of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.setBytes = function(bytes) {
  this._bytes = bytes;
  return this;
};

/**
 * Provides the bytes of this EtZeroOrOneValues.
 * @return {string} The bytes of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.getBytes = function() {
  return this._bytes;
};

/**
 * Sets the date of this EtZeroOrOneValues.
 * @param {Date} date The date of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.setDate = function(date) {
  if (date == null) {
    this._date = null;
  } else {
    this._date = String(date.getTime());
  }
  return this;
};

/**
 * Provides the date of this EtZeroOrOneValues.
 * @return {Date} The date of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.getDate = function() {
  if (this._date == null) {
    return null;
  }
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the number of this EtZeroOrOneValues.
 * @param {string} number The number of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.setNumber = function(number) {
  this._number = number;
  return this;
};

/**
 * Provides the number of this EtZeroOrOneValues.
 * @return {string} The number of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.getNumber = function() {
  return this._number;
};

/**
 * Sets the string of this EtZeroOrOneValues.
 * @param {string} string The string of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.setString = function(string) {
  this._string = string;
  return this;
};

/**
 * Provides the string of this EtZeroOrOneValues.
 * @return {string} The string of this EtZeroOrOneValues.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.getString = function() {
  return this._string;
};

/**
 * Loads a EtZeroOrOneValues from the server.
 * @param {string} id The id of the EtZeroOrOneValues.
 * @return {Promise.<tutao.entity.valueunencrypted.EtZeroOrOneValues>} Resolves to the EtZeroOrOneValues or an exception if the loading failed.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.valueunencrypted.EtZeroOrOneValues, tutao.entity.valueunencrypted.EtZeroOrOneValues.PATH, id, null, {"v" : "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple EtZeroOrOneValuess from the server.
 * @param {Array.<string>} ids The ids of the EtZeroOrOneValuess to load.
 * @return {Promise.<Array.<tutao.entity.valueunencrypted.EtZeroOrOneValues>>} Resolves to an array of EtZeroOrOneValues or rejects with an exception if the loading failed.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.valueunencrypted.EtZeroOrOneValues, tutao.entity.valueunencrypted.EtZeroOrOneValues.PATH, ids, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Stores this EtZeroOrOneValues on the server and updates this instance with _id and _permission values generated on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.setup = function() {
  var self = this;
  var params = { "v" : "1" };
  return tutao.locator.entityRestClient.postElement(tutao.entity.valueunencrypted.EtZeroOrOneValues.PATH, this, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = entity.getGeneratedId();
    self.setPermissions(entity.getPermissionListId());
    self._entityHelper.notifyObservers(false);
  })
};

/**
 * Updates this EtZeroOrOneValues on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.valueunencrypted.EtZeroOrOneValues.PATH, this, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this EtZeroOrOneValues on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.valueunencrypted.EtZeroOrOneValues.PATH, this.__id, null, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.valueunencrypted.EtZeroOrOneValues.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
