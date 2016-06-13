"use strict";

tutao.provide('tutao.entity.tutanota.File');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.File = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__owner = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._mimeType = null;
    this._mimeType_ = null;
    this._name = null;
    this._name_ = null;
    this._size = null;
    this._data = null;
    this._parent = null;
    this._subFiles = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.File.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.File.prototype.updateData = function(data) {
  this.__area = data._area;
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__owner = data._owner;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._mimeType = data.mimeType;
  this._mimeType_ = null;
  this._name = data.name;
  this._name_ = null;
  this._size = data.size;
  this._data = data.data;
  this._parent = data.parent;
  this._subFiles = (data.subFiles) ? new tutao.entity.tutanota.Subfiles(this, data.subFiles) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.File.MODEL_VERSION = '13';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.File.PATH = '/rest/tutanota/file';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.File.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAA0';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.File.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.File.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.File.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _owner: this.__owner, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    mimeType: this._mimeType, 
    name: this._name, 
    size: this._size, 
    data: this._data, 
    parent: this._parent, 
    subFiles: tutao.entity.EntityHelper.aggregatesToJsonData(this._subFiles)
  };
};

/**
 * Provides the id of this File.
 * @return {Array.<string>} The id of this File.
 */
tutao.entity.tutanota.File.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this File.
 * @param {string} area The area of this File.
 */
tutao.entity.tutanota.File.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this File.
 * @return {string} The area of this File.
 */
tutao.entity.tutanota.File.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this File.
 * @param {string} format The format of this File.
 */
tutao.entity.tutanota.File.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this File.
 * @return {string} The format of this File.
 */
tutao.entity.tutanota.File.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerEncSessionKey of this File.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this File.
 */
tutao.entity.tutanota.File.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this File.
 * @return {string} The ownerEncSessionKey of this File.
 */
tutao.entity.tutanota.File.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the owner of this File.
 * @param {string} owner The owner of this File.
 */
tutao.entity.tutanota.File.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this File.
 * @return {string} The owner of this File.
 */
tutao.entity.tutanota.File.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the ownerGroup of this File.
 * @param {string} ownerGroup The ownerGroup of this File.
 */
tutao.entity.tutanota.File.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this File.
 * @return {string} The ownerGroup of this File.
 */
tutao.entity.tutanota.File.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this File.
 * @param {string} permissions The permissions of this File.
 */
tutao.entity.tutanota.File.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this File.
 * @return {string} The permissions of this File.
 */
tutao.entity.tutanota.File.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the mimeType of this File.
 * @param {string} mimeType The mimeType of this File.
 */
tutao.entity.tutanota.File.prototype.setMimeType = function(mimeType) {
  if (mimeType == null) {
    this._mimeType = null;
    this._mimeType_ = null;
  } else {
    var dataToEncrypt = mimeType;
    this._mimeType = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._mimeType_ = mimeType;
  }
  return this;
};

/**
 * Provides the mimeType of this File.
 * @return {string} The mimeType of this File.
 */
tutao.entity.tutanota.File.prototype.getMimeType = function() {
  if (this._mimeType == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._mimeType_ != null) {
    return this._mimeType_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._mimeType);
    this._mimeType_ = value;
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
 * Sets the name of this File.
 * @param {string} name The name of this File.
 */
tutao.entity.tutanota.File.prototype.setName = function(name) {
  var dataToEncrypt = name;
  this._name = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._name_ = name;
  return this;
};

/**
 * Provides the name of this File.
 * @return {string} The name of this File.
 */
tutao.entity.tutanota.File.prototype.getName = function() {
  if (this._name_ != null) {
    return this._name_;
  }
  if (this._name == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._name);
    this._name_ = value;
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
 * Sets the size of this File.
 * @param {string} size The size of this File.
 */
tutao.entity.tutanota.File.prototype.setSize = function(size) {
  this._size = size;
  return this;
};

/**
 * Provides the size of this File.
 * @return {string} The size of this File.
 */
tutao.entity.tutanota.File.prototype.getSize = function() {
  return this._size;
};

/**
 * Sets the data of this File.
 * @param {string} data The data of this File.
 */
tutao.entity.tutanota.File.prototype.setData = function(data) {
  this._data = data;
  return this;
};

/**
 * Provides the data of this File.
 * @return {string} The data of this File.
 */
tutao.entity.tutanota.File.prototype.getData = function() {
  return this._data;
};

/**
 * Loads the data of this File.
 * @return {Promise.<tutao.entity.tutanota.FileData>} Resolves to the loaded data of this File or an exception if the loading failed.
 */
tutao.entity.tutanota.File.prototype.loadData = function() {
  return tutao.entity.tutanota.FileData.load(this._data);
};

/**
 * Sets the parent of this File.
 * @param {Array.<string>} parent The parent of this File.
 */
tutao.entity.tutanota.File.prototype.setParent = function(parent) {
  this._parent = parent;
  return this;
};

/**
 * Provides the parent of this File.
 * @return {Array.<string>} The parent of this File.
 */
tutao.entity.tutanota.File.prototype.getParent = function() {
  return this._parent;
};

/**
 * Loads the parent of this File.
 * @return {Promise.<tutao.entity.tutanota.File>} Resolves to the loaded parent of this File or an exception if the loading failed.
 */
tutao.entity.tutanota.File.prototype.loadParent = function() {
  return tutao.entity.tutanota.File.load(this._parent);
};

/**
 * Sets the subFiles of this File.
 * @param {tutao.entity.tutanota.Subfiles} subFiles The subFiles of this File.
 */
tutao.entity.tutanota.File.prototype.setSubFiles = function(subFiles) {
  this._subFiles = subFiles;
  return this;
};

/**
 * Provides the subFiles of this File.
 * @return {tutao.entity.tutanota.Subfiles} The subFiles of this File.
 */
tutao.entity.tutanota.File.prototype.getSubFiles = function() {
  return this._subFiles;
};

/**
 * Loads a File from the server.
 * @param {Array.<string>} id The id of the File.
 * @return {Promise.<tutao.entity.tutanota.File>} Resolves to the File or an exception if the loading failed.
 */
tutao.entity.tutanota.File.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.File, tutao.entity.tutanota.File.PATH, id[1], id[0], {"v" : "13"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple Files from the server.
 * @param {Array.<Array.<string>>} ids The ids of the Files to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.File>>} Resolves to an array of File or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.File.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.File, tutao.entity.tutanota.File.PATH, ids, {"v": "13"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.File.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "13";
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.File.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this File on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.File.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.File.PATH, this, {"v": "13"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of Files loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.tutanota.File>>} Resolves to an array of File or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.File.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.File, tutao.entity.tutanota.File.PATH, listId, start, count, reverse, {"v": "13"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.File.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.File.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.File.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
