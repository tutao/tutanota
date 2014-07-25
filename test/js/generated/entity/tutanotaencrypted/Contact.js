"use strict";

goog.provide('tutao.entity.tutanotaencrypted.Contact');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaencrypted.Contact = function(data) {
  if (data) {
    this.__area = data._area;
    this.__format = data._format;
    this.__id = data._id;
    this.__owner = data._owner;
    this.__permissions = data._permissions;
    this._birthday = data.birthday;
    this._mail = data.mail;
    this._name = data.name;
    this._userid = data.userid;
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__owner = null;
    this.__permissions = null;
    this._birthday = null;
    this._mail = null;
    this._name = null;
    this._userid = null;
  };
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanotaencrypted.Contact.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanotaencrypted.Contact.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanotaencrypted.Contact.PATH = '/rest/tutanotaencrypted/contact';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanotaencrypted.Contact.ROOT_INSTANCE_ID = 'EXR1dGFub3RhZW5jcnlwdGVkABA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanotaencrypted.Contact.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanotaencrypted.Contact.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _owner: this.__owner, 
    _permissions: this.__permissions, 
    birthday: this._birthday, 
    mail: this._mail, 
    name: this._name, 
    userid: this._userid
  };
};

/**
 * The id of the Contact type.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.TYPE_ID = 16;

/**
 * The id of the _area attribute.
 */
tutao.entity.tutanotaencrypted.Contact.prototype._AREA_ATTRIBUTE_ID = 22;

/**
 * The id of the _owner attribute.
 */
tutao.entity.tutanotaencrypted.Contact.prototype._OWNER_ATTRIBUTE_ID = 21;

/**
 * The id of the birthday attribute.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.BIRTHDAY_ATTRIBUTE_ID = 25;

/**
 * The id of the mail attribute.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.MAIL_ATTRIBUTE_ID = 24;

/**
 * The id of the name attribute.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.NAME_ATTRIBUTE_ID = 23;

/**
 * The id of the userid attribute.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.USERID_ATTRIBUTE_ID = 26;

/**
 * Provides the id of this Contact.
 * @return {string} The id of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this Contact.
 * @param {string} area The area of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this Contact.
 * @return {string} The area of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this Contact.
 * @param {string} format The format of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Contact.
 * @return {string} The format of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this Contact.
 * @param {string} owner The owner of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this Contact.
 * @return {string} The owner of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the permissions of this Contact.
 * @param {string} permissions The permissions of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Contact.
 * @return {string} The permissions of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the birthday of this Contact.
 * @param {Date} birthday The birthday of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.setBirthday = function(birthday) {
  var dataToEncrypt = String(birthday.getTime());
  this._birthday = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the birthday of this Contact.
 * @return {Date} The birthday of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.getBirthday = function() {
  if (this._birthday == "") {
    return new Date(0);
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._birthday);
  if (isNaN(value)) {
    throw new tutao.entity.tutao.InvalidDataError('invalid time data: ' + value);
  }
  return new Date(Number(value));
};

/**
 * Sets the mail of this Contact.
 * @param {string} mail The mail of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.setMail = function(mail) {
  var dataToEncrypt = mail;
  this._mail = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the mail of this Contact.
 * @return {string} The mail of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.getMail = function() {
  if (this._mail == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._mail);
  return value;
};

/**
 * Sets the name of this Contact.
 * @param {string} name The name of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.setName = function(name) {
  var dataToEncrypt = name;
  this._name = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the name of this Contact.
 * @return {string} The name of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.getName = function() {
  if (this._name == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._name);
  return value;
};

/**
 * Sets the userid of this Contact.
 * @param {string} userid The userid of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.setUserid = function(userid) {
  var dataToEncrypt = userid;
  this._userid = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the userid of this Contact.
 * @return {string} The userid of this Contact.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.getUserid = function() {
  if (this._userid == "") {
    return "0";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._userid);
  return value;
};

/**
 * Loads a Contact from the server.
 * @param {string} id The id of the Contact.
 * @return {Promise.<tutao.entity.tutanotaencrypted.Contact>} Resolves to the Contact or an exception if the loading failed.
 */
tutao.entity.tutanotaencrypted.Contact.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanotaencrypted.Contact, tutao.entity.tutanotaencrypted.Contact.PATH, id, null, {"v" : 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple Contacts from the server.
 * @param {Array.<string>} ids The ids of the Contacts to load.
 * @return {Promise.<Array.<tutao.entity.tutanotaencrypted.Contact>>} Resolves to an array of Contact or rejects with an exception if the loading failed.
 */
tutao.entity.tutanotaencrypted.Contact.loadMultiple = function(ids) {
  tutao.locator.entityRestClient.getElements(tutao.entity.tutanotaencrypted.Contact, tutao.entity.tutanotaencrypted.Contact.PATH, ids, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders(), function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Stores this Contact on the server and updates this instance with _id and _permission values generated on the server.
 * @param {tutao.entity.BucketData} bucketData The bucket data for which the share permission on instance shall be created.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.setup = function(bucketData) {
  var self = this;
  var params = this._entityHelper.createPostPermissionMap(bucketData)
  params["v"] = 1
  return tutao.locator.entityRestClient.postElement(tutao.entity.tutanotaencrypted.Contact.PATH, this, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = entity.getGeneratedId();
    self.setPermissions(entity.getPermissionListId());
    self._entityHelper.notifyObservers(false);
  })
};

/**
 * Updates this Contact on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanotaencrypted.Contact.PATH, this, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this Contact on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanotaencrypted.Contact.PATH, this.__id, null, {"v": 1}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanotaencrypted.Contact.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
