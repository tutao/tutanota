"use strict";

tutao.provide('tutao.entity.sys.MailAddressAlias');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MailAddressAlias = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._enabled = null;
    this._mailAddress = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.MailAddressAlias.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.MailAddressAlias.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._enabled = data.enabled;
  this._mailAddress = data.mailAddress;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.MailAddressAlias.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    enabled: this._enabled, 
    mailAddress: this._mailAddress
  };
};

/**
 * The id of the MailAddressAlias type.
 */
tutao.entity.sys.MailAddressAlias.prototype.TYPE_ID = 684;

/**
 * The id of the enabled attribute.
 */
tutao.entity.sys.MailAddressAlias.prototype.ENABLED_ATTRIBUTE_ID = 777;

/**
 * The id of the mailAddress attribute.
 */
tutao.entity.sys.MailAddressAlias.prototype.MAILADDRESS_ATTRIBUTE_ID = 686;

/**
 * Sets the id of this MailAddressAlias.
 * @param {string} id The id of this MailAddressAlias.
 */
tutao.entity.sys.MailAddressAlias.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this MailAddressAlias.
 * @return {string} The id of this MailAddressAlias.
 */
tutao.entity.sys.MailAddressAlias.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the enabled of this MailAddressAlias.
 * @param {boolean} enabled The enabled of this MailAddressAlias.
 */
tutao.entity.sys.MailAddressAlias.prototype.setEnabled = function(enabled) {
  this._enabled = enabled ? '1' : '0';
  return this;
};

/**
 * Provides the enabled of this MailAddressAlias.
 * @return {boolean} The enabled of this MailAddressAlias.
 */
tutao.entity.sys.MailAddressAlias.prototype.getEnabled = function() {
  return this._enabled == '1';
};

/**
 * Sets the mailAddress of this MailAddressAlias.
 * @param {string} mailAddress The mailAddress of this MailAddressAlias.
 */
tutao.entity.sys.MailAddressAlias.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this MailAddressAlias.
 * @return {string} The mailAddress of this MailAddressAlias.
 */
tutao.entity.sys.MailAddressAlias.prototype.getMailAddress = function() {
  return this._mailAddress;
};
