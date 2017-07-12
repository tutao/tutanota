"use strict";

tutao.provide('tutao.entity.sys.DomainInfo');

/**
 * @constructor
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DomainInfo = function(parent, data) {
  if (data) {
    this.updateData(parent, data);
  } else {
    this.__id = tutao.entity.EntityHelper.generateAggregateId();
    this._certificateExpiryDate = null;
    this._domain = null;
    this._validatedMxRecord = null;
    this._catchAllMailGroup = null;
    this._certificate = null;
    this._theme = null;
  }
  this._parent = parent;
  this.prototype = tutao.entity.sys.DomainInfo.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object} parent The parent entity of this aggregate.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.DomainInfo.prototype.updateData = function(parent, data) {
  this.__id = data._id;
  this._certificateExpiryDate = data.certificateExpiryDate;
  this._domain = data.domain;
  this._validatedMxRecord = data.validatedMxRecord;
  this._catchAllMailGroup = data.catchAllMailGroup;
  this._certificate = data.certificate;
  this._theme = data.theme;
};

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.DomainInfo.prototype.toJsonData = function() {
  return {
    _id: this.__id, 
    certificateExpiryDate: this._certificateExpiryDate, 
    domain: this._domain, 
    validatedMxRecord: this._validatedMxRecord, 
    catchAllMailGroup: this._catchAllMailGroup, 
    certificate: this._certificate, 
    theme: this._theme
  };
};

/**
 * Sets the id of this DomainInfo.
 * @param {string} id The id of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.setId = function(id) {
  this.__id = id;
  return this;
};

/**
 * Provides the id of this DomainInfo.
 * @return {string} The id of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the certificateExpiryDate of this DomainInfo.
 * @param {Date} certificateExpiryDate The certificateExpiryDate of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.setCertificateExpiryDate = function(certificateExpiryDate) {
  if (certificateExpiryDate == null) {
    this._certificateExpiryDate = null;
  } else {
    this._certificateExpiryDate = String(certificateExpiryDate.getTime());
  }
  return this;
};

/**
 * Provides the certificateExpiryDate of this DomainInfo.
 * @return {Date} The certificateExpiryDate of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.getCertificateExpiryDate = function() {
  if (this._certificateExpiryDate == null) {
    return null;
  }
  if (isNaN(this._certificateExpiryDate)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._certificateExpiryDate);
  }
  return new Date(Number(this._certificateExpiryDate));
};

/**
 * Sets the domain of this DomainInfo.
 * @param {string} domain The domain of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.setDomain = function(domain) {
  this._domain = domain;
  return this;
};

/**
 * Provides the domain of this DomainInfo.
 * @return {string} The domain of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.getDomain = function() {
  return this._domain;
};

/**
 * Sets the validatedMxRecord of this DomainInfo.
 * @param {boolean} validatedMxRecord The validatedMxRecord of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.setValidatedMxRecord = function(validatedMxRecord) {
  this._validatedMxRecord = validatedMxRecord ? '1' : '0';
  return this;
};

/**
 * Provides the validatedMxRecord of this DomainInfo.
 * @return {boolean} The validatedMxRecord of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.getValidatedMxRecord = function() {
  return this._validatedMxRecord != '0';
};

/**
 * Sets the catchAllMailGroup of this DomainInfo.
 * @param {string} catchAllMailGroup The catchAllMailGroup of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.setCatchAllMailGroup = function(catchAllMailGroup) {
  this._catchAllMailGroup = catchAllMailGroup;
  return this;
};

/**
 * Provides the catchAllMailGroup of this DomainInfo.
 * @return {string} The catchAllMailGroup of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.getCatchAllMailGroup = function() {
  return this._catchAllMailGroup;
};

/**
 * Loads the catchAllMailGroup of this DomainInfo.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded catchAllMailGroup of this DomainInfo or an exception if the loading failed.
 */
tutao.entity.sys.DomainInfo.prototype.loadCatchAllMailGroup = function() {
  return tutao.entity.sys.Group.load(this._catchAllMailGroup);
};

/**
 * Sets the certificate of this DomainInfo.
 * @param {string} certificate The certificate of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.setCertificate = function(certificate) {
  this._certificate = certificate;
  return this;
};

/**
 * Provides the certificate of this DomainInfo.
 * @return {string} The certificate of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.getCertificate = function() {
  return this._certificate;
};

/**
 * Loads the certificate of this DomainInfo.
 * @return {Promise.<tutao.entity.sys.SslCertificate>} Resolves to the loaded certificate of this DomainInfo or an exception if the loading failed.
 */
tutao.entity.sys.DomainInfo.prototype.loadCertificate = function() {
  return tutao.entity.sys.SslCertificate.load(this._certificate);
};

/**
 * Sets the theme of this DomainInfo.
 * @param {string} theme The theme of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.setTheme = function(theme) {
  this._theme = theme;
  return this;
};

/**
 * Provides the theme of this DomainInfo.
 * @return {string} The theme of this DomainInfo.
 */
tutao.entity.sys.DomainInfo.prototype.getTheme = function() {
  return this._theme;
};

/**
 * Loads the theme of this DomainInfo.
 * @return {Promise.<tutao.entity.sys.BrandingTheme>} Resolves to the loaded theme of this DomainInfo or an exception if the loading failed.
 */
tutao.entity.sys.DomainInfo.prototype.loadTheme = function() {
  return tutao.entity.sys.BrandingTheme.load(this._theme);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.DomainInfo.prototype.getEntityHelper = function() {
  return this._parent.getEntityHelper();
};
