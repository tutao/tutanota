"use strict";

tutao.provide('tutao.entity.valueunencrypted.Et');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueunencrypted.Et = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__owner = null;
    this.__permissions = null;
    this._bool = null;
    this._bytes = null;
    this._date = null;
    this._number = null;
    this._string = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.valueunencrypted.Et.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueunencrypted.Et.prototype.updateData = function(data) {
  this.__area = data._area;
  this.__format = data._format;
  this.__id = data._id;
  this.__owner = data._owner;
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
tutao.entity.valueunencrypted.Et.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.valueunencrypted.Et.PATH = '/rest/valueunencrypted/et';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.valueunencrypted.Et.ROOT_INSTANCE_ID = 'EHZhbHVldW5lbmNyeXB0ZWQAAA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.valueunencrypted.Et.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.valueunencrypted.Et.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.valueunencrypted.Et.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _owner: this.__owner, 
    _permissions: this.__permissions, 
    bool: this._bool, 
    bytes: this._bytes, 
    date: this._date, 
    number: this._number, 
    string: this._string
  };
};

/**
 * The id of the Et type.
 */
tutao.entity.valueunencrypted.Et.prototype.TYPE_ID = 0;

/**
 * The id of the _area attribute.
 */
tutao.entity.valueunencrypted.Et.prototype._AREA_ATTRIBUTE_ID = 6;

/**
 * The id of the _owner attribute.
 */
tutao.entity.valueunencrypted.Et.prototype._OWNER_ATTRIBUTE_ID = 5;

/**
 * The id of the bool attribute.
 */
tutao.entity.valueunencrypted.Et.prototype.BOOL_ATTRIBUTE_ID = 11;

/**
 * The id of the bytes attribute.
 */
tutao.entity.valueunencrypted.Et.prototype.BYTES_ATTRIBUTE_ID = 7;

/**
 * The id of the date attribute.
 */
tutao.entity.valueunencrypted.Et.prototype.DATE_ATTRIBUTE_ID = 10;

/**
 * The id of the number attribute.
 */
tutao.entity.valueunencrypted.Et.prototype.NUMBER_ATTRIBUTE_ID = 9;

/**
 * The id of the string attribute.
 */
tutao.entity.valueunencrypted.Et.prototype.STRING_ATTRIBUTE_ID = 8;

/**
 * Provides the id of this Et.
 * @return {string} The id of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this Et.
 * @param {string} area The area of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this Et.
 * @return {string} The area of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this Et.
 * @param {string} format The format of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Et.
 * @return {string} The format of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this Et.
 * @param {string} owner The owner of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this Et.
 * @return {string} The owner of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the permissions of this Et.
 * @param {string} permissions The permissions of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Et.
 * @return {string} The permissions of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the bool of this Et.
 * @param {boolean} bool The bool of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.setBool = function(bool) {
  this._bool = bool ? '1' : '0';
  return this;
};

/**
 * Provides the bool of this Et.
 * @return {boolean} The bool of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.getBool = function() {
  return this._bool == '1';
};

/**
 * Sets the bytes of this Et.
 * @param {string} bytes The bytes of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.setBytes = function(bytes) {
  this._bytes = bytes;
  return this;
};

/**
 * Provides the bytes of this Et.
 * @return {string} The bytes of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.getBytes = function() {
  return this._bytes;
};

/**
 * Sets the date of this Et.
 * @param {Date} date The date of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.setDate = function(date) {
  this._date = String(date.getTime());
  return this;
};

/**
 * Provides the date of this Et.
 * @return {Date} The date of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.getDate = function() {
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the number of this Et.
 * @param {string} number The number of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.setNumber = function(number) {
  this._number = number;
  return this;
};

/**
 * Provides the number of this Et.
 * @return {string} The number of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.getNumber = function() {
  return this._number;
};

/**
 * Sets the string of this Et.
 * @param {string} string The string of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.setString = function(string) {
  this._string = string;
  return this;
};

/**
 * Provides the string of this Et.
 * @return {string} The string of this Et.
 */
tutao.entity.valueunencrypted.Et.prototype.getString = function() {
  return this._string;
};

/**
 * Loads a Et from the server.
 * @param {string} id The id of the Et.
 * @return {Promise.<tutao.entity.valueunencrypted.Et>} Resolves to the Et or an exception if the loading failed.
 */
tutao.entity.valueunencrypted.Et.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.valueunencrypted.Et, tutao.entity.valueunencrypted.Et.PATH, id, null, {"v" : 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple Ets from the server.
 * @param {Array.<string>} ids The ids of the Ets to load.
 * @return {Promise.<Array.<tutao.entity.valueunencrypted.Et>>} Resolves to an array of Et or rejects with an exception if the loading failed.
 */
tutao.entity.valueunencrypted.Et.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.valueunencrypted.Et, tutao.entity.valueunencrypted.Et.PATH, ids, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Stores this Et on the server and updates this instance with _id and _permission values generated on the server.
 * @param {tutao.entity.BucketData} bucketData The bucket data for which the share permission on instance shall be created.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.valueunencrypted.Et.prototype.setup = function(bucketData) {
  var self = this;
  var params = this._entityHelper.createPostPermissionMap(bucketData)
  params["v"] = 1
  return tutao.locator.entityRestClient.postElement(tutao.entity.valueunencrypted.Et.PATH, this, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = entity.getGeneratedId();
    self.setPermissions(entity.getPermissionListId());
    self._entityHelper.notifyObservers(false);
  })
};

/**
 * Updates this Et on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.valueunencrypted.Et.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.valueunencrypted.Et.PATH, this, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this Et on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.valueunencrypted.Et.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.valueunencrypted.Et.PATH, this.__id, null, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.valueunencrypted.Et.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.valueunencrypted.Et.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
