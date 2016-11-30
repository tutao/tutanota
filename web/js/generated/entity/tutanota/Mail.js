"use strict";

tutao.provide('tutao.entity.tutanota.Mail');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Mail = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__owner = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._confidential = null;
    this._confidential_ = null;
    this._differentEnvelopeSender = null;
    this._differentEnvelopeSender_ = null;
    this._receivedDate = null;
    this._replyType = null;
    this._replyType_ = null;
    this._sentDate = null;
    this._state = null;
    this._subject = null;
    this._subject_ = null;
    this._trashed = null;
    this._unread = null;
    this._attachments = [];
    this._bccRecipients = [];
    this._body = null;
    this._ccRecipients = [];
    this._conversationEntry = null;
    this._headers = null;
    this._replyTos = [];
    this._sender = null;
    this._toRecipients = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.Mail.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Mail.prototype.updateData = function(data) {
  this.__area = data._area;
  this.__format = data._format;
  this.__id = data._id;
  this.__owner = data._owner;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._confidential = data.confidential;
  this._confidential_ = null;
  this._differentEnvelopeSender = data.differentEnvelopeSender;
  this._differentEnvelopeSender_ = null;
  this._receivedDate = data.receivedDate;
  this._replyType = data.replyType;
  this._replyType_ = null;
  this._sentDate = data.sentDate;
  this._state = data.state;
  this._subject = data.subject;
  this._subject_ = null;
  this._trashed = data.trashed;
  this._unread = data.unread;
  this._attachments = data.attachments;
  this._bccRecipients = [];
  for (var i=0; i < data.bccRecipients.length; i++) {
    this._bccRecipients.push(new tutao.entity.tutanota.MailAddress(this, data.bccRecipients[i]));
  }
  this._body = data.body;
  this._ccRecipients = [];
  for (var i=0; i < data.ccRecipients.length; i++) {
    this._ccRecipients.push(new tutao.entity.tutanota.MailAddress(this, data.ccRecipients[i]));
  }
  this._conversationEntry = data.conversationEntry;
  this._headers = data.headers;
  this._replyTos = [];
  for (var i=0; i < data.replyTos.length; i++) {
    this._replyTos.push(new tutao.entity.tutanota.EncryptedMailAddress(this, data.replyTos[i]));
  }
  this._sender = (data.sender) ? new tutao.entity.tutanota.MailAddress(this, data.sender) : null;
  this._toRecipients = [];
  for (var i=0; i < data.toRecipients.length; i++) {
    this._toRecipients.push(new tutao.entity.tutanota.MailAddress(this, data.toRecipients[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.Mail.MODEL_VERSION = '16';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.Mail.PATH = '/rest/tutanota/mail';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.Mail.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAGE';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.Mail.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.Mail.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.Mail.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _owner: this.__owner, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    confidential: this._confidential, 
    differentEnvelopeSender: this._differentEnvelopeSender, 
    receivedDate: this._receivedDate, 
    replyType: this._replyType, 
    sentDate: this._sentDate, 
    state: this._state, 
    subject: this._subject, 
    trashed: this._trashed, 
    unread: this._unread, 
    attachments: this._attachments, 
    bccRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._bccRecipients), 
    body: this._body, 
    ccRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._ccRecipients), 
    conversationEntry: this._conversationEntry, 
    headers: this._headers, 
    replyTos: tutao.entity.EntityHelper.aggregatesToJsonData(this._replyTos), 
    sender: tutao.entity.EntityHelper.aggregatesToJsonData(this._sender), 
    toRecipients: tutao.entity.EntityHelper.aggregatesToJsonData(this._toRecipients)
  };
};

/**
 * Provides the id of this Mail.
 * @return {Array.<string>} The id of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this Mail.
 * @param {string} area The area of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this Mail.
 * @return {string} The area of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this Mail.
 * @param {string} format The format of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Mail.
 * @return {string} The format of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the owner of this Mail.
 * @param {string} owner The owner of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this Mail.
 * @return {string} The owner of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the ownerEncSessionKey of this Mail.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this Mail.
 * @return {string} The ownerEncSessionKey of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this Mail.
 * @param {string} ownerGroup The ownerGroup of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this Mail.
 * @return {string} The ownerGroup of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this Mail.
 * @param {string} permissions The permissions of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Mail.
 * @return {string} The permissions of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the confidential of this Mail.
 * @param {boolean} confidential The confidential of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setConfidential = function(confidential) {
  var dataToEncrypt = (confidential) ? '1' : '0';
  this._confidential = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._confidential_ = confidential;
  return this;
};

/**
 * Provides the confidential of this Mail.
 * @return {boolean} The confidential of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getConfidential = function() {
  if (this._confidential_ != null) {
    return this._confidential_;
  }
  if (this._confidential == "" || !this._entityHelper.getSessionKey()) {
    return false;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._confidential);
    this._confidential_ = (value != '0');
    return this._confidential_;
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
 * Sets the differentEnvelopeSender of this Mail.
 * @param {string} differentEnvelopeSender The differentEnvelopeSender of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setDifferentEnvelopeSender = function(differentEnvelopeSender) {
  if (differentEnvelopeSender == null) {
    this._differentEnvelopeSender = null;
    this._differentEnvelopeSender_ = null;
  } else {
    var dataToEncrypt = differentEnvelopeSender;
    this._differentEnvelopeSender = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._differentEnvelopeSender_ = differentEnvelopeSender;
  }
  return this;
};

/**
 * Provides the differentEnvelopeSender of this Mail.
 * @return {string} The differentEnvelopeSender of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getDifferentEnvelopeSender = function() {
  if (this._differentEnvelopeSender == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._differentEnvelopeSender_ != null) {
    return this._differentEnvelopeSender_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._differentEnvelopeSender);
    this._differentEnvelopeSender_ = value;
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
 * Sets the receivedDate of this Mail.
 * @param {Date} receivedDate The receivedDate of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setReceivedDate = function(receivedDate) {
  this._receivedDate = String(receivedDate.getTime());
  return this;
};

/**
 * Provides the receivedDate of this Mail.
 * @return {Date} The receivedDate of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getReceivedDate = function() {
  if (isNaN(this._receivedDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._receivedDate);
  }
  return new Date(Number(this._receivedDate));
};

/**
 * Sets the replyType of this Mail.
 * @param {string} replyType The replyType of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setReplyType = function(replyType) {
  var dataToEncrypt = replyType;
  this._replyType = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._replyType_ = replyType;
  return this;
};

/**
 * Provides the replyType of this Mail.
 * @return {string} The replyType of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getReplyType = function() {
  if (this._replyType_ != null) {
    return this._replyType_;
  }
  if (this._replyType == "" || !this._entityHelper.getSessionKey()) {
    return "0";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._replyType);
    this._replyType_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "0";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the sentDate of this Mail.
 * @param {Date} sentDate The sentDate of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setSentDate = function(sentDate) {
  this._sentDate = String(sentDate.getTime());
  return this;
};

/**
 * Provides the sentDate of this Mail.
 * @return {Date} The sentDate of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getSentDate = function() {
  if (isNaN(this._sentDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._sentDate);
  }
  return new Date(Number(this._sentDate));
};

/**
 * Sets the state of this Mail.
 * @param {string} state The state of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setState = function(state) {
  this._state = state;
  return this;
};

/**
 * Provides the state of this Mail.
 * @return {string} The state of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getState = function() {
  return this._state;
};

/**
 * Sets the subject of this Mail.
 * @param {string} subject The subject of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setSubject = function(subject) {
  var dataToEncrypt = subject;
  this._subject = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._subject_ = subject;
  return this;
};

/**
 * Provides the subject of this Mail.
 * @return {string} The subject of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getSubject = function() {
  if (this._subject_ != null) {
    return this._subject_;
  }
  if (this._subject == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._subject);
    this._subject_ = value;
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
 * Sets the trashed of this Mail.
 * @param {boolean} trashed The trashed of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setTrashed = function(trashed) {
  this._trashed = trashed ? '1' : '0';
  return this;
};

/**
 * Provides the trashed of this Mail.
 * @return {boolean} The trashed of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getTrashed = function() {
  return this._trashed != '0';
};

/**
 * Sets the unread of this Mail.
 * @param {boolean} unread The unread of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setUnread = function(unread) {
  this._unread = unread ? '1' : '0';
  return this;
};

/**
 * Provides the unread of this Mail.
 * @return {boolean} The unread of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getUnread = function() {
  return this._unread != '0';
};

/**
 * Provides the attachments of this Mail.
 * @return {Array.<Array.<string>>} The attachments of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getAttachments = function() {
  return this._attachments;
};

/**
 * Provides the bccRecipients of this Mail.
 * @return {Array.<tutao.entity.tutanota.MailAddress>} The bccRecipients of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getBccRecipients = function() {
  return this._bccRecipients;
};

/**
 * Sets the body of this Mail.
 * @param {string} body The body of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setBody = function(body) {
  this._body = body;
  return this;
};

/**
 * Provides the body of this Mail.
 * @return {string} The body of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getBody = function() {
  return this._body;
};

/**
 * Loads the body of this Mail.
 * @return {Promise.<tutao.entity.tutanota.MailBody>} Resolves to the loaded body of this Mail or an exception if the loading failed.
 */
tutao.entity.tutanota.Mail.prototype.loadBody = function() {
  return tutao.entity.tutanota.MailBody.load(this._body);
};

/**
 * Provides the ccRecipients of this Mail.
 * @return {Array.<tutao.entity.tutanota.MailAddress>} The ccRecipients of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getCcRecipients = function() {
  return this._ccRecipients;
};

/**
 * Sets the conversationEntry of this Mail.
 * @param {Array.<string>} conversationEntry The conversationEntry of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setConversationEntry = function(conversationEntry) {
  this._conversationEntry = conversationEntry;
  return this;
};

/**
 * Provides the conversationEntry of this Mail.
 * @return {Array.<string>} The conversationEntry of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getConversationEntry = function() {
  return this._conversationEntry;
};

/**
 * Loads the conversationEntry of this Mail.
 * @return {Promise.<tutao.entity.tutanota.ConversationEntry>} Resolves to the loaded conversationEntry of this Mail or an exception if the loading failed.
 */
tutao.entity.tutanota.Mail.prototype.loadConversationEntry = function() {
  return tutao.entity.tutanota.ConversationEntry.load(this._conversationEntry);
};

/**
 * Sets the headers of this Mail.
 * @param {string} headers The headers of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setHeaders = function(headers) {
  this._headers = headers;
  return this;
};

/**
 * Provides the headers of this Mail.
 * @return {string} The headers of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getHeaders = function() {
  return this._headers;
};

/**
 * Loads the headers of this Mail.
 * @return {Promise.<tutao.entity.tutanota.MailHeaders>} Resolves to the loaded headers of this Mail or an exception if the loading failed.
 */
tutao.entity.tutanota.Mail.prototype.loadHeaders = function() {
  return tutao.entity.tutanota.MailHeaders.load(this._headers);
};

/**
 * Provides the replyTos of this Mail.
 * @return {Array.<tutao.entity.tutanota.EncryptedMailAddress>} The replyTos of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getReplyTos = function() {
  return this._replyTos;
};

/**
 * Sets the sender of this Mail.
 * @param {tutao.entity.tutanota.MailAddress} sender The sender of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.setSender = function(sender) {
  this._sender = sender;
  return this;
};

/**
 * Provides the sender of this Mail.
 * @return {tutao.entity.tutanota.MailAddress} The sender of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getSender = function() {
  return this._sender;
};

/**
 * Provides the toRecipients of this Mail.
 * @return {Array.<tutao.entity.tutanota.MailAddress>} The toRecipients of this Mail.
 */
tutao.entity.tutanota.Mail.prototype.getToRecipients = function() {
  return this._toRecipients;
};

/**
 * Loads a Mail from the server.
 * @param {Array.<string>} id The id of the Mail.
 * @return {Promise.<tutao.entity.tutanota.Mail>} Resolves to the Mail or an exception if the loading failed.
 */
tutao.entity.tutanota.Mail.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, id[1], id[0], {"v" : "16"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple Mails from the server.
 * @param {Array.<Array.<string>>} ids The ids of the Mails to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.Mail>>} Resolves to an array of Mail or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.Mail.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, ids, {"v": "16"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.Mail.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "16";
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.Mail.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this Mail on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.Mail.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.Mail.PATH, this, {"v": "16"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of Mails loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.tutanota.Mail>>} Resolves to an array of Mail or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.Mail.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.PATH, listId, start, count, reverse, {"v": "16"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.Mail.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.Mail.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.Mail.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
