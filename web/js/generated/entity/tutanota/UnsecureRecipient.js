"use strict";

tutao.provide('tutao.entity.tutanota.UnsecureRecipient');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UnsecureRecipient = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._mailAddress = null;
    this._name = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.tutanota.UnsecureRecipient.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._mailAddress = data.mailAddress;
  this._name = data.name;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    mailAddress: this._mailAddress, 
    name: this._name
  };
};

/**
 * The id of the UnsecureRecipient type.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.TYPE_ID = 276;

/**
 * The id of the mailAddress attribute.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.MAILADDRESS_ATTRIBUTE_ID = 279;

/**
 * The id of the name attribute.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.NAME_ATTRIBUTE_ID = 278;

/**
 * Sets the id of this UnsecureRecipient.
 * @param {string} id The id of this UnsecureRecipient.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this UnsecureRecipient.
 * @return {string} The id of this UnsecureRecipient.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the mailAddress of this UnsecureRecipient.
 * @param {string} mailAddress The mailAddress of this UnsecureRecipient.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.setMailAddress = function(mailAddress) {
  this._mailAddress = mailAddress;
  return this;
};

/**
 * Provides the mailAddress of this UnsecureRecipient.
 * @return {string} The mailAddress of this UnsecureRecipient.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.getMailAddress = function() {
  return this._mailAddress;
};

/**
 * Sets the name of this UnsecureRecipient.
 * @param {string} name The name of this UnsecureRecipient.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.setName = function(name) {
  this._name = name;
  return this;
};

/**
 * Provides the name of this UnsecureRecipient.
 * @return {string} The name of this UnsecureRecipient.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.getName = function() {
  return this._name;
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.UnsecureRecipient.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
