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
  this._mailAddress = data.mailAddress;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.MailAddressAlias.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    mailAddress: this._mailAddress
  };
};

/**
 * The id of the MailAddressAlias type.
 */
tutao.entity.sys.MailAddressAlias.prototype.TYPE_ID = 684;

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
