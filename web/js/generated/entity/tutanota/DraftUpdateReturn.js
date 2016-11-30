"use strict";

tutao.provide('tutao.entity.tutanota.DraftUpdateReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftUpdateReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._attachments = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.DraftUpdateReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DraftUpdateReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._attachments = data.attachments;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.DraftUpdateReturn.MODEL_VERSION = '16';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.DraftUpdateReturn.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DraftUpdateReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    attachments: this._attachments
  };
};

/**
 * Sets the format of this DraftUpdateReturn.
 * @param {string} format The format of this DraftUpdateReturn.
 */
tutao.entity.tutanota.DraftUpdateReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DraftUpdateReturn.
 * @return {string} The format of this DraftUpdateReturn.
 */
tutao.entity.tutanota.DraftUpdateReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Provides the attachments of this DraftUpdateReturn.
 * @return {Array.<Array.<string>>} The attachments of this DraftUpdateReturn.
 */
tutao.entity.tutanota.DraftUpdateReturn.prototype.getAttachments = function() {
  return this._attachments;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.DraftUpdateReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
