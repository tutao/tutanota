"use strict";

tutao.provide('tutao.entity.tutanota.CreateTeamGroupData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateTeamGroupData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._encryptedName = null;
    this._groupData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.CreateTeamGroupData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.CreateTeamGroupData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._encryptedName = data.encryptedName;
  this._groupData = (data.groupData) ? new tutao.entity.tutanota.InternalGroupData(this, data.groupData) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.CreateTeamGroupData.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.CreateTeamGroupData.PATH = '/rest/tutanota/teamgroupservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.CreateTeamGroupData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.CreateTeamGroupData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    encryptedName: this._encryptedName, 
    groupData: tutao.entity.EntityHelper.aggregatesToJsonData(this._groupData)
  };
};

/**
 * Sets the format of this CreateTeamGroupData.
 * @param {string} format The format of this CreateTeamGroupData.
 */
tutao.entity.tutanota.CreateTeamGroupData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateTeamGroupData.
 * @return {string} The format of this CreateTeamGroupData.
 */
tutao.entity.tutanota.CreateTeamGroupData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the encryptedName of this CreateTeamGroupData.
 * @param {string} encryptedName The encryptedName of this CreateTeamGroupData.
 */
tutao.entity.tutanota.CreateTeamGroupData.prototype.setEncryptedName = function(encryptedName) {
  this._encryptedName = encryptedName;
  return this;
};

/**
 * Provides the encryptedName of this CreateTeamGroupData.
 * @return {string} The encryptedName of this CreateTeamGroupData.
 */
tutao.entity.tutanota.CreateTeamGroupData.prototype.getEncryptedName = function() {
  return this._encryptedName;
};

/**
 * Sets the groupData of this CreateTeamGroupData.
 * @param {tutao.entity.tutanota.InternalGroupData} groupData The groupData of this CreateTeamGroupData.
 */
tutao.entity.tutanota.CreateTeamGroupData.prototype.setGroupData = function(groupData) {
  this._groupData = groupData;
  return this;
};

/**
 * Provides the groupData of this CreateTeamGroupData.
 * @return {tutao.entity.tutanota.InternalGroupData} The groupData of this CreateTeamGroupData.
 */
tutao.entity.tutanota.CreateTeamGroupData.prototype.getGroupData = function() {
  return this._groupData;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.CreateTeamGroupData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.CreateTeamGroupData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.CreateTeamGroupData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
