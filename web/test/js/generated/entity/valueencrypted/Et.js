"use strict";

tutao.provide('tutao.entity.valueencrypted.Et');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueencrypted.Et = function(data) {
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
  this.prototype = tutao.entity.valueencrypted.Et.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueencrypted.Et.prototype.updateData = function(data) {
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
tutao.entity.valueencrypted.Et.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.valueencrypted.Et.PATH = '/rest/valueencrypted/et';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.valueencrypted.Et.ROOT_INSTANCE_ID = 'DnZhbHVlZW5jcnlwdGVkAAA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.valueencrypted.Et.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.valueencrypted.Et.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.valueencrypted.Et.prototype.toJsonData = function() {
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
tutao.entity.valueencrypted.Et.prototype.TYPE_ID = 0;

/**
 * The id of the _area attribute.
 */
tutao.entity.valueencrypted.Et.prototype._AREA_ATTRIBUTE_ID = 6;

/**
 * The id of the _owner attribute.
 */
tutao.entity.valueencrypted.Et.prototype._OWNER_ATTRIBUTE_ID = 5;

/**
 * The id of the bool attribute.
 */
tutao.entity.valueencrypted.Et.prototype.BOOL_ATTRIBUTE_ID = 11;

/**
 * The id of the bytes attribute.
 */
tutao.entity.valueencrypted.Et.prototype.BYTES_ATTRIBUTE_ID = 7;

/**
 * The id of the date attribute.
 */
tutao.entity.valueencrypted.Et.prototype.DATE_ATTRIBUTE_ID = 10;

/**
 * The id of the number attribute.
 */
tutao.entity.valueencrypted.Et.prototype.NUMBER_ATTRIBUTE_ID = 9;

/**
 * The id of the string attribute.
 */
tutao.entity.valueencrypted.Et.prototype.STRING_ATTRIBUTE_ID = 8;

/**
 * Provides the id of this Et.
 * @return {string} The id of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this Et.
 * @param {string} area The area of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this Et.
 * @return {string} The area of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this Et.
 * @param {string} format The format of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Et.
 * @return {string} The format of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this Et.
 * @param {string} owner The owner of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this Et.
 * @return {string} The owner of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the permissions of this Et.
 * @param {string} permissions The permissions of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Et.
 * @return {string} The permissions of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the bool of this Et.
 * @param {boolean} bool The bool of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.setBool = function(bool) {
  var dataToEncrypt = (bool) ? '1' : '0';
  this._bool = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the bool of this Et.
 * @return {boolean} The bool of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.getBool = function() {
  if (this._bool == "" || !this._entityHelper.getSessionKey()) {
    return false;
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._bool);
  if (value != '0' && value != '1') {
    throw new tutao.InvalidDataError('invalid boolean data: ' + value);
  }
  return value == '1';
};

/**
 * Sets the bytes of this Et.
 * @param {string} bytes The bytes of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.setBytes = function(bytes) {
  var dataToEncrypt = bytes;
  this._bytes = tutao.locator.aesCrypter.encryptBytes(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the bytes of this Et.
 * @return {string} The bytes of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.getBytes = function() {
  if (this._bytes == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptBytes(this._entityHelper.getSessionKey(), this._bytes);
  return value;
};

/**
 * Sets the date of this Et.
 * @param {Date} date The date of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.setDate = function(date) {
  var dataToEncrypt = String(date.getTime());
  this._date = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the date of this Et.
 * @return {Date} The date of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.getDate = function() {
  if (this._date == "" || !this._entityHelper.getSessionKey()) {
    return new Date(0);
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._date);
  if (isNaN(value)) {
    throw new tutao.InvalidDataError('invalid time data: ' + value);
  }
  return new Date(Number(value));
};

/**
 * Sets the number of this Et.
 * @param {string} number The number of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.setNumber = function(number) {
  var dataToEncrypt = number;
  this._number = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the number of this Et.
 * @return {string} The number of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.getNumber = function() {
  if (this._number == "" || !this._entityHelper.getSessionKey()) {
    return "0";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._number);
  return value;
};

/**
 * Sets the string of this Et.
 * @param {string} string The string of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.setString = function(string) {
  var dataToEncrypt = string;
  this._string = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the string of this Et.
 * @return {string} The string of this Et.
 */
tutao.entity.valueencrypted.Et.prototype.getString = function() {
  if (this._string == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._string);
  return value;
};

/**
 * Loads a Et from the server.
 * @param {string} id The id of the Et.
 * @return {Promise.<tutao.entity.valueencrypted.Et>} Resolves to the Et or an exception if the loading failed.
 */
tutao.entity.valueencrypted.Et.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.valueencrypted.Et, tutao.entity.valueencrypted.Et.PATH, id, null, {"v" : 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple Ets from the server.
 * @param {Array.<string>} ids The ids of the Ets to load.
 * @return {Promise.<Array.<tutao.entity.valueencrypted.Et>>} Resolves to an array of Et or rejects with an exception if the loading failed.
 */
tutao.entity.valueencrypted.Et.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.valueencrypted.Et, tutao.entity.valueencrypted.Et.PATH, ids, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Stores this Et on the server and updates this instance with _id and _permission values generated on the server.
 * @param {tutao.entity.BucketData} bucketData The bucket data for which the share permission on instance shall be created.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.valueencrypted.Et.prototype.setup = function(bucketData) {
  var self = this;
  var params = this._entityHelper.createPostPermissionMap(bucketData)
  params["v"] = 1
  return tutao.locator.entityRestClient.postElement(tutao.entity.valueencrypted.Et.PATH, this, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = entity.getGeneratedId();
    self.setPermissions(entity.getPermissionListId());
    self._entityHelper.notifyObservers(false);
  })
};

/**
 * Updates this Et on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.valueencrypted.Et.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.valueencrypted.Et.PATH, this, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this Et on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.valueencrypted.Et.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.valueencrypted.Et.PATH, this.__id, null, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.valueencrypted.Et.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.valueencrypted.Et.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.valueencrypted.Et.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
