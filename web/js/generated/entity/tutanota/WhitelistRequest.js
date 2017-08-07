"use strict";

tutao.provide('tutao.entity.tutanota.WhitelistRequest');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.WhitelistRequest = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._customerId = null;
    this._inboxFolder = null;
    this._mail = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.WhitelistRequest.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._customerId = data.customerId;
  this._inboxFolder = data.inboxFolder;
  this._mail = data.mail;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.WhitelistRequest.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.WhitelistRequest.PATH = '/rest/tutanota/whitelistrequest';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.WhitelistRequest.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAAKs';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.WhitelistRequest.GENERATED_ID = false;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.WhitelistRequest.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    customerId: this._customerId, 
    inboxFolder: this._inboxFolder, 
    mail: this._mail
  };
};

/**
 * Sets the custom id of this WhitelistRequest.
 * @param {Array.<string>} id The custom id of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.setId = function(id) {
  this.__id = id;
};

/**
 * Provides the id of this WhitelistRequest.
 * @return {Array.<string>} The id of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this WhitelistRequest.
 * @param {string} format The format of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this WhitelistRequest.
 * @return {string} The format of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this WhitelistRequest.
 * @param {string} ownerGroup The ownerGroup of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this WhitelistRequest.
 * @return {string} The ownerGroup of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this WhitelistRequest.
 * @param {string} permissions The permissions of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this WhitelistRequest.
 * @return {string} The permissions of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the customerId of this WhitelistRequest.
 * @param {string} customerId The customerId of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.setCustomerId = function(customerId) {
  this._customerId = customerId;
  return this;
};

/**
 * Provides the customerId of this WhitelistRequest.
 * @return {string} The customerId of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.getCustomerId = function() {
  return this._customerId;
};

/**
 * Sets the inboxFolder of this WhitelistRequest.
 * @param {Array.<string>} inboxFolder The inboxFolder of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.setInboxFolder = function(inboxFolder) {
  this._inboxFolder = inboxFolder;
  return this;
};

/**
 * Provides the inboxFolder of this WhitelistRequest.
 * @return {Array.<string>} The inboxFolder of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.getInboxFolder = function() {
  return this._inboxFolder;
};

/**
 * Loads the inboxFolder of this WhitelistRequest.
 * @return {Promise.<tutao.entity.tutanota.MailFolder>} Resolves to the loaded inboxFolder of this WhitelistRequest or an exception if the loading failed.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.loadInboxFolder = function() {
  return tutao.entity.tutanota.MailFolder.load(this._inboxFolder);
};

/**
 * Sets the mail of this WhitelistRequest.
 * @param {Array.<string>} mail The mail of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.setMail = function(mail) {
  this._mail = mail;
  return this;
};

/**
 * Provides the mail of this WhitelistRequest.
 * @return {Array.<string>} The mail of this WhitelistRequest.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.getMail = function() {
  return this._mail;
};

/**
 * Loads the mail of this WhitelistRequest.
 * @return {Promise.<tutao.entity.tutanota.Mail>} Resolves to the loaded mail of this WhitelistRequest or an exception if the loading failed.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.loadMail = function() {
  return tutao.entity.tutanota.Mail.load(this._mail);
};

/**
 * Loads a WhitelistRequest from the server.
 * @param {Array.<string>} id The id of the WhitelistRequest.
 * @return {Promise.<tutao.entity.tutanota.WhitelistRequest>} Resolves to the WhitelistRequest or an exception if the loading failed.
 */
tutao.entity.tutanota.WhitelistRequest.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.WhitelistRequest, tutao.entity.tutanota.WhitelistRequest.PATH, id[1], id[0], {"v" : "21"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple WhitelistRequests from the server.
 * @param {Array.<Array.<string>>} ids The ids of the WhitelistRequests to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.WhitelistRequest>>} Resolves to an array of WhitelistRequest or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.WhitelistRequest.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.WhitelistRequest, tutao.entity.tutanota.WhitelistRequest.PATH, ids, {"v": "21"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this WhitelistRequest on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.WhitelistRequest.PATH, this, {"v": "21"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of WhitelistRequests loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.tutanota.WhitelistRequest>>} Resolves to an array of WhitelistRequest or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.WhitelistRequest.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.WhitelistRequest, tutao.entity.tutanota.WhitelistRequest.PATH, listId, start, count, reverse, {"v": "21"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.WhitelistRequest.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
