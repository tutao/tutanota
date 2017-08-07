"use strict";

tutao.provide('tutao.entity.tutanota.DraftCreateReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftCreateReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._draft = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.DraftCreateReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftCreateReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._draft = data.draft;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.DraftCreateReturn.MODEL_VERSION = '21';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.DraftCreateReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DraftCreateReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    draft: this._draft
  };
};

/**
 * Sets the format of this DraftCreateReturn.
 * @param {string} format The format of this DraftCreateReturn.
 */
tutao.entity.tutanota.DraftCreateReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DraftCreateReturn.
 * @return {string} The format of this DraftCreateReturn.
 */
tutao.entity.tutanota.DraftCreateReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the draft of this DraftCreateReturn.
 * @param {Array.<string>} draft The draft of this DraftCreateReturn.
 */
tutao.entity.tutanota.DraftCreateReturn.prototype.setDraft = function(draft) {
  this._draft = draft;
  return this;
};

/**
 * Provides the draft of this DraftCreateReturn.
 * @return {Array.<string>} The draft of this DraftCreateReturn.
 */
tutao.entity.tutanota.DraftCreateReturn.prototype.getDraft = function() {
  return this._draft;
};

/**
 * Loads the draft of this DraftCreateReturn.
 * @return {Promise.<tutao.entity.tutanota.Mail>} Resolves to the loaded draft of this DraftCreateReturn or an exception if the loading failed.
 */
tutao.entity.tutanota.DraftCreateReturn.prototype.loadDraft = function() {
  return tutao.entity.tutanota.Mail.load(this._draft);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.DraftCreateReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
