"use strict";

tutao.provide('tutao.entity.tutanota.MailHeaders');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailHeaders = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._headers = null;
    this._headers_ = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.MailHeaders.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailHeaders.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._headers = data.headers;
  this._headers_ = null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.MailHeaders.MODEL_VERSION = '14';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.MailHeaders.PATH = '/rest/tutanota/mailheaders';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.MailHeaders.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAAJc';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.MailHeaders.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.MailHeaders.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MailHeaders.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    headers: this._headers
  };
};

/**
 * Provides the id of this MailHeaders.
 * @return {string} The id of this MailHeaders.
 */
tutao.entity.tutanota.MailHeaders.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this MailHeaders.
 * @param {string} format The format of this MailHeaders.
 */
tutao.entity.tutanota.MailHeaders.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MailHeaders.
 * @return {string} The format of this MailHeaders.
 */
tutao.entity.tutanota.MailHeaders.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this MailHeaders.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this MailHeaders.
 */
tutao.entity.tutanota.MailHeaders.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this MailHeaders.
 * @return {string} The ownerEncSessionKey of this MailHeaders.
 */
tutao.entity.tutanota.MailHeaders.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this MailHeaders.
 * @param {string} ownerGroup The ownerGroup of this MailHeaders.
 */
tutao.entity.tutanota.MailHeaders.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this MailHeaders.
 * @return {string} The ownerGroup of this MailHeaders.
 */
tutao.entity.tutanota.MailHeaders.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this MailHeaders.
 * @param {string} permissions The permissions of this MailHeaders.
 */
tutao.entity.tutanota.MailHeaders.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this MailHeaders.
 * @return {string} The permissions of this MailHeaders.
 */
tutao.entity.tutanota.MailHeaders.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the headers of this MailHeaders.
 * @param {string} headers The headers of this MailHeaders.
 */
tutao.entity.tutanota.MailHeaders.prototype.setHeaders = function(headers) {
  var dataToEncrypt = headers;
  this._headers = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._headers_ = headers;
  return this;
};

/**
 * Provides the headers of this MailHeaders.
 * @return {string} The headers of this MailHeaders.
 */
tutao.entity.tutanota.MailHeaders.prototype.getHeaders = function() {
  if (this._headers_ != null) {
    return this._headers_;
  }
  if (this._headers == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._headers);
    this._headers_ = value;
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
 * Loads a MailHeaders from the server.
 * @param {string} id The id of the MailHeaders.
 * @return {Promise.<tutao.entity.tutanota.MailHeaders>} Resolves to the MailHeaders or an exception if the loading failed.
 */
tutao.entity.tutanota.MailHeaders.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailHeaders, tutao.entity.tutanota.MailHeaders.PATH, id, null, {"v" : "14"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple MailHeaderss from the server.
 * @param {Array.<string>} ids The ids of the MailHeaderss to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.MailHeaders>>} Resolves to an array of MailHeaders or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.MailHeaders.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.MailHeaders, tutao.entity.tutanota.MailHeaders.PATH, ids, {"v": "14"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.MailHeaders.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "14";
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.MailHeaders.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this MailHeaders on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.MailHeaders.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.MailHeaders.PATH, this, {"v": "14"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.MailHeaders.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.MailHeaders.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MailHeaders.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
