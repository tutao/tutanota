"use strict";

tutao.provide('tutao.entity.tutanota.DeleteMailData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DeleteMailData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._mails = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.DeleteMailData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.DeleteMailData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._mails = data.mails;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.DeleteMailData.MODEL_VERSION = '16';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.DeleteMailData.PATH = '/rest/tutanota/mailservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.DeleteMailData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.DeleteMailData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    mails: this._mails
  };
};

/**
 * Sets the format of this DeleteMailData.
 * @param {string} format The format of this DeleteMailData.
 */
tutao.entity.tutanota.DeleteMailData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this DeleteMailData.
 * @return {string} The format of this DeleteMailData.
 */
tutao.entity.tutanota.DeleteMailData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Provides the mails of this DeleteMailData.
 * @return {Array.<Array.<string>>} The mails of this DeleteMailData.
 */
tutao.entity.tutanota.DeleteMailData.prototype.getMails = function() {
  return this._mails;
};

/**
 * Invokes DELETE on a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.DeleteMailData>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.DeleteMailData.prototype.erase = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "16";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.deleteService(tutao.entity.tutanota.DeleteMailData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.DeleteMailData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
