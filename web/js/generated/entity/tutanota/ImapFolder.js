"use strict";

tutao.provide('tutao.entity.tutanota.ImapFolder');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ImapFolder = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._lastseenuid = null;
    this._name = null;
    this._uidvalidity = null;
    this._syncInfo = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.ImapFolder.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ImapFolder.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._lastseenuid = data.lastseenuid;
  this._name = data.name;
  this._uidvalidity = data.uidvalidity;
  this._syncInfo = data.syncInfo;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ImapFolder.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    lastseenuid: this._lastseenuid, 
    name: this._name, 
    uidvalidity: this._uidvalidity, 
    syncInfo: this._syncInfo
  };
};

/**
 * Sets the id of this ImapFolder.
 * @param {string} id The id of this ImapFolder.
 */
tutao.entity.tutanota.ImapFolder.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this ImapFolder.
 * @return {string} The id of this ImapFolder.
 */
tutao.entity.tutanota.ImapFolder.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the lastseenuid of this ImapFolder.
 * @param {string} lastseenuid The lastseenuid of this ImapFolder.
 */
tutao.entity.tutanota.ImapFolder.prototype.setLastseenuid = function(lastseenuid) {
  this._lastseenuid = lastseenuid;
  return this;
};

/**
 * Provides the lastseenuid of this ImapFolder.
 * @return {string} The lastseenuid of this ImapFolder.
 */
tutao.entity.tutanota.ImapFolder.prototype.getLastseenuid = function() {
  return this._lastseenuid;
};

/**
 * Sets the name of this ImapFolder.
 * @param {string} name The name of this ImapFolder.
 */
tutao.entity.tutanota.ImapFolder.prototype.setName = function(name) {
  this._name = name;
  return this;
};

/**
 * Provides the name of this ImapFolder.
 * @return {string} The name of this ImapFolder.
 */
tutao.entity.tutanota.ImapFolder.prototype.getName = function() {
  return this._name;
};

/**
 * Sets the uidvalidity of this ImapFolder.
 * @param {string} uidvalidity The uidvalidity of this ImapFolder.
 */
tutao.entity.tutanota.ImapFolder.prototype.setUidvalidity = function(uidvalidity) {
  this._uidvalidity = uidvalidity;
  return this;
};

/**
 * Provides the uidvalidity of this ImapFolder.
 * @return {string} The uidvalidity of this ImapFolder.
 */
tutao.entity.tutanota.ImapFolder.prototype.getUidvalidity = function() {
  return this._uidvalidity;
};

/**
 * Sets the syncInfo of this ImapFolder.
 * @param {string} syncInfo The syncInfo of this ImapFolder.
 */
tutao.entity.tutanota.ImapFolder.prototype.setSyncInfo = function(syncInfo) {
  this._syncInfo = syncInfo;
  return this;
};

/**
 * Provides the syncInfo of this ImapFolder.
 * @return {string} The syncInfo of this ImapFolder.
 */
tutao.entity.tutanota.ImapFolder.prototype.getSyncInfo = function() {
  return this._syncInfo;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ImapFolder.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
