"use strict";

tutao.provide('tutao.entity.sys.MailAddressAliasServiceDataDelete');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._mailAddress = null;
    this._restore = null;
    this._group = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.updateData = function(data) {
  this.__format = data._format;
  this._mailAddress = data.mailAddress;
  this._restore = data.restore;
  this._group = data.group;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.MODEL_VERSION = '19';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.PATH = '/rest/sys/mailaddressaliasservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    mailAddress: this._mailAddress, 
    restore: this._restore, 
    group: this._group
  };
};

/**
 * Sets the format of this MailAddressAliasServiceDataDelete.
 * @param {string} format The format of this MailAddressAliasServiceDataDelete.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this MailAddressAliasServiceDataDelete.
 * @return {string} The format of this MailAddressAliasServiceDataDelete.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the mailAddress of this MailAddressAliasServiceDataDelete.
 * @param {string} mailAddress The mailAddress of this MailAddressAliasServiceDataDelete.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this MailAddressAliasServiceDataDelete.
 * @return {string} The mailAddress of this MailAddressAliasServiceDataDelete.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the restore of this MailAddressAliasServiceDataDelete.
 * @param {boolean} restore The restore of this MailAddressAliasServiceDataDelete.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.setRestore = function(restore) {
  this._restore = restore ? '1' : '0';
  return this;
};

/**
 * Provides the restore of this MailAddressAliasServiceDataDelete.
 * @return {boolean} The restore of this MailAddressAliasServiceDataDelete.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.getRestore = function() {
  return this._restore != '0';
};

/**
 * Sets the group of this MailAddressAliasServiceDataDelete.
 * @param {string} group The group of this MailAddressAliasServiceDataDelete.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.setGroup = function(group) {
  this._group = group;
  return this;
};

/**
 * Provides the group of this MailAddressAliasServiceDataDelete.
 * @return {string} The group of this MailAddressAliasServiceDataDelete.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.getGroup = function() {
  return this._group;
};

/**
 * Loads the group of this MailAddressAliasServiceDataDelete.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded group of this MailAddressAliasServiceDataDelete or an exception if the loading failed.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.loadGroup = function() {
  return tutao.entity.sys.Group.load(this._group);
};

/**
 * Invokes DELETE on a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.MailAddressAliasServiceDataDelete>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.erase = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "19";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.deleteService(tutao.entity.sys.MailAddressAliasServiceDataDelete.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.MailAddressAliasServiceDataDelete.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
