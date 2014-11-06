"use strict";

tutao.provide('tutao.entity.tutanota.TutanotaProperties');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.TutanotaProperties = function(data) {
  if (data) {
    this.__format = data._format;
    this.__id = data._id;
    this.__permissions = data._permissions;
    this._groupEncEntropy = data.groupEncEntropy;
    this._notificationMailLanguage = data.notificationMailLanguage;
    this._imapSyncConfig = [];
    for (var i=0; i < data.imapSyncConfig.length; i++) {
      this._imapSyncConfig.push(new tutao.entity.tutanota.ImapSyncConfiguration(this, data.imapSyncConfig[i]));
    }
    this._lastPushedMail = data.lastPushedMail;
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._groupEncEntropy = null;
    this._notificationMailLanguage = null;
    this._imapSyncConfig = [];
    this._lastPushedMail = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.TutanotaProperties.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.TutanotaProperties.MODEL_VERSION = '6';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.TutanotaProperties.PATH = '/rest/tutanota/tutanotaproperties';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.TutanotaProperties.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAADY';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.TutanotaProperties.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.TutanotaProperties.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    groupEncEntropy: this._groupEncEntropy, 
    notificationMailLanguage: this._notificationMailLanguage, 
    imapSyncConfig: tutao.entity.EntityHelper.aggregatesToJsonData(this._imapSyncConfig), 
    lastPushedMail: this._lastPushedMail
  };
};

/**
 * The id of the TutanotaProperties type.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.TYPE_ID = 216;

/**
 * The id of the groupEncEntropy attribute.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.GROUPENCENTROPY_ATTRIBUTE_ID = 410;

/**
 * The id of the notificationMailLanguage attribute.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.NOTIFICATIONMAILLANGUAGE_ATTRIBUTE_ID = 418;

/**
 * The id of the imapSyncConfig attribute.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.IMAPSYNCCONFIG_ATTRIBUTE_ID = 222;

/**
 * The id of the lastPushedMail attribute.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.LASTPUSHEDMAIL_ATTRIBUTE_ID = 221;

/**
 * Provides the id of this TutanotaProperties.
 * @return {string} The id of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this TutanotaProperties.
 * @param {string} format The format of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this TutanotaProperties.
 * @return {string} The format of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this TutanotaProperties.
 * @param {string} permissions The permissions of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this TutanotaProperties.
 * @return {string} The permissions of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the groupEncEntropy of this TutanotaProperties.
 * @param {string} groupEncEntropy The groupEncEntropy of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setGroupEncEntropy = function(groupEncEntropy) {
  this._groupEncEntropy = groupEncEntropy;
  return this;
};

/**
 * Provides the groupEncEntropy of this TutanotaProperties.
 * @return {string} The groupEncEntropy of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getGroupEncEntropy = function() {
  return this._groupEncEntropy;
};

/**
 * Sets the notificationMailLanguage of this TutanotaProperties.
 * @param {string} notificationMailLanguage The notificationMailLanguage of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setNotificationMailLanguage = function(notificationMailLanguage) {
  this._notificationMailLanguage = notificationMailLanguage;
  return this;
};

/**
 * Provides the notificationMailLanguage of this TutanotaProperties.
 * @return {string} The notificationMailLanguage of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getNotificationMailLanguage = function() {
  return this._notificationMailLanguage;
};

/**
 * Provides the imapSyncConfig of this TutanotaProperties.
 * @return {Array.<tutao.entity.tutanota.ImapSyncConfiguration>} The imapSyncConfig of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getImapSyncConfig = function() {
  return this._imapSyncConfig;
};

/**
 * Sets the lastPushedMail of this TutanotaProperties.
 * @param {Array.<string>} lastPushedMail The lastPushedMail of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setLastPushedMail = function(lastPushedMail) {
  this._lastPushedMail = lastPushedMail;
  return this;
};

/**
 * Provides the lastPushedMail of this TutanotaProperties.
 * @return {Array.<string>} The lastPushedMail of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getLastPushedMail = function() {
  return this._lastPushedMail;
};

/**
 * Loads the lastPushedMail of this TutanotaProperties.
 * @return {Promise.<tutao.entity.tutanota.Mail>} Resolves to the loaded lastPushedMail of this TutanotaProperties or an exception if the loading failed.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.loadLastPushedMail = function() {
  return tutao.entity.tutanota.Mail.load(this._lastPushedMail);
};

/**
 * Loads a TutanotaProperties from the server.
 * @param {string} id The id of the TutanotaProperties.
 * @return {Promise.<tutao.entity.tutanota.TutanotaProperties>} Resolves to the TutanotaProperties or an exception if the loading failed.
 */
tutao.entity.tutanota.TutanotaProperties.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.TutanotaProperties, tutao.entity.tutanota.TutanotaProperties.PATH, id, null, {"v" : 6}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple TutanotaPropertiess from the server.
 * @param {Array.<string>} ids The ids of the TutanotaPropertiess to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.TutanotaProperties>>} Resolves to an array of TutanotaProperties or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.TutanotaProperties.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.TutanotaProperties, tutao.entity.tutanota.TutanotaProperties.PATH, ids, {"v": 6}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this TutanotaProperties on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.TutanotaProperties.PATH, this, {"v": 6}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
