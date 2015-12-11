"use strict";

tutao.provide('tutao.entity.sys.RegistrationVerifyDomainPostReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._mailSent = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.RegistrationVerifyDomainPostReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._mailSent = data.mailSent;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn.MODEL_VERSION = '14';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    mailSent: this._mailSent
  };
};

/**
 * The id of the RegistrationVerifyDomainPostReturn type.
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn.prototype.TYPE_ID = 337;

/**
 * The id of the mailSent attribute.
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn.prototype.MAILSENT_ATTRIBUTE_ID = 339;

/**
 * Sets the format of this RegistrationVerifyDomainPostReturn.
 * @param {string} format The format of this RegistrationVerifyDomainPostReturn.
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this RegistrationVerifyDomainPostReturn.
 * @return {string} The format of this RegistrationVerifyDomainPostReturn.
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the mailSent of this RegistrationVerifyDomainPostReturn.
 * @param {boolean} mailSent The mailSent of this RegistrationVerifyDomainPostReturn.
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn.prototype.setMailSent = function(mailSent) {
  this._mailSent = mailSent ? '1' : '0';
  return this;
};

/**
 * Provides the mailSent of this RegistrationVerifyDomainPostReturn.
 * @return {boolean} The mailSent of this RegistrationVerifyDomainPostReturn.
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn.prototype.getMailSent = function() {
  return this._mailSent != '0';
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.RegistrationVerifyDomainPostReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
