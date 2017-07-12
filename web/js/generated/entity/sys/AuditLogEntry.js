"use strict";

tutao.provide('tutao.entity.sys.AuditLogEntry');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AuditLogEntry = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._action = null;
    this._action_ = null;
    this._actorIpAddress = null;
    this._actorIpAddress_ = null;
    this._actorMailAddress = null;
    this._actorMailAddress_ = null;
    this._date = null;
    this._date_ = null;
    this._modifiedEntity = null;
    this._modifiedEntity_ = null;
    this._groupInfo = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.AuditLogEntry.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AuditLogEntry.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._action = data.action;
  this._action_ = null;
  this._actorIpAddress = data.actorIpAddress;
  this._actorIpAddress_ = null;
  this._actorMailAddress = data.actorMailAddress;
  this._actorMailAddress_ = null;
  this._date = data.date;
  this._date_ = null;
  this._modifiedEntity = data.modifiedEntity;
  this._modifiedEntity_ = null;
  this._groupInfo = data.groupInfo;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.AuditLogEntry.MODEL_VERSION = '22';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.AuditLogEntry.PATH = '/rest/sys/auditlogentry';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.AuditLogEntry.ROOT_INSTANCE_ID = 'A3N5cwAETQ';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.AuditLogEntry.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.AuditLogEntry.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.AuditLogEntry.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    action: this._action, 
    actorIpAddress: this._actorIpAddress, 
    actorMailAddress: this._actorMailAddress, 
    date: this._date, 
    modifiedEntity: this._modifiedEntity, 
    groupInfo: this._groupInfo
  };
};

/**
 * Provides the id of this AuditLogEntry.
 * @return {Array.<string>} The id of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this AuditLogEntry.
 * @param {string} format The format of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this AuditLogEntry.
 * @return {string} The format of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this AuditLogEntry.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this AuditLogEntry.
 * @return {string} The ownerEncSessionKey of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this AuditLogEntry.
 * @param {string} ownerGroup The ownerGroup of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this AuditLogEntry.
 * @return {string} The ownerGroup of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this AuditLogEntry.
 * @param {string} permissions The permissions of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this AuditLogEntry.
 * @return {string} The permissions of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the action of this AuditLogEntry.
 * @param {string} action The action of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.setAction = function(action) {
  var dataToEncrypt = action;
  this._action = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._action_ = action;
  return this;
};

/**
 * Provides the action of this AuditLogEntry.
 * @return {string} The action of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.getAction = function() {
  if (this._action_ != null) {
    return this._action_;
  }
  if (this._action == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._action);
    this._action_ = value;
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
 * Sets the actorIpAddress of this AuditLogEntry.
 * @param {string} actorIpAddress The actorIpAddress of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.setActorIpAddress = function(actorIpAddress) {
  var dataToEncrypt = actorIpAddress;
  this._actorIpAddress = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._actorIpAddress_ = actorIpAddress;
  return this;
};

/**
 * Provides the actorIpAddress of this AuditLogEntry.
 * @return {string} The actorIpAddress of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.getActorIpAddress = function() {
  if (this._actorIpAddress_ != null) {
    return this._actorIpAddress_;
  }
  if (this._actorIpAddress == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._actorIpAddress);
    this._actorIpAddress_ = value;
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
 * Sets the actorMailAddress of this AuditLogEntry.
 * @param {string} actorMailAddress The actorMailAddress of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.setActorMailAddress = function(actorMailAddress) {
  var dataToEncrypt = actorMailAddress;
  this._actorMailAddress = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._actorMailAddress_ = actorMailAddress;
  return this;
};

/**
 * Provides the actorMailAddress of this AuditLogEntry.
 * @return {string} The actorMailAddress of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.getActorMailAddress = function() {
  if (this._actorMailAddress_ != null) {
    return this._actorMailAddress_;
  }
  if (this._actorMailAddress == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._actorMailAddress);
    this._actorMailAddress_ = value;
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
 * Sets the date of this AuditLogEntry.
 * @param {Date} date The date of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.setDate = function(date) {
  var dataToEncrypt = String(date.getTime());
  this._date = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._date_ = date;
  return this;
};

/**
 * Provides the date of this AuditLogEntry.
 * @return {Date} The date of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.getDate = function() {
  if (this._date_ != null) {
    return this._date_;
  }
  if (this._date == "" || !this._entityHelper.getSessionKey()) {
    return new Date(0);
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
 * Sets the modifiedEntity of this AuditLogEntry.
 * @param {string} modifiedEntity The modifiedEntity of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.setModifiedEntity = function(modifiedEntity) {
  var dataToEncrypt = modifiedEntity;
  this._modifiedEntity = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._modifiedEntity_ = modifiedEntity;
  return this;
};

/**
 * Provides the modifiedEntity of this AuditLogEntry.
 * @return {string} The modifiedEntity of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.getModifiedEntity = function() {
  if (this._modifiedEntity_ != null) {
    return this._modifiedEntity_;
  }
  if (this._modifiedEntity == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._modifiedEntity);
    this._modifiedEntity_ = value;
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
 * Sets the groupInfo of this AuditLogEntry.
 * @param {Array.<string>} groupInfo The groupInfo of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.setGroupInfo = function(groupInfo) {
  this._groupInfo = groupInfo;
  return this;
};

/**
 * Provides the groupInfo of this AuditLogEntry.
 * @return {Array.<string>} The groupInfo of this AuditLogEntry.
 */
tutao.entity.sys.AuditLogEntry.prototype.getGroupInfo = function() {
  return this._groupInfo;
};

/**
 * Loads the groupInfo of this AuditLogEntry.
 * @return {Promise.<tutao.entity.sys.GroupInfo>} Resolves to the loaded groupInfo of this AuditLogEntry or an exception if the loading failed.
 */
tutao.entity.sys.AuditLogEntry.prototype.loadGroupInfo = function() {
  return tutao.entity.sys.GroupInfo.load(this._groupInfo);
};

/**
 * Loads a AuditLogEntry from the server.
 * @param {Array.<string>} id The id of the AuditLogEntry.
 * @return {Promise.<tutao.entity.sys.AuditLogEntry>} Resolves to the AuditLogEntry or an exception if the loading failed.
 */
tutao.entity.sys.AuditLogEntry.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.AuditLogEntry, tutao.entity.sys.AuditLogEntry.PATH, id[1], id[0], {"v" : "22"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple AuditLogEntrys from the server.
 * @param {Array.<Array.<string>>} ids The ids of the AuditLogEntrys to load.
 * @return {Promise.<Array.<tutao.entity.sys.AuditLogEntry>>} Resolves to an array of AuditLogEntry or rejects with an exception if the loading failed.
 */
tutao.entity.sys.AuditLogEntry.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.AuditLogEntry, tutao.entity.sys.AuditLogEntry.PATH, ids, {"v": "22"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.AuditLogEntry.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "22";
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.AuditLogEntry.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this AuditLogEntry on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.AuditLogEntry.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.AuditLogEntry.PATH, this, {"v": "22"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of AuditLogEntrys loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.AuditLogEntry>>} Resolves to an array of AuditLogEntry or rejects with an exception if the loading failed.
 */
tutao.entity.sys.AuditLogEntry.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.AuditLogEntry, tutao.entity.sys.AuditLogEntry.PATH, listId, start, count, reverse, {"v": "22"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.AuditLogEntry.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.AuditLogEntry.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.AuditLogEntry.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
