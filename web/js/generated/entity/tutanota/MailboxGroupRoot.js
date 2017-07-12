"use strict";

tutao.provide('tutao.entity.tutanota.MailboxGroupRoot');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailboxGroupRoot = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._contactFormUserContactForm = null;
    this._mailbox = null;
    this._serverProperties = null;
    this._targetMailGroupContactForm = null;
    this._whitelistRequests = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.MailboxGroupRoot.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._contactFormUserContactForm = data.contactFormUserContactForm;
  this._mailbox = data.mailbox;
  this._serverProperties = data.serverProperties;
  this._targetMailGroupContactForm = data.targetMailGroupContactForm;
  this._whitelistRequests = data.whitelistRequests;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.MailboxGroupRoot.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.MailboxGroupRoot.PATH = '/rest/tutanota/mailboxgrouproot';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.MailboxGroupRoot.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAAK1';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.MailboxGroupRoot.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    contactFormUserContactForm: this._contactFormUserContactForm, 
    mailbox: this._mailbox, 
    serverProperties: this._serverProperties, 
    targetMailGroupContactForm: this._targetMailGroupContactForm, 
    whitelistRequests: this._whitelistRequests
  };
};

/**
 * Provides the id of this MailboxGroupRoot.
 * @return {string} The id of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this MailboxGroupRoot.
 * @param {string} format The format of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MailboxGroupRoot.
 * @return {string} The format of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this MailboxGroupRoot.
 * @param {string} ownerGroup The ownerGroup of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this MailboxGroupRoot.
 * @return {string} The ownerGroup of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this MailboxGroupRoot.
 * @param {string} permissions The permissions of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this MailboxGroupRoot.
 * @return {string} The permissions of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the contactFormUserContactForm of this MailboxGroupRoot.
 * @param {Array.<string>} contactFormUserContactForm The contactFormUserContactForm of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.setContactFormUserContactForm = function(contactFormUserContactForm) {
  this._contactFormUserContactForm = contactFormUserContactForm;
  return this;
};

/**
 * Provides the contactFormUserContactForm of this MailboxGroupRoot.
 * @return {Array.<string>} The contactFormUserContactForm of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.getContactFormUserContactForm = function() {
  return this._contactFormUserContactForm;
};

/**
 * Loads the contactFormUserContactForm of this MailboxGroupRoot.
 * @return {Promise.<tutao.entity.tutanota.ContactForm>} Resolves to the loaded contactFormUserContactForm of this MailboxGroupRoot or an exception if the loading failed.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.loadContactFormUserContactForm = function() {
  return tutao.entity.tutanota.ContactForm.load(this._contactFormUserContactForm);
};

/**
 * Sets the mailbox of this MailboxGroupRoot.
 * @param {string} mailbox The mailbox of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.setMailbox = function(mailbox) {
  this._mailbox = mailbox;
  return this;
};

/**
 * Provides the mailbox of this MailboxGroupRoot.
 * @return {string} The mailbox of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.getMailbox = function() {
  return this._mailbox;
};

/**
 * Loads the mailbox of this MailboxGroupRoot.
 * @return {Promise.<tutao.entity.tutanota.MailBox>} Resolves to the loaded mailbox of this MailboxGroupRoot or an exception if the loading failed.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.loadMailbox = function() {
  return tutao.entity.tutanota.MailBox.load(this._mailbox);
};

/**
 * Sets the serverProperties of this MailboxGroupRoot.
 * @param {string} serverProperties The serverProperties of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.setServerProperties = function(serverProperties) {
  this._serverProperties = serverProperties;
  return this;
};

/**
 * Provides the serverProperties of this MailboxGroupRoot.
 * @return {string} The serverProperties of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.getServerProperties = function() {
  return this._serverProperties;
};

/**
 * Loads the serverProperties of this MailboxGroupRoot.
 * @return {Promise.<tutao.entity.tutanota.MailboxServerProperties>} Resolves to the loaded serverProperties of this MailboxGroupRoot or an exception if the loading failed.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.loadServerProperties = function() {
  return tutao.entity.tutanota.MailboxServerProperties.load(this._serverProperties);
};

/**
 * Sets the targetMailGroupContactForm of this MailboxGroupRoot.
 * @param {Array.<string>} targetMailGroupContactForm The targetMailGroupContactForm of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.setTargetMailGroupContactForm = function(targetMailGroupContactForm) {
  this._targetMailGroupContactForm = targetMailGroupContactForm;
  return this;
};

/**
 * Provides the targetMailGroupContactForm of this MailboxGroupRoot.
 * @return {Array.<string>} The targetMailGroupContactForm of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.getTargetMailGroupContactForm = function() {
  return this._targetMailGroupContactForm;
};

/**
 * Loads the targetMailGroupContactForm of this MailboxGroupRoot.
 * @return {Promise.<tutao.entity.tutanota.ContactForm>} Resolves to the loaded targetMailGroupContactForm of this MailboxGroupRoot or an exception if the loading failed.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.loadTargetMailGroupContactForm = function() {
  return tutao.entity.tutanota.ContactForm.load(this._targetMailGroupContactForm);
};

/**
 * Sets the whitelistRequests of this MailboxGroupRoot.
 * @param {string} whitelistRequests The whitelistRequests of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.setWhitelistRequests = function(whitelistRequests) {
  this._whitelistRequests = whitelistRequests;
  return this;
};

/**
 * Provides the whitelistRequests of this MailboxGroupRoot.
 * @return {string} The whitelistRequests of this MailboxGroupRoot.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.getWhitelistRequests = function() {
  return this._whitelistRequests;
};

/**
 * Loads a MailboxGroupRoot from the server.
 * @param {string} id The id of the MailboxGroupRoot.
 * @return {Promise.<tutao.entity.tutanota.MailboxGroupRoot>} Resolves to the MailboxGroupRoot or an exception if the loading failed.
 */
tutao.entity.tutanota.MailboxGroupRoot.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.MailboxGroupRoot, tutao.entity.tutanota.MailboxGroupRoot.PATH, id, null, {"v" : "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple MailboxGroupRoots from the server.
 * @param {Array.<string>} ids The ids of the MailboxGroupRoots to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.MailboxGroupRoot>>} Resolves to an array of MailboxGroupRoot or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.MailboxGroupRoot.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.MailboxGroupRoot, tutao.entity.tutanota.MailboxGroupRoot.PATH, ids, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this MailboxGroupRoot on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.MailboxGroupRoot.PATH, this, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.MailboxGroupRoot.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
