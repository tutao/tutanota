"use strict";

tutao.provide('tutao.entity.tutanota.TutanotaProperties');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.TutanotaProperties = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._customEmailSignature = null;
    this._customEmailSignature_ = null;
    this._defaultSender = null;
    this._defaultUnconfidential = null;
    this._emailSignatureType = null;
    this._groupEncEntropy = null;
    this._noAutomaticContacts = null;
    this._noAutomaticContacts_ = null;
    this._notificationMailLanguage = null;
    this._imapSyncConfig = [];
    this._inboxRules = [];
    this._lastPushedMail = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.TutanotaProperties.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._customEmailSignature = data.customEmailSignature;
  this._customEmailSignature_ = null;
  this._defaultSender = data.defaultSender;
  this._defaultUnconfidential = data.defaultUnconfidential;
  this._emailSignatureType = data.emailSignatureType;
  this._groupEncEntropy = data.groupEncEntropy;
  this._noAutomaticContacts = data.noAutomaticContacts;
  this._noAutomaticContacts_ = null;
  this._notificationMailLanguage = data.notificationMailLanguage;
  this._imapSyncConfig = [];
  for (var i=0; i < data.imapSyncConfig.length; i++) {
    this._imapSyncConfig.push(new tutao.entity.tutanota.ImapSyncConfiguration(this, data.imapSyncConfig[i]));
  }
  this._inboxRules = [];
  for (var i=0; i < data.inboxRules.length; i++) {
    this._inboxRules.push(new tutao.entity.tutanota.InboxRule(this, data.inboxRules[i]));
  }
  this._lastPushedMail = data.lastPushedMail;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.TutanotaProperties.MODEL_VERSION = '13';

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
tutao.entity.tutanota.TutanotaProperties.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    customEmailSignature: this._customEmailSignature, 
    defaultSender: this._defaultSender, 
    defaultUnconfidential: this._defaultUnconfidential, 
    emailSignatureType: this._emailSignatureType, 
    groupEncEntropy: this._groupEncEntropy, 
    noAutomaticContacts: this._noAutomaticContacts, 
    notificationMailLanguage: this._notificationMailLanguage, 
    imapSyncConfig: tutao.entity.EntityHelper.aggregatesToJsonData(this._imapSyncConfig), 
    inboxRules: tutao.entity.EntityHelper.aggregatesToJsonData(this._inboxRules), 
    lastPushedMail: this._lastPushedMail
  };
};

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
 * Sets the ownerEncSessionKey of this TutanotaProperties.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this TutanotaProperties.
 * @return {string} The ownerEncSessionKey of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this TutanotaProperties.
 * @param {string} ownerGroup The ownerGroup of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this TutanotaProperties.
 * @return {string} The ownerGroup of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
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
 * Sets the customEmailSignature of this TutanotaProperties.
 * @param {string} customEmailSignature The customEmailSignature of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setCustomEmailSignature = function(customEmailSignature) {
  var dataToEncrypt = customEmailSignature;
  this._customEmailSignature = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._customEmailSignature_ = customEmailSignature;
  return this;
};

/**
 * Provides the customEmailSignature of this TutanotaProperties.
 * @return {string} The customEmailSignature of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getCustomEmailSignature = function() {
  if (this._customEmailSignature_ != null) {
    return this._customEmailSignature_;
  }
  if (this._customEmailSignature == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._customEmailSignature);
    this._customEmailSignature_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the defaultSender of this TutanotaProperties.
 * @param {string} defaultSender The defaultSender of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setDefaultSender = function(defaultSender) {
  this._defaultSender = defaultSender;
  return this;
};

/**
 * Provides the defaultSender of this TutanotaProperties.
 * @return {string} The defaultSender of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getDefaultSender = function() {
  return this._defaultSender;
};

/**
 * Sets the defaultUnconfidential of this TutanotaProperties.
 * @param {boolean} defaultUnconfidential The defaultUnconfidential of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setDefaultUnconfidential = function(defaultUnconfidential) {
  this._defaultUnconfidential = defaultUnconfidential ? '1' : '0';
  return this;
};

/**
 * Provides the defaultUnconfidential of this TutanotaProperties.
 * @return {boolean} The defaultUnconfidential of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getDefaultUnconfidential = function() {
  return this._defaultUnconfidential != '0';
};

/**
 * Sets the emailSignatureType of this TutanotaProperties.
 * @param {string} emailSignatureType The emailSignatureType of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setEmailSignatureType = function(emailSignatureType) {
  this._emailSignatureType = emailSignatureType;
  return this;
};

/**
 * Provides the emailSignatureType of this TutanotaProperties.
 * @return {string} The emailSignatureType of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getEmailSignatureType = function() {
  return this._emailSignatureType;
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
 * Sets the noAutomaticContacts of this TutanotaProperties.
 * @param {boolean} noAutomaticContacts The noAutomaticContacts of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.setNoAutomaticContacts = function(noAutomaticContacts) {
  var dataToEncrypt = (noAutomaticContacts) ? '1' : '0';
  this._noAutomaticContacts = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._noAutomaticContacts_ = noAutomaticContacts;
  return this;
};

/**
 * Provides the noAutomaticContacts of this TutanotaProperties.
 * @return {boolean} The noAutomaticContacts of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getNoAutomaticContacts = function() {
  if (this._noAutomaticContacts_ != null) {
    return this._noAutomaticContacts_;
  }
  if (this._noAutomaticContacts == "" || !this._entityHelper.getSessionKey()) {
    return false;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._noAutomaticContacts);
    this._noAutomaticContacts_ = (value != '0');
    return this._noAutomaticContacts_;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return false;
    } else {
      throw e;
    }
  }
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
 * Provides the inboxRules of this TutanotaProperties.
 * @return {Array.<tutao.entity.tutanota.InboxRule>} The inboxRules of this TutanotaProperties.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getInboxRules = function() {
  return this._inboxRules;
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
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.TutanotaProperties, tutao.entity.tutanota.TutanotaProperties.PATH, id, null, {"v" : "13"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple TutanotaPropertiess from the server.
 * @param {Array.<string>} ids The ids of the TutanotaPropertiess to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.TutanotaProperties>>} Resolves to an array of TutanotaProperties or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.TutanotaProperties.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.TutanotaProperties, tutao.entity.tutanota.TutanotaProperties.PATH, ids, {"v": "13"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "13";
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.TutanotaProperties.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this TutanotaProperties on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.TutanotaProperties.PATH, this, {"v": "13"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
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
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.TutanotaProperties.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
