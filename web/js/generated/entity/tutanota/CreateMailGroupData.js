"use strict";

tutao.provide('tutao.entity.tutanota.CreateMailGroupData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateMailGroupData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._encryptedName = null;
    this._mailAddress = null;
    this._mailEncMailboxSessionKey = null;
    this._groupData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.CreateMailGroupData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._encryptedName = data.encryptedName;
  this._mailAddress = data.mailAddress;
  this._mailEncMailboxSessionKey = data.mailEncMailboxSessionKey;
  this._groupData = (data.groupData) ? new tutao.entity.tutanota.InternalGroupData(this, data.groupData) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CreateMailGroupData.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.CreateMailGroupData.PATH = '/rest/tutanota/mailgroupservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    encryptedName: this._encryptedName, 
    mailAddress: this._mailAddress, 
    mailEncMailboxSessionKey: this._mailEncMailboxSessionKey, 
    groupData: tutao.entity.EntityHelper.aggregatesToJsonData(this._groupData)
  };
};

/**
 * Sets the format of this CreateMailGroupData.
 * @param {string} format The format of this CreateMailGroupData.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateMailGroupData.
 * @return {string} The format of this CreateMailGroupData.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the encryptedName of this CreateMailGroupData.
 * @param {string} encryptedName The encryptedName of this CreateMailGroupData.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.setEncryptedName = function(encryptedName) {
  this._encryptedName = encryptedName;
  return this;
};

/**
 * Provides the encryptedName of this CreateMailGroupData.
 * @return {string} The encryptedName of this CreateMailGroupData.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.getEncryptedName = function() {
  return this._encryptedName;
};

/**
 * Sets the mailAddress of this CreateMailGroupData.
 * @param {string} mailAddress The mailAddress of this CreateMailGroupData.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this CreateMailGroupData.
 * @return {string} The mailAddress of this CreateMailGroupData.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the mailEncMailboxSessionKey of this CreateMailGroupData.
 * @param {string} mailEncMailboxSessionKey The mailEncMailboxSessionKey of this CreateMailGroupData.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.setMailEncMailboxSessionKey = function(mailEncMailboxSessionKey) {
  this._mailEncMailboxSessionKey = mailEncMailboxSessionKey;
  return this;
};

/**
 * Provides the mailEncMailboxSessionKey of this CreateMailGroupData.
 * @return {string} The mailEncMailboxSessionKey of this CreateMailGroupData.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.getMailEncMailboxSessionKey = function() {
  return this._mailEncMailboxSessionKey;
};

/**
 * Sets the groupData of this CreateMailGroupData.
 * @param {tutao.entity.tutanota.InternalGroupData} groupData The groupData of this CreateMailGroupData.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.setGroupData = function(groupData) {
  this._groupData = groupData;
  return this;
};

/**
 * Provides the groupData of this CreateMailGroupData.
 * @return {tutao.entity.tutanota.InternalGroupData} The groupData of this CreateMailGroupData.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.getGroupData = function() {
  return this._groupData;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.CreateMailGroupData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.CreateMailGroupData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
