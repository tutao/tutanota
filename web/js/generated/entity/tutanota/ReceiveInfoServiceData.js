"use strict";

tutao.provide('tutao.entity.tutanota.ReceiveInfoServiceData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ReceiveInfoServiceData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.ReceiveInfoServiceData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ReceiveInfoServiceData.prototype.updateData = function(data) {
  this.__format = data._format;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.ReceiveInfoServiceData.MODEL_VERSION = '14';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.ReceiveInfoServiceData.PATH = '/rest/tutanota/receiveinfoservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.ReceiveInfoServiceData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ReceiveInfoServiceData.prototype.toJsonData = function() {
  return {
    _format: this.__format
  };
};

/**
 * Sets the format of this ReceiveInfoServiceData.
 * @param {string} format The format of this ReceiveInfoServiceData.
 */
tutao.entity.tutanota.ReceiveInfoServiceData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ReceiveInfoServiceData.
 * @return {string} The format of this ReceiveInfoServiceData.
 */
tutao.entity.tutanota.ReceiveInfoServiceData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.ReceiveInfoServiceData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "14";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.ReceiveInfoServiceData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ReceiveInfoServiceData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
