"use strict";

goog.provide('tutao.entity.tutanotaencrypted.MailBox');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaencrypted.MailBox = function(data) {
  if (data) {
    this.__area = data._area;
    this.__format = data._format;
    this.__id = data._id;
    this.__owner = data._owner;
    this.__permissions = data._permissions;
    this._mails = data.mails;
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__owner = null;
    this.__permissions = null;
    this._mails = null;
  };
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanotaencrypted.MailBox.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanotaencrypted.MailBox.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanotaencrypted.MailBox.PATH = '/rest/tutanotaencrypted/mailbox';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanotaencrypted.MailBox.ROOT_INSTANCE_ID = 'EXR1dGFub3RhZW5jcnlwdGVkADA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanotaencrypted.MailBox.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _owner: this.__owner, 
    _permissions: this.__permissions, 
    mails: this._mails
  };
};

/**
 * The id of the MailBox type.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.TYPE_ID = 48;

/**
 * The id of the _area attribute.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype._AREA_ATTRIBUTE_ID = 54;

/**
 * The id of the _owner attribute.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype._OWNER_ATTRIBUTE_ID = 53;

/**
 * The id of the mails attribute.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.MAILS_ATTRIBUTE_ID = 55;

/**
 * Provides the id of this MailBox.
 * @return {string} The id of this MailBox.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this MailBox.
 * @param {string} area The area of this MailBox.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this MailBox.
 * @return {string} The area of this MailBox.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this MailBox.
 * @param {string} format The format of this MailBox.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MailBox.
 * @return {string} The format of this MailBox.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this MailBox.
 * @param {string} owner The owner of this MailBox.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this MailBox.
 * @return {string} The owner of this MailBox.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the permissions of this MailBox.
 * @param {string} permissions The permissions of this MailBox.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this MailBox.
 * @return {string} The permissions of this MailBox.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the mails of this MailBox.
 * @param {string} mails The mails of this MailBox.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.setMails = function(mails) {
  this._mails = mails;
  return this;
};

/**
 * Provides the mails of this MailBox.
 * @return {string} The mails of this MailBox.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.getMails = function() {
  return this._mails;
};

/**
 * Loads a MailBox from the server.
 * @param {string} id The id of the MailBox.
 * @return {Promise.<tutao.entity.tutanotaencrypted.MailBox>} Resolves to the MailBox or an exception if the loading failed.
 */
tutao.entity.tutanotaencrypted.MailBox.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanotaencrypted.MailBox, tutao.entity.tutanotaencrypted.MailBox.PATH, id, null, {"v" : 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple MailBoxs from the server.
 * @param {Array.<string>} ids The ids of the MailBoxs to load.
 * @return {Promise.<Array.<tutao.entity.tutanotaencrypted.MailBox>>} Resolves to an array of MailBox or rejects with an exception if the loading failed.
 */
tutao.entity.tutanotaencrypted.MailBox.loadMultiple = function(ids) {
  tutao.locator.entityRestClient.getElements(tutao.entity.tutanotaencrypted.MailBox, tutao.entity.tutanotaencrypted.MailBox.PATH, ids, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders(), function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Stores this MailBox on the server and updates this instance with _id and _permission values generated on the server.
 * @param {tutao.entity.BucketData} bucketData The bucket data for which the share permission on instance shall be created.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.setup = function(bucketData) {
  var self = this;
  var params = this._entityHelper.createPostPermissionMap(bucketData)
  params["v"] = 1
  return tutao.locator.entityRestClient.postElement(tutao.entity.tutanotaencrypted.MailBox.PATH, this, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = entity.getGeneratedId();
    self.setPermissions(entity.getPermissionListId());
    self._entityHelper.notifyObservers(false);
  })
};

/**
 * Updates this MailBox on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanotaencrypted.MailBox.PATH, this, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this MailBox on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanotaencrypted.MailBox.PATH, this.__id, null, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanotaencrypted.MailBox.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
