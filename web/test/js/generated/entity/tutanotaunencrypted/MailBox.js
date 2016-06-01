"use strict";

tutao.provide('tutao.entity.tutanotaunencrypted.MailBox');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaunencrypted.MailBox = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__owner = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._mails = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanotaunencrypted.MailBox.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.updateData = function(data) {
  this.__area = data._area;
  this.__format = data._format;
  this.__id = data._id;
  this.__owner = data._owner;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._mails = data.mails;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanotaunencrypted.MailBox.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanotaunencrypted.MailBox.PATH = '/rest/tutanotaunencrypted/mailbox';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanotaunencrypted.MailBox.ROOT_INSTANCE_ID = 'E3R1dGFub3RhdW5lbmNyeXB0ZWQAMw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanotaunencrypted.MailBox.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _owner: this.__owner, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    mails: this._mails
  };
};

/**
 * The id of the MailBox type.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.TYPE_ID = 51;

/**
 * The id of the _area attribute.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype._AREA_ATTRIBUTE_ID = 58;

/**
 * The id of the _owner attribute.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype._OWNER_ATTRIBUTE_ID = 57;

/**
 * The id of the _ownerGroup attribute.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype._OWNERGROUP_ATTRIBUTE_ID = 56;

/**
 * The id of the mails attribute.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.MAILS_ATTRIBUTE_ID = 59;

/**
 * Provides the id of this MailBox.
 * @return {string} The id of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this MailBox.
 * @param {string} area The area of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this MailBox.
 * @return {string} The area of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this MailBox.
 * @param {string} format The format of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MailBox.
 * @return {string} The format of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this MailBox.
 * @param {string} owner The owner of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this MailBox.
 * @return {string} The owner of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the ownerGroup of this MailBox.
 * @param {string} ownerGroup The ownerGroup of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this MailBox.
 * @return {string} The ownerGroup of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this MailBox.
 * @param {string} permissions The permissions of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this MailBox.
 * @return {string} The permissions of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the mails of this MailBox.
 * @param {string} mails The mails of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.setMails = function(mails) {
  this._mails = mails;
  return this;
};

/**
 * Provides the mails of this MailBox.
 * @return {string} The mails of this MailBox.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.getMails = function() {
  return this._mails;
};

/**
 * Loads a MailBox from the server.
 * @param {string} id The id of the MailBox.
 * @return {Promise.<tutao.entity.tutanotaunencrypted.MailBox>} Resolves to the MailBox or an exception if the loading failed.
 */
tutao.entity.tutanotaunencrypted.MailBox.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanotaunencrypted.MailBox, tutao.entity.tutanotaunencrypted.MailBox.PATH, id, null, {"v" : "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple MailBoxs from the server.
 * @param {Array.<string>} ids The ids of the MailBoxs to load.
 * @return {Promise.<Array.<tutao.entity.tutanotaunencrypted.MailBox>>} Resolves to an array of MailBox or rejects with an exception if the loading failed.
 */
tutao.entity.tutanotaunencrypted.MailBox.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanotaunencrypted.MailBox, tutao.entity.tutanotaunencrypted.MailBox.PATH, ids, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Stores this MailBox on the server and updates this instance with _id and _permission values generated on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.setup = function() {
  var self = this;
  var params = { "v" : "1" };
  return tutao.locator.entityRestClient.postElement(tutao.entity.tutanotaunencrypted.MailBox.PATH, this, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = entity.getGeneratedId();
    self.setPermissions(entity.getPermissionListId());
    self._entityHelper.notifyObservers(false);
  })
};

/**
 * Updates this MailBox on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanotaunencrypted.MailBox.PATH, this, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this MailBox on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanotaunencrypted.MailBox.PATH, this.__id, null, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanotaunencrypted.MailBox.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
