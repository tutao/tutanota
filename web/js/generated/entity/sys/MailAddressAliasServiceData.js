"use strict";

tutao.provide('tutao.entity.sys.MailAddressAliasServiceData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MailAddressAliasServiceData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._mailAddress = null;
    this._group = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.MailAddressAliasServiceData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._mailAddress = data.mailAddress;
  this._group = data.group;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.MailAddressAliasServiceData.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.MailAddressAliasServiceData.PATH = '/rest/sys/mailaddressaliasservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    mailAddress: this._mailAddress, 
    group: this._group
  };
};

/**
 * Sets the format of this MailAddressAliasServiceData.
 * @param {string} format The format of this MailAddressAliasServiceData.
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MailAddressAliasServiceData.
 * @return {string} The format of this MailAddressAliasServiceData.
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the mailAddress of this MailAddressAliasServiceData.
 * @param {string} mailAddress The mailAddress of this MailAddressAliasServiceData.
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this MailAddressAliasServiceData.
 * @return {string} The mailAddress of this MailAddressAliasServiceData.
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the group of this MailAddressAliasServiceData.
 * @param {string} group The group of this MailAddressAliasServiceData.
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this MailAddressAliasServiceData.
 * @return {string} The group of this MailAddressAliasServiceData.
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.getGroup = function() {
  return this._group;
};

/**
 * Loads the group of this MailAddressAliasServiceData.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded group of this MailAddressAliasServiceData or an exception if the loading failed.
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.loadGroup = function() {
  return tutao.entity.sys.Group.load(this._group);
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.sys.MailAddressAliasServiceData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.MailAddressAliasServiceData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
