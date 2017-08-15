"use strict";

tutao.provide('tutao.entity.sys.Session');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Session = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._accessKey = null;
    this._clientIdentifier = null;
    this._clientIdentifier_ = null;
    this._lastAccessTime = null;
    this._loginIpAddress = null;
    this._loginIpAddress_ = null;
    this._loginTime = null;
    this._loginTime_ = null;
    this._state = null;
    this._challenges = [];
    this._user = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.Session.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Session.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._accessKey = data.accessKey;
  this._clientIdentifier = data.clientIdentifier;
  this._clientIdentifier_ = null;
  this._lastAccessTime = data.lastAccessTime;
  this._loginIpAddress = data.loginIpAddress;
  this._loginIpAddress_ = null;
  this._loginTime = data.loginTime;
  this._loginTime_ = null;
  this._state = data.state;
  this._challenges = [];
  for (var i=0; i < data.challenges.length; i++) {
    this._challenges.push(new tutao.entity.sys.Challenge(this, data.challenges[i]));
  }
  this._user = data.user;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.Session.MODEL_VERSION = '23';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.Session.PATH = '/rest/sys/session';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.Session.ROOT_INSTANCE_ID = 'A3N5cwAEpQ';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.Session.GENERATED_ID = false;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.Session.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Session.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    accessKey: this._accessKey, 
    clientIdentifier: this._clientIdentifier, 
    lastAccessTime: this._lastAccessTime, 
    loginIpAddress: this._loginIpAddress, 
    loginTime: this._loginTime, 
    state: this._state, 
    challenges: tutao.entity.EntityHelper.aggregatesToJsonData(this._challenges), 
    user: this._user
  };
};

/**
 * Sets the custom id of this Session.
 * @param {Array.<string>} id The custom id of this Session.
 */
tutao.entity.sys.Session.prototype.setId = function(id) {
  this.__id = id;
};

/**
 * Provides the id of this Session.
 * @return {Array.<string>} The id of this Session.
 */
tutao.entity.sys.Session.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this Session.
 * @param {string} format The format of this Session.
 */
tutao.entity.sys.Session.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Session.
 * @return {string} The format of this Session.
 */
tutao.entity.sys.Session.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this Session.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this Session.
 */
tutao.entity.sys.Session.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this Session.
 * @return {string} The ownerEncSessionKey of this Session.
 */
tutao.entity.sys.Session.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this Session.
 * @param {string} ownerGroup The ownerGroup of this Session.
 */
tutao.entity.sys.Session.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this Session.
 * @return {string} The ownerGroup of this Session.
 */
tutao.entity.sys.Session.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this Session.
 * @param {string} permissions The permissions of this Session.
 */
tutao.entity.sys.Session.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Session.
 * @return {string} The permissions of this Session.
 */
tutao.entity.sys.Session.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the accessKey of this Session.
 * @param {string} accessKey The accessKey of this Session.
 */
tutao.entity.sys.Session.prototype.setAccessKey = function(accessKey) {
  this._accessKey = accessKey;
  return this;
};

/**
 * Provides the accessKey of this Session.
 * @return {string} The accessKey of this Session.
 */
tutao.entity.sys.Session.prototype.getAccessKey = function() {
  return this._accessKey;
};

/**
 * Sets the clientIdentifier of this Session.
 * @param {string} clientIdentifier The clientIdentifier of this Session.
 */
tutao.entity.sys.Session.prototype.setClientIdentifier = function(clientIdentifier) {
  var dataToEncrypt = clientIdentifier;
  this._clientIdentifier = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._clientIdentifier_ = clientIdentifier;
  return this;
};

/**
 * Provides the clientIdentifier of this Session.
 * @return {string} The clientIdentifier of this Session.
 */
tutao.entity.sys.Session.prototype.getClientIdentifier = function() {
  if (this._clientIdentifier_ != null) {
    return this._clientIdentifier_;
  }
  if (this._clientIdentifier == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._clientIdentifier);
    this._clientIdentifier_ = value;
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
 * Sets the lastAccessTime of this Session.
 * @param {Date} lastAccessTime The lastAccessTime of this Session.
 */
tutao.entity.sys.Session.prototype.setLastAccessTime = function(lastAccessTime) {
  this._lastAccessTime = String(lastAccessTime.getTime());
  return this;
};

/**
 * Provides the lastAccessTime of this Session.
 * @return {Date} The lastAccessTime of this Session.
 */
tutao.entity.sys.Session.prototype.getLastAccessTime = function() {
  if (isNaN(this._lastAccessTime)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._lastAccessTime);
  }
  return new Date(Number(this._lastAccessTime));
};

/**
 * Sets the loginIpAddress of this Session.
 * @param {string} loginIpAddress The loginIpAddress of this Session.
 */
tutao.entity.sys.Session.prototype.setLoginIpAddress = function(loginIpAddress) {
  var dataToEncrypt = loginIpAddress;
  this._loginIpAddress = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._loginIpAddress_ = loginIpAddress;
  return this;
};

/**
 * Provides the loginIpAddress of this Session.
 * @return {string} The loginIpAddress of this Session.
 */
tutao.entity.sys.Session.prototype.getLoginIpAddress = function() {
  if (this._loginIpAddress_ != null) {
    return this._loginIpAddress_;
  }
  if (this._loginIpAddress == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._loginIpAddress);
    this._loginIpAddress_ = value;
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
 * Sets the loginTime of this Session.
 * @param {Date} loginTime The loginTime of this Session.
 */
tutao.entity.sys.Session.prototype.setLoginTime = function(loginTime) {
  var dataToEncrypt = String(loginTime.getTime());
  this._loginTime = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._loginTime_ = loginTime;
  return this;
};

/**
 * Provides the loginTime of this Session.
 * @return {Date} The loginTime of this Session.
 */
tutao.entity.sys.Session.prototype.getLoginTime = function() {
  if (this._loginTime_ != null) {
    return this._loginTime_;
  }
  if (this._loginTime == "" || !this._entityHelper.getSessionKey()) {
    return new Date(0);
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._loginTime);
    if (isNaN(value)) {
      this.getEntityHelper().invalidateSessionKey();
      return new Date(0);
    }
    this._loginTime_ = new Date(Number(value));
    return this._loginTime_;
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
 * Sets the state of this Session.
 * @param {string} state The state of this Session.
 */
tutao.entity.sys.Session.prototype.setState = function(state) {
  this._state = state;
  return this;
};

/**
 * Provides the state of this Session.
 * @return {string} The state of this Session.
 */
tutao.entity.sys.Session.prototype.getState = function() {
  return this._state;
};

/**
 * Provides the challenges of this Session.
 * @return {Array.<tutao.entity.sys.Challenge>} The challenges of this Session.
 */
tutao.entity.sys.Session.prototype.getChallenges = function() {
  return this._challenges;
};

/**
 * Sets the user of this Session.
 * @param {string} user The user of this Session.
 */
tutao.entity.sys.Session.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this Session.
 * @return {string} The user of this Session.
 */
tutao.entity.sys.Session.prototype.getUser = function() {
  return this._user;
};

/**
 * Loads the user of this Session.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded user of this Session or an exception if the loading failed.
 */
tutao.entity.sys.Session.prototype.loadUser = function() {
  return tutao.entity.sys.User.load(this._user);
};

/**
 * Loads a Session from the server.
 * @param {Array.<string>} id The id of the Session.
 * @return {Promise.<tutao.entity.sys.Session>} Resolves to the Session or an exception if the loading failed.
 */
tutao.entity.sys.Session.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.Session, tutao.entity.sys.Session.PATH, id[1], id[0], {"v" : "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple Sessions from the server.
 * @param {Array.<Array.<string>>} ids The ids of the Sessions to load.
 * @return {Promise.<Array.<tutao.entity.sys.Session>>} Resolves to an array of Session or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Session.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.Session, tutao.entity.sys.Session.PATH, ids, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.Session.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "23";
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.Session.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this Session on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.Session.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.Session.PATH, this, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this Session on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.sys.Session.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.sys.Session.PATH, this.__id[1], this.__id[0], {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Provides a  list of Sessions loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.Session>>} Resolves to an array of Session or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Session.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.Session, tutao.entity.sys.Session.PATH, listId, start, count, reverse, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.Session.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.Session.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.Session.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
