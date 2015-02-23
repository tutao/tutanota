"use strict";

tutao.provide('tutao.entity.valueunencrypted.Let');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueunencrypted.Let = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__listEncSessionKey = null;
    this.__owner = null;
    this.__permissions = null;
    this._bool = null;
    this._bytes = null;
    this._date = null;
    this._number = null;
    this._string = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.valueunencrypted.Let.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueunencrypted.Let.prototype.updateData = function(data) {
  this.__area = data._area;
  this.__format = data._format;
  this.__id = data._id;
  this.__listEncSessionKey = data._listEncSessionKey;
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
tutao.entity.valueunencrypted.Let.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.valueunencrypted.Let.PATH = '/rest/valueunencrypted/let';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.valueunencrypted.Let.ROOT_INSTANCE_ID = 'EHZhbHVldW5lbmNyeXB0ZWQAGA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.valueunencrypted.Let.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.valueunencrypted.Let.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.valueunencrypted.Let.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _listEncSessionKey: this.__listEncSessionKey, 
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
 * The id of the Let type.
 */
tutao.entity.valueunencrypted.Let.prototype.TYPE_ID = 24;

/**
 * The id of the _area attribute.
 */
tutao.entity.valueunencrypted.Let.prototype._AREA_ATTRIBUTE_ID = 31;

/**
 * The id of the _owner attribute.
 */
tutao.entity.valueunencrypted.Let.prototype._OWNER_ATTRIBUTE_ID = 30;

/**
 * The id of the bool attribute.
 */
tutao.entity.valueunencrypted.Let.prototype.BOOL_ATTRIBUTE_ID = 36;

/**
 * The id of the bytes attribute.
 */
tutao.entity.valueunencrypted.Let.prototype.BYTES_ATTRIBUTE_ID = 32;

/**
 * The id of the date attribute.
 */
tutao.entity.valueunencrypted.Let.prototype.DATE_ATTRIBUTE_ID = 35;

/**
 * The id of the number attribute.
 */
tutao.entity.valueunencrypted.Let.prototype.NUMBER_ATTRIBUTE_ID = 34;

/**
 * The id of the string attribute.
 */
tutao.entity.valueunencrypted.Let.prototype.STRING_ATTRIBUTE_ID = 33;

/**
 * Provides the id of this Let.
 * @return {Array.<string>} The id of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this Let.
 * @param {string} area The area of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this Let.
 * @return {string} The area of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this Let.
 * @param {string} format The format of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Let.
 * @return {string} The format of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the listEncSessionKey of this Let.
 * @param {string} listEncSessionKey The listEncSessionKey of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.setListEncSessionKey = function(listEncSessionKey) {
  this.__listEncSessionKey = listEncSessionKey;
  return this;
};

/**
 * Provides the listEncSessionKey of this Let.
 * @return {string} The listEncSessionKey of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.getListEncSessionKey = function() {
  return this.__listEncSessionKey;
};

/**
 * Sets the owner of this Let.
 * @param {string} owner The owner of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this Let.
 * @return {string} The owner of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the permissions of this Let.
 * @param {string} permissions The permissions of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Let.
 * @return {string} The permissions of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the bool of this Let.
 * @param {boolean} bool The bool of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.setBool = function(bool) {
  this._bool = bool ? '1' : '0';
  return this;
};

/**
 * Provides the bool of this Let.
 * @return {boolean} The bool of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.getBool = function() {
  return this._bool == '1';
};

/**
 * Sets the bytes of this Let.
 * @param {string} bytes The bytes of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.setBytes = function(bytes) {
  this._bytes = bytes;
  return this;
};

/**
 * Provides the bytes of this Let.
 * @return {string} The bytes of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.getBytes = function() {
  return this._bytes;
};

/**
 * Sets the date of this Let.
 * @param {Date} date The date of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.setDate = function(date) {
  this._date = String(date.getTime());
  return this;
};

/**
 * Provides the date of this Let.
 * @return {Date} The date of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.getDate = function() {
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the number of this Let.
 * @param {string} number The number of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.setNumber = function(number) {
  this._number = number;
  return this;
};

/**
 * Provides the number of this Let.
 * @return {string} The number of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.getNumber = function() {
  return this._number;
};

/**
 * Sets the string of this Let.
 * @param {string} string The string of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.setString = function(string) {
  this._string = string;
  return this;
};

/**
 * Provides the string of this Let.
 * @return {string} The string of this Let.
 */
tutao.entity.valueunencrypted.Let.prototype.getString = function() {
  return this._string;
};

/**
 * Loads a Let from the server.
 * @param {Array.<string>} id The id of the Let.
 * @return {Promise.<tutao.entity.valueunencrypted.Let>} Resolves to the Let or an exception if the loading failed.
 */
tutao.entity.valueunencrypted.Let.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.valueunencrypted.Let, tutao.entity.valueunencrypted.Let.PATH, id[1], id[0], {"v" : 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple Lets from the server.
 * @param {Array.<Array.<string>>} ids The ids of the Lets to load.
 * @return {Promise.<Array.<tutao.entity.valueunencrypted.Let>>} Resolves to an array of Let or rejects with an exception if the loading failed.
 */
tutao.entity.valueunencrypted.Let.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.valueunencrypted.Let, tutao.entity.valueunencrypted.Let.PATH, ids, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Stores Let on the server and updates this instance with _id and _permission values generated on the server.
 * @param {string} listId The list id of the Let.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.valueunencrypted.Let.prototype.setup = function(listId) {
  var self = this;
  return this._entityHelper.createListEncSessionKey(listId).then(function(listEncSessionKey) {
    self.setListEncSessionKey(listEncSessionKey);
    self._entityHelper.notifyObservers(false);
    return tutao.locator.entityRestClient.postElement(tutao.entity.valueunencrypted.Let.PATH, self, listId, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
      self.__id = [listId, entity.getGeneratedId()];
      self.setPermissions(entity.getPermissionListId());
    });
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.valueunencrypted.Let.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 1;
  return tutao.locator.entityRestClient.putElement(tutao.entity.valueunencrypted.Let.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this Let on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.valueunencrypted.Let.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.valueunencrypted.Let.PATH, this, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this Let on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.valueunencrypted.Let.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.valueunencrypted.Let.PATH, this.__id[1], this.__id[0], {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Creates a new Let list on the server.
 * @param {tutao.entity.BucketData} bucketData The bucket data for which the share permission on the list shall be created.
 * @return {Promise.<string=>} Resolves to the id of the new tutao.entity.valueunencrypted.Let list or rejects with an exception if the createList failed.
 */
tutao.entity.valueunencrypted.Let.createList = function(bucketData) {
  var params = tutao.entity.EntityHelper.createPostListPermissionMap(bucketData, true);
  params["v"] = 1;
  return tutao.locator.entityRestClient.postList(tutao.entity.valueunencrypted.Let.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(returnEntity) {
    return returnEntity.getGeneratedId();
  });
};

/**
 * Provides a  list of Lets loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.valueunencrypted.Let>>} Resolves to an array of Let or rejects with an exception if the loading failed.
 */
tutao.entity.valueunencrypted.Let.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.valueunencrypted.Let, tutao.entity.valueunencrypted.Let.PATH, listId, start, count, reverse, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.valueunencrypted.Let.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.valueunencrypted.Let.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
