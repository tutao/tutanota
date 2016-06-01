"use strict";

tutao.provide('tutao.entity.tutanota.SendUnsecureMailReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendUnsecureMailReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._senderMail = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.SendUnsecureMailReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.SendUnsecureMailReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._senderMail = data.senderMail;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.SendUnsecureMailReturn.MODEL_VERSION = '13';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.SendUnsecureMailReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.SendUnsecureMailReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    senderMail: this._senderMail
  };
};

/**
 * The id of the SendUnsecureMailReturn type.
 */
tutao.entity.tutanota.SendUnsecureMailReturn.prototype.TYPE_ID = 304;

/**
 * The id of the senderMail attribute.
 */
tutao.entity.tutanota.SendUnsecureMailReturn.prototype.SENDERMAIL_ATTRIBUTE_ID = 306;

/**
 * Sets the format of this SendUnsecureMailReturn.
 * @param {string} format The format of this SendUnsecureMailReturn.
 */
tutao.entity.tutanota.SendUnsecureMailReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this SendUnsecureMailReturn.
 * @return {string} The format of this SendUnsecureMailReturn.
 */
tutao.entity.tutanota.SendUnsecureMailReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the senderMail of this SendUnsecureMailReturn.
 * @param {Array.<string>} senderMail The senderMail of this SendUnsecureMailReturn.
 */
tutao.entity.tutanota.SendUnsecureMailReturn.prototype.setSenderMail = function(senderMail) {
  this._senderMail = senderMail;
  return this;
};

/**
 * Provides the senderMail of this SendUnsecureMailReturn.
 * @return {Array.<string>} The senderMail of this SendUnsecureMailReturn.
 */
tutao.entity.tutanota.SendUnsecureMailReturn.prototype.getSenderMail = function() {
  return this._senderMail;
};

/**
 * Loads the senderMail of this SendUnsecureMailReturn.
 * @return {Promise.<tutao.entity.tutanota.Mail>} Resolves to the loaded senderMail of this SendUnsecureMailReturn or an exception if the loading failed.
 */
tutao.entity.tutanota.SendUnsecureMailReturn.prototype.loadSenderMail = function() {
  return tutao.entity.tutanota.Mail.load(this._senderMail);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.SendUnsecureMailReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
