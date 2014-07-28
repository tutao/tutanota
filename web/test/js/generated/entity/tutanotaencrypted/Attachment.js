"use strict";

goog.provide('tutao.entity.tutanotaencrypted.Attachment');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaencrypted.Attachment = function(data) {
  if (data) {
    this.__area = data._area;
    this.__format = data._format;
    this.__id = data._id;
    this.__owner = data._owner;
    this.__permissions = data._permissions;
    this._fileData = data.fileData;
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__owner = null;
    this.__permissions = null;
    this._fileData = null;
  };
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanotaencrypted.Attachment.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanotaencrypted.Attachment.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanotaencrypted.Attachment.PATH = '/rest/tutanotaencrypted/attachment';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanotaencrypted.Attachment.ROOT_INSTANCE_ID = 'EXR1dGFub3RhZW5jcnlwdGVkAAA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanotaencrypted.Attachment.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _owner: this.__owner, 
    _permissions: this.__permissions, 
    fileData: this._fileData
  };
};

/**
 * The id of the Attachment type.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.TYPE_ID = 0;

/**
 * The id of the _area attribute.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype._AREA_ATTRIBUTE_ID = 6;

/**
 * The id of the _owner attribute.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype._OWNER_ATTRIBUTE_ID = 5;

/**
 * The id of the fileData attribute.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.FILEDATA_ATTRIBUTE_ID = 7;

/**
 * Provides the id of this Attachment.
 * @return {string} The id of this Attachment.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this Attachment.
 * @param {string} area The area of this Attachment.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this Attachment.
 * @return {string} The area of this Attachment.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this Attachment.
 * @param {string} format The format of this Attachment.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Attachment.
 * @return {string} The format of this Attachment.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this Attachment.
 * @param {string} owner The owner of this Attachment.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this Attachment.
 * @return {string} The owner of this Attachment.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the permissions of this Attachment.
 * @param {string} permissions The permissions of this Attachment.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Attachment.
 * @return {string} The permissions of this Attachment.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the fileData of this Attachment.
 * @param {string} fileData The fileData of this Attachment.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.setFileData = function(fileData) {
  var dataToEncrypt = fileData;
  this._fileData = tutao.locator.aesCrypter.encryptBytes(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the fileData of this Attachment.
 * @return {string} The fileData of this Attachment.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.getFileData = function() {
  if (this._fileData == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptBytes(this._entityHelper.getSessionKey(), this._fileData);
  return value;
};

/**
 * Loads a Attachment from the server.
 * @param {string} id The id of the Attachment.
 * @return {Promise.<tutao.entity.tutanotaencrypted.Attachment>} Resolves to the Attachment or an exception if the loading failed.
 */
tutao.entity.tutanotaencrypted.Attachment.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanotaencrypted.Attachment, tutao.entity.tutanotaencrypted.Attachment.PATH, id, null, {"v" : 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple Attachments from the server.
 * @param {Array.<string>} ids The ids of the Attachments to load.
 * @return {Promise.<Array.<tutao.entity.tutanotaencrypted.Attachment>>} Resolves to an array of Attachment or rejects with an exception if the loading failed.
 */
tutao.entity.tutanotaencrypted.Attachment.loadMultiple = function(ids) {
  tutao.locator.entityRestClient.getElements(tutao.entity.tutanotaencrypted.Attachment, tutao.entity.tutanotaencrypted.Attachment.PATH, ids, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders(), function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Stores this Attachment on the server and updates this instance with _id and _permission values generated on the server.
 * @param {tutao.entity.BucketData} bucketData The bucket data for which the share permission on instance shall be created.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.setup = function(bucketData) {
  var self = this;
  var params = this._entityHelper.createPostPermissionMap(bucketData)
  params["v"] = 1
  return tutao.locator.entityRestClient.postElement(tutao.entity.tutanotaencrypted.Attachment.PATH, this, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = entity.getGeneratedId();
    self.setPermissions(entity.getPermissionListId());
    self._entityHelper.notifyObservers(false);
  })
};

/**
 * Updates this Attachment on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanotaencrypted.Attachment.PATH, this, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this Attachment on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanotaencrypted.Attachment.PATH, this.__id, null, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanotaencrypted.Attachment.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
