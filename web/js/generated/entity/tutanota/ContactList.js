"use strict";

tutao.provide('tutao.entity.tutanota.ContactList');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactList = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._shareBucketId = null;
    this._symEncShareBucketKey = null;
    this._contacts = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.ContactList.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactList.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._shareBucketId = data.shareBucketId;
  this._symEncShareBucketKey = data.symEncShareBucketKey;
  this._contacts = data.contacts;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.ContactList.MODEL_VERSION = '11';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.ContactList.PATH = '/rest/tutanota/contactlist';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.ContactList.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAACZ';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.ContactList.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.ContactList.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactList.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    shareBucketId: this._shareBucketId, 
    symEncShareBucketKey: this._symEncShareBucketKey, 
    contacts: this._contacts
  };
};

/**
 * The id of the ContactList type.
 */
tutao.entity.tutanota.ContactList.prototype.TYPE_ID = 153;

/**
 * The id of the shareBucketId attribute.
 */
tutao.entity.tutanota.ContactList.prototype.SHAREBUCKETID_ATTRIBUTE_ID = 158;

/**
 * The id of the symEncShareBucketKey attribute.
 */
tutao.entity.tutanota.ContactList.prototype.SYMENCSHAREBUCKETKEY_ATTRIBUTE_ID = 159;

/**
 * The id of the contacts attribute.
 */
tutao.entity.tutanota.ContactList.prototype.CONTACTS_ATTRIBUTE_ID = 160;

/**
 * Provides the id of this ContactList.
 * @return {string} The id of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this ContactList.
 * @param {string} format The format of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ContactList.
 * @return {string} The format of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this ContactList.
 * @param {string} permissions The permissions of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this ContactList.
 * @return {string} The permissions of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the shareBucketId of this ContactList.
 * @param {string} shareBucketId The shareBucketId of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.setShareBucketId = function(shareBucketId) {
  this._shareBucketId = shareBucketId;
  return this;
};

/**
 * Provides the shareBucketId of this ContactList.
 * @return {string} The shareBucketId of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getShareBucketId = function() {
  return this._shareBucketId;
};

/**
 * Sets the symEncShareBucketKey of this ContactList.
 * @param {string} symEncShareBucketKey The symEncShareBucketKey of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.setSymEncShareBucketKey = function(symEncShareBucketKey) {
  this._symEncShareBucketKey = symEncShareBucketKey;
  return this;
};

/**
 * Provides the symEncShareBucketKey of this ContactList.
 * @return {string} The symEncShareBucketKey of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getSymEncShareBucketKey = function() {
  return this._symEncShareBucketKey;
};

/**
 * Sets the contacts of this ContactList.
 * @param {string} contacts The contacts of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.setContacts = function(contacts) {
  this._contacts = contacts;
  return this;
};

/**
 * Provides the contacts of this ContactList.
 * @return {string} The contacts of this ContactList.
 */
tutao.entity.tutanota.ContactList.prototype.getContacts = function() {
  return this._contacts;
};

/**
 * Loads a ContactList from the server.
 * @param {string} id The id of the ContactList.
 * @return {Promise.<tutao.entity.tutanota.ContactList>} Resolves to the ContactList or an exception if the loading failed.
 */
tutao.entity.tutanota.ContactList.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.ContactList, tutao.entity.tutanota.ContactList.PATH, id, null, {"v" : 11}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple ContactLists from the server.
 * @param {Array.<string>} ids The ids of the ContactLists to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.ContactList>>} Resolves to an array of ContactList or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.ContactList.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.ContactList, tutao.entity.tutanota.ContactList.PATH, ids, {"v": 11}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.ContactList.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.ContactList.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ContactList.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
