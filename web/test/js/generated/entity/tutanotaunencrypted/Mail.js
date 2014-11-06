"use strict";

tutao.provide('tutao.entity.tutanotaunencrypted.Mail');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaunencrypted.Mail = function(data) {
  if (data) {
    this.__area = data._area;
    this.__format = data._format;
    this.__id = data._id;
    this.__owner = data._owner;
    this.__permissions = data._permissions;
    this._date = data.date;
    this._read = data.read;
    this._subject = data.subject;
    this._attachments = data.attachments;
    this._body = data.body;
    this._previous = data.previous;
    this._recipients = [];
    for (var i=0; i < data.recipients.length; i++) {
      this._recipients.push(new tutao.entity.tutanotaunencrypted.MailAddress(this, data.recipients[i]));
    }
    this._sender = (data.sender) ? new tutao.entity.tutanotaunencrypted.MailAddress(this, data.sender) : null;
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__owner = null;
    this.__permissions = null;
    this._date = null;
    this._read = null;
    this._subject = null;
    this._attachments = [];
    this._body = null;
    this._previous = null;
    this._recipients = [];
    this._sender = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanotaunencrypted.Mail.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanotaunencrypted.Mail.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanotaunencrypted.Mail.PATH = '/rest/tutanotaunencrypted/mail';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanotaunencrypted.Mail.ROOT_INSTANCE_ID = 'E3R1dGFub3RhdW5lbmNyeXB0ZWQAIA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanotaunencrypted.Mail.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _owner: this.__owner, 
    _permissions: this.__permissions, 
    date: this._date, 
    read: this._read, 
    subject: this._subject, 
    attachments: this._attachments, 
    body: this._body, 
    previous: this._previous, 
    recipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._recipients), 
    sender: tutao.entity.EntityHelper.aggregatesToJsonData(this._sender)
  };
};

/**
 * The id of the Mail type.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.TYPE_ID = 32;

/**
 * The id of the _area attribute.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype._AREA_ATTRIBUTE_ID = 38;

/**
 * The id of the _owner attribute.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype._OWNER_ATTRIBUTE_ID = 37;

/**
 * The id of the date attribute.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.DATE_ATTRIBUTE_ID = 40;

/**
 * The id of the read attribute.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.READ_ATTRIBUTE_ID = 41;

/**
 * The id of the subject attribute.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.SUBJECT_ATTRIBUTE_ID = 39;

/**
 * The id of the attachments attribute.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.ATTACHMENTS_ATTRIBUTE_ID = 44;

/**
 * The id of the body attribute.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.BODY_ATTRIBUTE_ID = 45;

/**
 * The id of the previous attribute.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.PREVIOUS_ATTRIBUTE_ID = 46;

/**
 * The id of the recipients attribute.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.RECIPIENTS_ATTRIBUTE_ID = 43;

/**
 * The id of the sender attribute.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.SENDER_ATTRIBUTE_ID = 42;

/**
 * Provides the id of this Mail.
 * @return {Array.<string>} The id of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this Mail.
 * @param {string} area The area of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this Mail.
 * @return {string} The area of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this Mail.
 * @param {string} format The format of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Mail.
 * @return {string} The format of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this Mail.
 * @param {string} owner The owner of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this Mail.
 * @return {string} The owner of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the permissions of this Mail.
 * @param {string} permissions The permissions of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Mail.
 * @return {string} The permissions of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the date of this Mail.
 * @param {Date} date The date of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.setDate = function(date) {
  this._date = String(date.getTime());
  return this;
};

/**
 * Provides the date of this Mail.
 * @return {Date} The date of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getDate = function() {
  if (isNaN(this._date)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._date);
  }
  return new Date(Number(this._date));
};

/**
 * Sets the read of this Mail.
 * @param {boolean} read The read of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.setRead = function(read) {
  this._read = read ? '1' : '0';
  return this;
};

/**
 * Provides the read of this Mail.
 * @return {boolean} The read of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getRead = function() {
  return this._read == '1';
};

/**
 * Sets the subject of this Mail.
 * @param {string} subject The subject of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.setSubject = function(subject) {
  this._subject = subject;
  return this;
};

/**
 * Provides the subject of this Mail.
 * @return {string} The subject of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getSubject = function() {
  return this._subject;
};

/**
 * Provides the attachments of this Mail.
 * @return {Array.<string>} The attachments of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getAttachments = function() {
  return this._attachments;
};

/**
 * Sets the body of this Mail.
 * @param {string} body The body of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.setBody = function(body) {
  this._body = body;
  return this;
};

/**
 * Provides the body of this Mail.
 * @return {string} The body of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getBody = function() {
  return this._body;
};

/**
 * Loads the body of this Mail.
 * @return {Promise.<tutao.entity.tutanotaunencrypted.MailBody>} Resolves to the loaded body of this Mail or an exception if the loading failed.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.loadBody = function() {
  return tutao.entity.tutanotaunencrypted.MailBody.load(this._body);
};

/**
 * Sets the previous of this Mail.
 * @param {Array.<string>} previous The previous of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.setPrevious = function(previous) {
  this._previous = previous;
  return this;
};

/**
 * Provides the previous of this Mail.
 * @return {Array.<string>} The previous of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getPrevious = function() {
  return this._previous;
};

/**
 * Loads the previous of this Mail.
 * @return {Promise.<tutao.entity.tutanotaunencrypted.Mail>} Resolves to the loaded previous of this Mail or an exception if the loading failed.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.loadPrevious = function() {
  return tutao.entity.tutanotaunencrypted.Mail.load(this._previous);
};

/**
 * Provides the recipients of this Mail.
 * @return {Array.<tutao.entity.tutanotaunencrypted.MailAddress>} The recipients of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getRecipients = function() {
  return this._recipients;
};

/**
 * Sets the sender of this Mail.
 * @param {tutao.entity.tutanotaunencrypted.MailAddress} sender The sender of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.setSender = function(sender) {
  this._sender = sender;
  return this;
};

/**
 * Provides the sender of this Mail.
 * @return {tutao.entity.tutanotaunencrypted.MailAddress} The sender of this Mail.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.getSender = function() {
  return this._sender;
};

/**
 * Loads a Mail from the server.
 * @param {Array.<string>} id The id of the Mail.
 * @return {Promise.<tutao.entity.tutanotaunencrypted.Mail>} Resolves to the Mail or an exception if the loading failed.
 */
tutao.entity.tutanotaunencrypted.Mail.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanotaunencrypted.Mail, tutao.entity.tutanotaunencrypted.Mail.PATH, id[1], id[0], {"v" : 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads a version of this Mail from the server.
 * @param {string} versionId The id of the requested version.
 * @return {Promise.<tutao.entity.tutanotaunencrypted.Mail>} Resolves to Mail or an exception if the loading failed.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.loadVersion = function(versionId) {
  var map = {};
  map["version"] = versionId;
  map["v"] = 1;
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanotaunencrypted.Mail, tutao.entity.tutanotaunencrypted.Mail.PATH, this.getId()[1], this.getId()[0], map, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Loads information about all versions of this Mail from the server.
 * @return {Promise.<tutao.entity.sys.VersionReturn>} Resolves to an tutao.entity.sys.VersionReturn or an exception if the loading failed.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.loadVersionInfo = function() {
  var versionData = new tutao.entity.sys.VersionData()
    .setApplication("tutanotaunencrypted")
    .setType(32)
    .setId(this.getId()[1]);
  versionData.setListId(this.getId()[0]);
  return tutao.entity.sys.VersionReturn.load(versionData, {}, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Loads multiple Mails from the server.
 * @param {Array.<Array.<string>>} ids The ids of the Mails to load.
 * @return {Promise.<Array.<tutao.entity.tutanotaunencrypted.Mail>>} Resolves to an array of Mail or rejects with an exception if the loading failed.
 */
tutao.entity.tutanotaunencrypted.Mail.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanotaunencrypted.Mail, tutao.entity.tutanotaunencrypted.Mail.PATH, ids, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Stores Mail on the server and updates this instance with _id and _permission values generated on the server.
 * @param {string} listId The list id of the Mail.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.setup = function(listId) {
  var self = this;
  self._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postElement(tutao.entity.tutanotaunencrypted.Mail.PATH, self, listId, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
      self.__id = [listId, entity.getGeneratedId()];
      self.setPermissions(entity.getPermissionListId());
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 1;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanotaunencrypted.Mail.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this Mail on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanotaunencrypted.Mail.PATH, this, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this Mail on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanotaunencrypted.Mail.PATH, this.__id[1], this.__id[0], {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Creates a new Mail list on the server.
 * @param {tutao.entity.BucketData} bucketData The bucket data for which the share permission on the list shall be created.
 * @return {Promise.<string=>} Resolves to the id of the new tutao.entity.tutanotaunencrypted.Mail list or rejects with an exception if the createList failed.
 */
tutao.entity.tutanotaunencrypted.Mail.createList = function(bucketData) {
  var params = tutao.entity.EntityHelper.createPostListPermissionMap(bucketData, false);
  params["v"] = 1;
  return tutao.locator.entityRestClient.postList(tutao.entity.tutanotaunencrypted.Mail.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(returnEntity) {
    return returnEntity.getGeneratedId();
  });
};

/**
 * Provides a  list of Mails loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.tutanotaunencrypted.Mail>>} Resolves to an array of Mail or rejects with an exception if the loading failed.
 */
tutao.entity.tutanotaunencrypted.Mail.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanotaunencrypted.Mail, tutao.entity.tutanotaunencrypted.Mail.PATH, listId, start, count, reverse, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanotaunencrypted.Mail.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
