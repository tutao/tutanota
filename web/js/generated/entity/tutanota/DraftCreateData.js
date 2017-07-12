"use strict";

tutao.provide('tutao.entity.tutanota.DraftCreateData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftCreateData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._conversationType = null;
    this._ownerEncSessionKey = null;
    this._previousMessageId = null;
    this._symEncSessionKey = null;
    this._draftData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.DraftCreateData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftCreateData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._conversationType = data.conversationType;
  this._ownerEncSessionKey = data.ownerEncSessionKey;
  this._previousMessageId = data.previousMessageId;
  this._symEncSessionKey = data.symEncSessionKey;
  this._draftData = (data.draftData) ? new tutao.entity.tutanota.DraftData(this, data.draftData) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.DraftCreateData.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.DraftCreateData.PATH = '/rest/tutanota/draftservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.DraftCreateData.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DraftCreateData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    conversationType: this._conversationType, 
    ownerEncSessionKey: this._ownerEncSessionKey, 
    previousMessageId: this._previousMessageId, 
    symEncSessionKey: this._symEncSessionKey, 
    draftData: tutao.entity.EntityHelper.aggregatesToJsonData(this._draftData)
  };
};

/**
 * Sets the format of this DraftCreateData.
 * @param {string} format The format of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DraftCreateData.
 * @return {string} The format of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the conversationType of this DraftCreateData.
 * @param {string} conversationType The conversationType of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.setConversationType = function(conversationType) {
  this._conversationType = conversationType;
  return this;
};

/**
 * Provides the conversationType of this DraftCreateData.
 * @return {string} The conversationType of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.getConversationType = function() {
  return this._conversationType;
};

/**
 * Sets the ownerEncSessionKey of this DraftCreateData.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this._ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this DraftCreateData.
 * @return {string} The ownerEncSessionKey of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.getOwnerEncSessionKey = function() {
  return this._ownerEncSessionKey;
};

/**
 * Sets the previousMessageId of this DraftCreateData.
 * @param {string} previousMessageId The previousMessageId of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.setPreviousMessageId = function(previousMessageId) {
  this._previousMessageId = previousMessageId;
  return this;
};

/**
 * Provides the previousMessageId of this DraftCreateData.
 * @return {string} The previousMessageId of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.getPreviousMessageId = function() {
  return this._previousMessageId;
};

/**
 * Sets the symEncSessionKey of this DraftCreateData.
 * @param {string} symEncSessionKey The symEncSessionKey of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.setSymEncSessionKey = function(symEncSessionKey) {
  this._symEncSessionKey = symEncSessionKey;
  return this;
};

/**
 * Provides the symEncSessionKey of this DraftCreateData.
 * @return {string} The symEncSessionKey of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.getSymEncSessionKey = function() {
  return this._symEncSessionKey;
};

/**
 * Sets the draftData of this DraftCreateData.
 * @param {tutao.entity.tutanota.DraftData} draftData The draftData of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.setDraftData = function(draftData) {
  this._draftData = draftData;
  return this;
};

/**
 * Provides the draftData of this DraftCreateData.
 * @return {tutao.entity.tutanota.DraftData} The draftData of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.getDraftData = function() {
  return this._draftData;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.DraftCreateReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.DraftCreateData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "20";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.DraftCreateData.PATH, this, parameters, headers, tutao.entity.tutanota.DraftCreateReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.DraftCreateData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
