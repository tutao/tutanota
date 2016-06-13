"use strict";

tutao.provide('tutao.entity.valueencrypted.EtZeroOrOneValues');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._bool = null;
    this._bool_ = null;
    this._bytes = null;
    this._bytes_ = null;
    this._date = null;
    this._date_ = null;
    this._number = null;
    this._number_ = null;
    this._string = null;
    this._string_ = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.valueencrypted.EtZeroOrOneValues.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._bool = data.bool;
  this._bool_ = null;
  this._bytes = data.bytes;
  this._bytes_ = null;
  this._date = data.date;
  this._date_ = null;
  this._number = data.number;
  this._number_ = null;
  this._string = data.string;
  this._string_ = null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.PATH = '/rest/valueencrypted/etzerooronevalues';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.ROOT_INSTANCE_ID = 'DnZhbHVlZW5jcnlwdGVkAAw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
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
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this EtZeroOrOneValues.
 * @param {string} format The format of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this EtZeroOrOneValues.
 * @return {string} The format of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this EtZeroOrOneValues.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this EtZeroOrOneValues.
 * @return {string} The ownerEncSessionKey of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this EtZeroOrOneValues.
 * @param {string} ownerGroup The ownerGroup of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this EtZeroOrOneValues.
 * @return {string} The ownerGroup of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this EtZeroOrOneValues.
 * @param {string} permissions The permissions of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this EtZeroOrOneValues.
 * @return {string} The permissions of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the bool of this EtZeroOrOneValues.
 * @param {boolean} bool The bool of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.setBool = function(bool) {
  if (bool == null) {
    this._bool = null;
    this._bool_ = null;
  } else {
    var dataToEncrypt = (bool) ? '1' : '0';
    this._bool = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._bool_ = bool;
  }
  return this;
};

/**
 * Provides the bool of this EtZeroOrOneValues.
 * @return {boolean} The bool of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.getBool = function() {
  if (this._bool == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._bool_ != null) {
    return this._bool_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._bool);
    this._bool_ = (value != '0');
    return this._bool_;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return false;
    } else {
      throw e;
    }
  }
};

/**
 * Sets the bytes of this EtZeroOrOneValues.
 * @param {string} bytes The bytes of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.setBytes = function(bytes) {
  if (bytes == null) {
    this._bytes = null;
    this._bytes_ = null;
  } else {
    var dataToEncrypt = bytes;
    this._bytes = tutao.locator.aesCrypter.encryptBytes(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._bytes_ = bytes;
  }
  return this;
};

/**
 * Provides the bytes of this EtZeroOrOneValues.
 * @return {string} The bytes of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.getBytes = function() {
  if (this._bytes == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._bytes_ != null) {
    return this._bytes_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptBytes(this._entityHelper.getSessionKey(), this._bytes);
    this._bytes_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the date of this EtZeroOrOneValues.
 * @param {Date} date The date of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.setDate = function(date) {
  if (date == null) {
    this._date = null;
    this._date_ = null;
  } else {
    var dataToEncrypt = String(date.getTime());
    this._date = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._date_ = date;
  }
  return this;
};

/**
 * Provides the date of this EtZeroOrOneValues.
 * @return {Date} The date of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.getDate = function() {
  if (this._date == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._date_ != null) {
    return this._date_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._date);
    if (isNaN(value)) {
      this.getEntityHelper().invalidateSessionKey();
      return new Date(0);
    }
    this._date_ = new Date(Number(value));
    return this._date_;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return new Date(0);
    } else {
      throw e;
    }
  }
};

/**
 * Sets the number of this EtZeroOrOneValues.
 * @param {string} number The number of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.setNumber = function(number) {
  if (number == null) {
    this._number = null;
    this._number_ = null;
  } else {
    var dataToEncrypt = number;
    this._number = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._number_ = number;
  }
  return this;
};

/**
 * Provides the number of this EtZeroOrOneValues.
 * @return {string} The number of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.getNumber = function() {
  if (this._number == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._number_ != null) {
    return this._number_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._number);
    this._number_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "0";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the string of this EtZeroOrOneValues.
 * @param {string} string The string of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.setString = function(string) {
  if (string == null) {
    this._string = null;
    this._string_ = null;
  } else {
    var dataToEncrypt = string;
    this._string = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._string_ = string;
  }
  return this;
};

/**
 * Provides the string of this EtZeroOrOneValues.
 * @return {string} The string of this EtZeroOrOneValues.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.getString = function() {
  if (this._string == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._string_ != null) {
    return this._string_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._string);
    this._string_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Loads a EtZeroOrOneValues from the server.
 * @param {string} id The id of the EtZeroOrOneValues.
 * @return {Promise.<tutao.entity.valueencrypted.EtZeroOrOneValues>} Resolves to the EtZeroOrOneValues or an exception if the loading failed.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.valueencrypted.EtZeroOrOneValues, tutao.entity.valueencrypted.EtZeroOrOneValues.PATH, id, null, {"v" : "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple EtZeroOrOneValuess from the server.
 * @param {Array.<string>} ids The ids of the EtZeroOrOneValuess to load.
 * @return {Promise.<Array.<tutao.entity.valueencrypted.EtZeroOrOneValues>>} Resolves to an array of EtZeroOrOneValues or rejects with an exception if the loading failed.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.valueencrypted.EtZeroOrOneValues, tutao.entity.valueencrypted.EtZeroOrOneValues.PATH, ids, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Stores this EtZeroOrOneValues on the server and updates this instance with _id and _permission values generated on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.setup = function() {
  var self = this;
  var params = { "v" : "1" };
  return tutao.locator.entityRestClient.postElement(tutao.entity.valueencrypted.EtZeroOrOneValues.PATH, this, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = entity.getGeneratedId();
    self.setPermissions(entity.getPermissionListId());
    self._entityHelper.notifyObservers(false);
  })
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "1";
  return tutao.locator.entityRestClient.putElement(tutao.entity.valueencrypted.EtZeroOrOneValues.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this EtZeroOrOneValues on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.valueencrypted.EtZeroOrOneValues.PATH, this, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this EtZeroOrOneValues on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.valueencrypted.EtZeroOrOneValues.PATH, this.__id, null, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.valueencrypted.EtZeroOrOneValues.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
