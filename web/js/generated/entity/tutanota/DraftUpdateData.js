"use strict";

tutao.provide('tutao.entity.tutanota.DraftUpdateData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftUpdateData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._draft = null;
    this._draftData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.DraftUpdateData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftUpdateData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._draft = data.draft;
  this._draftData = (data.draftData) ? new tutao.entity.tutanota.DraftData(this, data.draftData) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.DraftUpdateData.MODEL_VERSION = '18';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.DraftUpdateData.PATH = '/rest/tutanota/draftservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.DraftUpdateData.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DraftUpdateData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    draft: this._draft, 
    draftData: tutao.entity.EntityHelper.aggregatesToJsonData(this._draftData)
  };
};

/**
 * Sets the format of this DraftUpdateData.
 * @param {string} format The format of this DraftUpdateData.
 */
tutao.entity.tutanota.DraftUpdateData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DraftUpdateData.
 * @return {string} The format of this DraftUpdateData.
 */
tutao.entity.tutanota.DraftUpdateData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the draft of this DraftUpdateData.
 * @param {Array.<string>} draft The draft of this DraftUpdateData.
 */
tutao.entity.tutanota.DraftUpdateData.prototype.setDraft = function(draft) {
  this._draft = draft;
  return this;
};

/**
 * Provides the draft of this DraftUpdateData.
 * @return {Array.<string>} The draft of this DraftUpdateData.
 */
tutao.entity.tutanota.DraftUpdateData.prototype.getDraft = function() {
  return this._draft;
};

/**
 * Loads the draft of this DraftUpdateData.
 * @return {Promise.<tutao.entity.tutanota.Mail>} Resolves to the loaded draft of this DraftUpdateData or an exception if the loading failed.
 */
tutao.entity.tutanota.DraftUpdateData.prototype.loadDraft = function() {
  return tutao.entity.tutanota.Mail.load(this._draft);
};

/**
 * Sets the draftData of this DraftUpdateData.
 * @param {tutao.entity.tutanota.DraftData} draftData The draftData of this DraftUpdateData.
 */
tutao.entity.tutanota.DraftUpdateData.prototype.setDraftData = function(draftData) {
  this._draftData = draftData;
  return this;
};

/**
 * Provides the draftData of this DraftUpdateData.
 * @return {tutao.entity.tutanota.DraftData} The draftData of this DraftUpdateData.
 */
tutao.entity.tutanota.DraftUpdateData.prototype.getDraftData = function() {
  return this._draftData;
};

/**
 * Updates this service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.DraftUpdateReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.DraftUpdateData.prototype.update = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "18";
  return tutao.locator.entityRestClient.putService(tutao.entity.tutanota.DraftUpdateData.PATH, this, parameters, headers, tutao.entity.tutanota.DraftUpdateReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.DraftUpdateData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
