"use strict";

tutao.provide('tutao.entity.sys.GroupInfo');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.GroupInfo = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__listEncSessionKey = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._created = null;
    this._deleted = null;
    this._mailAddress = null;
    this._name = null;
    this._name_ = null;
    this._group = null;
    this._mailAddressAliases = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.GroupInfo.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.GroupInfo.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__listEncSessionKey = data._listEncSessionKey;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._created = data.created;
  this._deleted = data.deleted;
  this._mailAddress = data.mailAddress;
  this._name = data.name;
  this._name_ = null;
  this._group = data.group;
  this._mailAddressAliases = [];
  for (var i=0; i < data.mailAddressAliases.length; i++) {
    this._mailAddressAliases.push(new tutao.entity.sys.MailAddressAlias(this, data.mailAddressAliases[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.GroupInfo.MODEL_VERSION = '18';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.GroupInfo.PATH = '/rest/sys/groupinfo';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.GroupInfo.ROOT_INSTANCE_ID = 'A3N5cwAO';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.GroupInfo.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.GroupInfo.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.GroupInfo.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _listEncSessionKey: this.__listEncSessionKey, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    created: this._created, 
    deleted: this._deleted, 
    mailAddress: this._mailAddress, 
    name: this._name, 
    group: this._group, 
    mailAddressAliases: tutao.entity.EntityHelper.aggregatesToJsonData(this._mailAddressAliases)
  };
};

/**
 * Provides the id of this GroupInfo.
 * @return {Array.<string>} The id of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this GroupInfo.
 * @param {string} format The format of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this GroupInfo.
 * @return {string} The format of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the listEncSessionKey of this GroupInfo.
 * @param {string} listEncSessionKey The listEncSessionKey of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.setListEncSessionKey = function(listEncSessionKey) {
  this.__listEncSessionKey = listEncSessionKey;
  return this;
};

/**
 * Provides the listEncSessionKey of this GroupInfo.
 * @return {string} The listEncSessionKey of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getListEncSessionKey = function() {
  return this.__listEncSessionKey;
};

/**
 * Sets the ownerEncSessionKey of this GroupInfo.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this GroupInfo.
 * @return {string} The ownerEncSessionKey of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this GroupInfo.
 * @param {string} ownerGroup The ownerGroup of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this GroupInfo.
 * @return {string} The ownerGroup of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this GroupInfo.
 * @param {string} permissions The permissions of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this GroupInfo.
 * @return {string} The permissions of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the created of this GroupInfo.
 * @param {Date} created The created of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.setCreated = function(created) {
  this._created = String(created.getTime());
  return this;
};

/**
 * Provides the created of this GroupInfo.
 * @return {Date} The created of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getCreated = function() {
  if (isNaN(this._created)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._created);
  }
  return new Date(Number(this._created));
};

/**
 * Sets the deleted of this GroupInfo.
 * @param {Date} deleted The deleted of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.setDeleted = function(deleted) {
  if (deleted == null) {
    this._deleted = null;
  } else {
    this._deleted = String(deleted.getTime());
  }
  return this;
};

/**
 * Provides the deleted of this GroupInfo.
 * @return {Date} The deleted of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getDeleted = function() {
  if (this._deleted == null) {
    return null;
  }
  if (isNaN(this._deleted)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._deleted);
  }
  return new Date(Number(this._deleted));
};

/**
 * Sets the mailAddress of this GroupInfo.
 * @param {string} mailAddress The mailAddress of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this GroupInfo.
 * @return {string} The mailAddress of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the name of this GroupInfo.
 * @param {string} name The name of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.setName = function(name) {
  var dataToEncrypt = name;
  this._name = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._name_ = name;
  return this;
};

/**
 * Provides the name of this GroupInfo.
 * @return {string} The name of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getName = function() {
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
 * Sets the group of this GroupInfo.
 * @param {string} group The group of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this GroupInfo.
 * @return {string} The group of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getGroup = function() {
  return this._group;
};

/**
 * Loads the group of this GroupInfo.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded group of this GroupInfo or an exception if the loading failed.
 */
tutao.entity.sys.GroupInfo.prototype.loadGroup = function() {
  return tutao.entity.sys.Group.load(this._group);
};

/**
 * Provides the mailAddressAliases of this GroupInfo.
 * @return {Array.<tutao.entity.sys.MailAddressAlias>} The mailAddressAliases of this GroupInfo.
 */
tutao.entity.sys.GroupInfo.prototype.getMailAddressAliases = function() {
  return this._mailAddressAliases;
};

/**
 * Loads a GroupInfo from the server.
 * @param {Array.<string>} id The id of the GroupInfo.
 * @return {Promise.<tutao.entity.sys.GroupInfo>} Resolves to the GroupInfo or an exception if the loading failed.
 */
tutao.entity.sys.GroupInfo.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.GroupInfo, tutao.entity.sys.GroupInfo.PATH, id[1], id[0], {"v" : "18"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple GroupInfos from the server.
 * @param {Array.<Array.<string>>} ids The ids of the GroupInfos to load.
 * @return {Promise.<Array.<tutao.entity.sys.GroupInfo>>} Resolves to an array of GroupInfo or rejects with an exception if the loading failed.
 */
tutao.entity.sys.GroupInfo.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.GroupInfo, tutao.entity.sys.GroupInfo.PATH, ids, {"v": "18"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.GroupInfo.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "18";
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.GroupInfo.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this GroupInfo on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.GroupInfo.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.GroupInfo.PATH, this, {"v": "18"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of GroupInfos loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.GroupInfo>>} Resolves to an array of GroupInfo or rejects with an exception if the loading failed.
 */
tutao.entity.sys.GroupInfo.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.GroupInfo, tutao.entity.sys.GroupInfo.PATH, listId, start, count, reverse, {"v": "18"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.GroupInfo.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.GroupInfo.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.GroupInfo.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
