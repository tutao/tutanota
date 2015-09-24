"use strict";

tutao.provide('tutao.entity.tutanota.MailFolder');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailFolder = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__listEncSessionKey = null;
    this.__permissions = null;
    this._folderType = null;
    this._name = null;
    this._mails = null;
    this._parentFolder = null;
    this._subFolders = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.MailFolder.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailFolder.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__listEncSessionKey = data._listEncSessionKey;
  this.__permissions = data._permissions;
  this._folderType = data.folderType;
  this._name = data.name;
  this._mails = data.mails;
  this._parentFolder = data.parentFolder;
  this._subFolders = data.subFolders;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.MailFolder.MODEL_VERSION = '8';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.MailFolder.PATH = '/rest/tutanota/mailfolder';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.MailFolder.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAAGt';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.MailFolder.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.MailFolder.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MailFolder.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _listEncSessionKey: this.__listEncSessionKey, 
    _permissions: this.__permissions, 
    folderType: this._folderType, 
    name: this._name, 
    mails: this._mails, 
    parentFolder: this._parentFolder, 
    subFolders: this._subFolders
  };
};

/**
 * The id of the MailFolder type.
 */
tutao.entity.tutanota.MailFolder.prototype.TYPE_ID = 429;

/**
 * The id of the folderType attribute.
 */
tutao.entity.tutanota.MailFolder.prototype.FOLDERTYPE_ATTRIBUTE_ID = 436;

/**
 * The id of the name attribute.
 */
tutao.entity.tutanota.MailFolder.prototype.NAME_ATTRIBUTE_ID = 435;

/**
 * The id of the mails attribute.
 */
tutao.entity.tutanota.MailFolder.prototype.MAILS_ATTRIBUTE_ID = 437;

/**
 * The id of the parentFolder attribute.
 */
tutao.entity.tutanota.MailFolder.prototype.PARENTFOLDER_ATTRIBUTE_ID = 439;

/**
 * The id of the subFolders attribute.
 */
tutao.entity.tutanota.MailFolder.prototype.SUBFOLDERS_ATTRIBUTE_ID = 438;

/**
 * Provides the id of this MailFolder.
 * @return {Array.<string>} The id of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this MailFolder.
 * @param {string} format The format of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MailFolder.
 * @return {string} The format of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the listEncSessionKey of this MailFolder.
 * @param {string} listEncSessionKey The listEncSessionKey of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.setListEncSessionKey = function(listEncSessionKey) {
  this.__listEncSessionKey = listEncSessionKey;
  return this;
};

/**
 * Provides the listEncSessionKey of this MailFolder.
 * @return {string} The listEncSessionKey of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.getListEncSessionKey = function() {
  return this.__listEncSessionKey;
};

/**
 * Sets the permissions of this MailFolder.
 * @param {string} permissions The permissions of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this MailFolder.
 * @return {string} The permissions of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the folderType of this MailFolder.
 * @param {string} folderType The folderType of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.setFolderType = function(folderType) {
  this._folderType = folderType;
  return this;
};

/**
 * Provides the folderType of this MailFolder.
 * @return {string} The folderType of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.getFolderType = function() {
  return this._folderType;
};

/**
 * Sets the name of this MailFolder.
 * @param {string} name The name of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.setName = function(name) {
  var dataToEncrypt = name;
  this._name = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the name of this MailFolder.
 * @return {string} The name of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.getName = function() {
  if (this._name == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._name);
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
 * Sets the mails of this MailFolder.
 * @param {string} mails The mails of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.setMails = function(mails) {
  this._mails = mails;
  return this;
};

/**
 * Provides the mails of this MailFolder.
 * @return {string} The mails of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.getMails = function() {
  return this._mails;
};

/**
 * Sets the parentFolder of this MailFolder.
 * @param {Array.<string>} parentFolder The parentFolder of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.setParentFolder = function(parentFolder) {
  this._parentFolder = parentFolder;
  return this;
};

/**
 * Provides the parentFolder of this MailFolder.
 * @return {Array.<string>} The parentFolder of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.getParentFolder = function() {
  return this._parentFolder;
};

/**
 * Loads the parentFolder of this MailFolder.
 * @return {Promise.<tutao.entity.tutanota.MailFolder>} Resolves to the loaded parentFolder of this MailFolder or an exception if the loading failed.
 */
tutao.entity.tutanota.MailFolder.prototype.loadParentFolder = function() {
  return tutao.entity.tutanota.MailFolder.load(this._parentFolder);
};

/**
 * Sets the subFolders of this MailFolder.
 * @param {string} subFolders The subFolders of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.setSubFolders = function(subFolders) {
  this._subFolders = subFolders;
  return this;
};

/**
 * Provides the subFolders of this MailFolder.
 * @return {string} The subFolders of this MailFolder.
 */
tutao.entity.tutanota.MailFolder.prototype.getSubFolders = function() {
  return this._subFolders;
};

/**
 * Loads a MailFolder from the server.
 * @param {Array.<string>} id The id of the MailFolder.
 * @return {Promise.<tutao.entity.tutanota.MailFolder>} Resolves to the MailFolder or an exception if the loading failed.
 */
tutao.entity.tutanota.MailFolder.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailFolder, tutao.entity.tutanota.MailFolder.PATH, id[1], id[0], {"v" : 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple MailFolders from the server.
 * @param {Array.<Array.<string>>} ids The ids of the MailFolders to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.MailFolder>>} Resolves to an array of MailFolder or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.MailFolder.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.MailFolder, tutao.entity.tutanota.MailFolder.PATH, ids, {"v": 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.MailFolder.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 8;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.MailFolder.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this MailFolder on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.MailFolder.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.MailFolder.PATH, this, {"v": 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of MailFolders loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.tutanota.MailFolder>>} Resolves to an array of MailFolder or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.MailFolder.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.MailFolder, tutao.entity.tutanota.MailFolder.PATH, listId, start, count, reverse, {"v": 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.MailFolder.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.MailFolder.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MailFolder.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
