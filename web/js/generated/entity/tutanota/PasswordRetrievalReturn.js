"use strict";

tutao.provide('tutao.entity.tutanota.PasswordRetrievalReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.PasswordRetrievalReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._transmissionKeyEncryptedPassword = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.PasswordRetrievalReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.PasswordRetrievalReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._transmissionKeyEncryptedPassword = data.transmissionKeyEncryptedPassword;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.PasswordRetrievalReturn.MODEL_VERSION = '15';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.PasswordRetrievalReturn.PATH = '/rest/tutanota/passwordretrievalservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.PasswordRetrievalReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.PasswordRetrievalReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    transmissionKeyEncryptedPassword: this._transmissionKeyEncryptedPassword
  };
};

/**
 * Sets the format of this PasswordRetrievalReturn.
 * @param {string} format The format of this PasswordRetrievalReturn.
 */
tutao.entity.tutanota.PasswordRetrievalReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PasswordRetrievalReturn.
 * @return {string} The format of this PasswordRetrievalReturn.
 */
tutao.entity.tutanota.PasswordRetrievalReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the transmissionKeyEncryptedPassword of this PasswordRetrievalReturn.
 * @param {string} transmissionKeyEncryptedPassword The transmissionKeyEncryptedPassword of this PasswordRetrievalReturn.
 */
tutao.entity.tutanota.PasswordRetrievalReturn.prototype.setTransmissionKeyEncryptedPassword = function(transmissionKeyEncryptedPassword) {
  this._transmissionKeyEncryptedPassword = transmissionKeyEncryptedPassword;
  return this;
};

/**
 * Provides the transmissionKeyEncryptedPassword of this PasswordRetrievalReturn.
 * @return {string} The transmissionKeyEncryptedPassword of this PasswordRetrievalReturn.
 */
tutao.entity.tutanota.PasswordRetrievalReturn.prototype.getTransmissionKeyEncryptedPassword = function() {
  return this._transmissionKeyEncryptedPassword;
};

/**
 * Loads from the service.
 * @param {tutao.entity.tutanota.PasswordRetrievalData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.PasswordRetrievalReturn>} Resolves to PasswordRetrievalReturn or an exception if the loading failed.
 */
tutao.entity.tutanota.PasswordRetrievalReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "15";
  return tutao.locator.entityRestClient.getService(tutao.entity.tutanota.PasswordRetrievalReturn, tutao.entity.tutanota.PasswordRetrievalReturn.PATH, entity, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.PasswordRetrievalReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
