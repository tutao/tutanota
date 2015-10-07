"use strict";

tutao.provide('tutao.entity.tutanota.ConversationEntry');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ConversationEntry = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._conversationType = null;
    this._messageId = null;
    this._mail = null;
    this._previous = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.ConversationEntry.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ConversationEntry.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._conversationType = data.conversationType;
  this._messageId = data.messageId;
  this._mail = data.mail;
  this._previous = data.previous;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.ConversationEntry.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.ConversationEntry.PATH = '/rest/tutanota/conversationentry';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.ConversationEntry.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAFQ';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.ConversationEntry.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.ConversationEntry.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ConversationEntry.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    conversationType: this._conversationType, 
    messageId: this._messageId, 
    mail: this._mail, 
    previous: this._previous
  };
};

/**
 * The id of the ConversationEntry type.
 */
tutao.entity.tutanota.ConversationEntry.prototype.TYPE_ID = 84;

/**
 * The id of the conversationType attribute.
 */
tutao.entity.tutanota.ConversationEntry.prototype.CONVERSATIONTYPE_ATTRIBUTE_ID = 122;

/**
 * The id of the messageId attribute.
 */
tutao.entity.tutanota.ConversationEntry.prototype.MESSAGEID_ATTRIBUTE_ID = 121;

/**
 * The id of the mail attribute.
 */
tutao.entity.tutanota.ConversationEntry.prototype.MAIL_ATTRIBUTE_ID = 124;

/**
 * The id of the previous attribute.
 */
tutao.entity.tutanota.ConversationEntry.prototype.PREVIOUS_ATTRIBUTE_ID = 123;

/**
 * Provides the id of this ConversationEntry.
 * @return {Array.<string>} The id of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this ConversationEntry.
 * @param {string} format The format of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ConversationEntry.
 * @return {string} The format of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this ConversationEntry.
 * @param {string} permissions The permissions of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this ConversationEntry.
 * @return {string} The permissions of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the conversationType of this ConversationEntry.
 * @param {string} conversationType The conversationType of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.setConversationType = function(conversationType) {
  this._conversationType = conversationType;
  return this;
};

/**
 * Provides the conversationType of this ConversationEntry.
 * @return {string} The conversationType of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.getConversationType = function() {
  return this._conversationType;
};

/**
 * Sets the messageId of this ConversationEntry.
 * @param {string} messageId The messageId of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.setMessageId = function(messageId) {
  this._messageId = messageId;
  return this;
};

/**
 * Provides the messageId of this ConversationEntry.
 * @return {string} The messageId of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.getMessageId = function() {
  return this._messageId;
};

/**
 * Sets the mail of this ConversationEntry.
 * @param {Array.<string>} mail The mail of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.setMail = function(mail) {
  this._mail = mail;
  return this;
};

/**
 * Provides the mail of this ConversationEntry.
 * @return {Array.<string>} The mail of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.getMail = function() {
  return this._mail;
};

/**
 * Loads the mail of this ConversationEntry.
 * @return {Promise.<tutao.entity.tutanota.Mail>} Resolves to the loaded mail of this ConversationEntry or an exception if the loading failed.
 */
tutao.entity.tutanota.ConversationEntry.prototype.loadMail = function() {
  return tutao.entity.tutanota.Mail.load(this._mail);
};

/**
 * Sets the previous of this ConversationEntry.
 * @param {Array.<string>} previous The previous of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.setPrevious = function(previous) {
  this._previous = previous;
  return this;
};

/**
 * Provides the previous of this ConversationEntry.
 * @return {Array.<string>} The previous of this ConversationEntry.
 */
tutao.entity.tutanota.ConversationEntry.prototype.getPrevious = function() {
  return this._previous;
};

/**
 * Loads the previous of this ConversationEntry.
 * @return {Promise.<tutao.entity.tutanota.ConversationEntry>} Resolves to the loaded previous of this ConversationEntry or an exception if the loading failed.
 */
tutao.entity.tutanota.ConversationEntry.prototype.loadPrevious = function() {
  return tutao.entity.tutanota.ConversationEntry.load(this._previous);
};

/**
 * Loads a ConversationEntry from the server.
 * @param {Array.<string>} id The id of the ConversationEntry.
 * @return {Promise.<tutao.entity.tutanota.ConversationEntry>} Resolves to the ConversationEntry or an exception if the loading failed.
 */
tutao.entity.tutanota.ConversationEntry.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.ConversationEntry, tutao.entity.tutanota.ConversationEntry.PATH, id[1], id[0], {"v" : 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple ConversationEntrys from the server.
 * @param {Array.<Array.<string>>} ids The ids of the ConversationEntrys to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.ConversationEntry>>} Resolves to an array of ConversationEntry or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.ConversationEntry.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.ConversationEntry, tutao.entity.tutanota.ConversationEntry.PATH, ids, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.ConversationEntry.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 9;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.ConversationEntry.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Provides a  list of ConversationEntrys loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.tutanota.ConversationEntry>>} Resolves to an array of ConversationEntry or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.ConversationEntry.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.ConversationEntry, tutao.entity.tutanota.ConversationEntry.PATH, listId, start, count, reverse, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.ConversationEntry.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.ConversationEntry.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ConversationEntry.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
