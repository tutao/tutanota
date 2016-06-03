"use strict";

tutao.provide('tutao.entity.tutanotaunencrypted.Contact');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaunencrypted.Contact = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__owner = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._birthday = null;
    this._mail = null;
    this._name = null;
    this._userid = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanotaunencrypted.Contact.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.updateData = function(data) {
  this.__area = data._area;
  this.__format = data._format;
  this.__id = data._id;
  this.__owner = data._owner;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._birthday = data.birthday;
  this._mail = data.mail;
  this._name = data.name;
  this._userid = data.userid;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanotaunencrypted.Contact.MODEL_VERSION = '1';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanotaunencrypted.Contact.PATH = '/rest/tutanotaunencrypted/contact';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanotaunencrypted.Contact.ROOT_INSTANCE_ID = 'E3R1dGFub3RhdW5lbmNyeXB0ZWQAEg';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanotaunencrypted.Contact.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _owner: this.__owner, 
    _ownerGroup: this.__ownerGroup, 
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
tutao.entity.tutanotaunencrypted.Contact.prototype.TYPE_ID = 18;

/**
 * The id of the _area attribute.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype._AREA_ATTRIBUTE_ID = 25;

/**
 * The id of the _owner attribute.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype._OWNER_ATTRIBUTE_ID = 24;

/**
 * The id of the _ownerGroup attribute.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype._OWNERGROUP_ATTRIBUTE_ID = 23;

/**
 * The id of the birthday attribute.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.BIRTHDAY_ATTRIBUTE_ID = 28;

/**
 * The id of the mail attribute.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.MAIL_ATTRIBUTE_ID = 27;

/**
 * The id of the name attribute.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.NAME_ATTRIBUTE_ID = 26;

/**
 * The id of the userid attribute.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.USERID_ATTRIBUTE_ID = 29;

/**
 * Provides the id of this Contact.
 * @return {string} The id of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this Contact.
 * @param {string} area The area of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this Contact.
 * @return {string} The area of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this Contact.
 * @param {string} format The format of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Contact.
 * @return {string} The format of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this Contact.
 * @param {string} owner The owner of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this Contact.
 * @return {string} The owner of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the ownerGroup of this Contact.
 * @param {string} ownerGroup The ownerGroup of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this Contact.
 * @return {string} The ownerGroup of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this Contact.
 * @param {string} permissions The permissions of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Contact.
 * @return {string} The permissions of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the birthday of this Contact.
 * @param {Date} birthday The birthday of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.setBirthday = function(birthday) {
  this._birthday = String(birthday.getTime());
  return this;
};

/**
 * Provides the birthday of this Contact.
 * @return {Date} The birthday of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.getBirthday = function() {
  if (isNaN(this._birthday)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._birthday);
  }
  return new Date(Number(this._birthday));
};

/**
 * Sets the mail of this Contact.
 * @param {string} mail The mail of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.setMail = function(mail) {
  this._mail = mail;
  return this;
};

/**
 * Provides the mail of this Contact.
 * @return {string} The mail of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.getMail = function() {
  return this._mail;
};

/**
 * Sets the name of this Contact.
 * @param {string} name The name of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.setName = function(name) {
  this._name = name;
  return this;
};

/**
 * Provides the name of this Contact.
 * @return {string} The name of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.getName = function() {
  return this._name;
};

/**
 * Sets the userid of this Contact.
 * @param {string} userid The userid of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.setUserid = function(userid) {
  this._userid = userid;
  return this;
};

/**
 * Provides the userid of this Contact.
 * @return {string} The userid of this Contact.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.getUserid = function() {
  return this._userid;
};

/**
 * Loads a Contact from the server.
 * @param {string} id The id of the Contact.
 * @return {Promise.<tutao.entity.tutanotaunencrypted.Contact>} Resolves to the Contact or an exception if the loading failed.
 */
tutao.entity.tutanotaunencrypted.Contact.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanotaunencrypted.Contact, tutao.entity.tutanotaunencrypted.Contact.PATH, id, null, {"v" : "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple Contacts from the server.
 * @param {Array.<string>} ids The ids of the Contacts to load.
 * @return {Promise.<Array.<tutao.entity.tutanotaunencrypted.Contact>>} Resolves to an array of Contact or rejects with an exception if the loading failed.
 */
tutao.entity.tutanotaunencrypted.Contact.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanotaunencrypted.Contact, tutao.entity.tutanotaunencrypted.Contact.PATH, ids, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Stores this Contact on the server and updates this instance with _id and _permission values generated on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.setup = function() {
  var self = this;
  var params = { "v" : "1" };
  return tutao.locator.entityRestClient.postElement(tutao.entity.tutanotaunencrypted.Contact.PATH, this, null, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.__id = entity.getGeneratedId();
    self.setPermissions(entity.getPermissionListId());
    self._entityHelper.notifyObservers(false);
  })
};

/**
 * Updates this Contact on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanotaunencrypted.Contact.PATH, this, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this Contact on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanotaunencrypted.Contact.PATH, this.__id, null, {"v": "1"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanotaunencrypted.Contact.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
