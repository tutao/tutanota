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
    this._listEncSessionKey = null;
    this._previousMessageId = null;
    this._sharableEncSessionKey = null;
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
  this._listEncSessionKey = data.listEncSessionKey;
  this._previousMessageId = data.previousMessageId;
  this._sharableEncSessionKey = data.sharableEncSessionKey;
  this._symEncSessionKey = data.symEncSessionKey;
  this._draftData = (data.draftData) ? new tutao.entity.tutanota.DraftData(this, data.draftData) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.DraftCreateData.MODEL_VERSION = '11';

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
    listEncSessionKey: this._listEncSessionKey, 
    previousMessageId: this._previousMessageId, 
    sharableEncSessionKey: this._sharableEncSessionKey, 
    symEncSessionKey: this._symEncSessionKey, 
    draftData: tutao.entity.EntityHelper.aggregatesToJsonData(this._draftData)
  };
};

/**
 * The id of the DraftCreateData type.
 */
tutao.entity.tutanota.DraftCreateData.prototype.TYPE_ID = 507;

/**
 * The id of the conversationType attribute.
 */
tutao.entity.tutanota.DraftCreateData.prototype.CONVERSATIONTYPE_ATTRIBUTE_ID = 510;

/**
 * The id of the listEncSessionKey attribute.
 */
tutao.entity.tutanota.DraftCreateData.prototype.LISTENCSESSIONKEY_ATTRIBUTE_ID = 511;

/**
 * The id of the previousMessageId attribute.
 */
tutao.entity.tutanota.DraftCreateData.prototype.PREVIOUSMESSAGEID_ATTRIBUTE_ID = 509;

/**
 * The id of the sharableEncSessionKey attribute.
 */
tutao.entity.tutanota.DraftCreateData.prototype.SHARABLEENCSESSIONKEY_ATTRIBUTE_ID = 513;

/**
 * The id of the symEncSessionKey attribute.
 */
tutao.entity.tutanota.DraftCreateData.prototype.SYMENCSESSIONKEY_ATTRIBUTE_ID = 512;

/**
 * The id of the draftData attribute.
 */
tutao.entity.tutanota.DraftCreateData.prototype.DRAFTDATA_ATTRIBUTE_ID = 514;

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
 * Sets the listEncSessionKey of this DraftCreateData.
 * @param {string} listEncSessionKey The listEncSessionKey of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.setListEncSessionKey = function(listEncSessionKey) {
  this._listEncSessionKey = listEncSessionKey;
  return this;
};

/**
 * Provides the listEncSessionKey of this DraftCreateData.
 * @return {string} The listEncSessionKey of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.getListEncSessionKey = function() {
  return this._listEncSessionKey;
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
 * Sets the sharableEncSessionKey of this DraftCreateData.
 * @param {string} sharableEncSessionKey The sharableEncSessionKey of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.setSharableEncSessionKey = function(sharableEncSessionKey) {
  this._sharableEncSessionKey = sharableEncSessionKey;
  return this;
};

/**
 * Provides the sharableEncSessionKey of this DraftCreateData.
 * @return {string} The sharableEncSessionKey of this DraftCreateData.
 */
tutao.entity.tutanota.DraftCreateData.prototype.getSharableEncSessionKey = function() {
  return this._sharableEncSessionKey;
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
 * @return {Promise.<tutao.entity.tutanota.DraftCreateReturn=>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.DraftCreateData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 11;
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
