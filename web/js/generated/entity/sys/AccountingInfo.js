"use strict";

tutao.provide('tutao.entity.sys.AccountingInfo');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AccountingInfo = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._invoiceAddress = null;
    this._invoiceCountry = null;
    this._invoiceName = null;
    this._lastInvoiceNbrOfSentSms = null;
    this._lastInvoiceTimestamp = null;
    this._paymentMethod = null;
    this._invoiceInfo = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.AccountingInfo.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.AccountingInfo.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._invoiceAddress = data.invoiceAddress;
  this._invoiceCountry = data.invoiceCountry;
  this._invoiceName = data.invoiceName;
  this._lastInvoiceNbrOfSentSms = data.lastInvoiceNbrOfSentSms;
  this._lastInvoiceTimestamp = data.lastInvoiceTimestamp;
  this._paymentMethod = data.paymentMethod;
  this._invoiceInfo = data.invoiceInfo;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.AccountingInfo.MODEL_VERSION = '9';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.AccountingInfo.PATH = '/rest/sys/accountinginfo';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.AccountingInfo.ROOT_INSTANCE_ID = 'A3N5cwAAjw';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.AccountingInfo.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.AccountingInfo.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.AccountingInfo.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    invoiceAddress: this._invoiceAddress, 
    invoiceCountry: this._invoiceCountry, 
    invoiceName: this._invoiceName, 
    lastInvoiceNbrOfSentSms: this._lastInvoiceNbrOfSentSms, 
    lastInvoiceTimestamp: this._lastInvoiceTimestamp, 
    paymentMethod: this._paymentMethod, 
    invoiceInfo: this._invoiceInfo
  };
};

/**
 * The id of the AccountingInfo type.
 */
tutao.entity.sys.AccountingInfo.prototype.TYPE_ID = 143;

/**
 * The id of the invoiceAddress attribute.
 */
tutao.entity.sys.AccountingInfo.prototype.INVOICEADDRESS_ATTRIBUTE_ID = 745;

/**
 * The id of the invoiceCountry attribute.
 */
tutao.entity.sys.AccountingInfo.prototype.INVOICECOUNTRY_ATTRIBUTE_ID = 746;

/**
 * The id of the invoiceName attribute.
 */
tutao.entity.sys.AccountingInfo.prototype.INVOICENAME_ATTRIBUTE_ID = 744;

/**
 * The id of the lastInvoiceNbrOfSentSms attribute.
 */
tutao.entity.sys.AccountingInfo.prototype.LASTINVOICENBROFSENTSMS_ATTRIBUTE_ID = 593;

/**
 * The id of the lastInvoiceTimestamp attribute.
 */
tutao.entity.sys.AccountingInfo.prototype.LASTINVOICETIMESTAMP_ATTRIBUTE_ID = 592;

/**
 * The id of the paymentMethod attribute.
 */
tutao.entity.sys.AccountingInfo.prototype.PAYMENTMETHOD_ATTRIBUTE_ID = 747;

/**
 * The id of the invoiceInfo attribute.
 */
tutao.entity.sys.AccountingInfo.prototype.INVOICEINFO_ATTRIBUTE_ID = 748;

/**
 * Provides the id of this AccountingInfo.
 * @return {string} The id of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this AccountingInfo.
 * @param {string} format The format of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this AccountingInfo.
 * @return {string} The format of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this AccountingInfo.
 * @param {string} permissions The permissions of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this AccountingInfo.
 * @return {string} The permissions of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the invoiceAddress of this AccountingInfo.
 * @param {string} invoiceAddress The invoiceAddress of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setInvoiceAddress = function(invoiceAddress) {
  var dataToEncrypt = invoiceAddress;
  this._invoiceAddress = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the invoiceAddress of this AccountingInfo.
 * @return {string} The invoiceAddress of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getInvoiceAddress = function() {
  if (this._invoiceAddress == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._invoiceAddress);
  return value;
};

/**
 * Sets the invoiceCountry of this AccountingInfo.
 * @param {string} invoiceCountry The invoiceCountry of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setInvoiceCountry = function(invoiceCountry) {
  var dataToEncrypt = invoiceCountry;
  this._invoiceCountry = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the invoiceCountry of this AccountingInfo.
 * @return {string} The invoiceCountry of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getInvoiceCountry = function() {
  if (this._invoiceCountry == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._invoiceCountry);
  return value;
};

/**
 * Sets the invoiceName of this AccountingInfo.
 * @param {string} invoiceName The invoiceName of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setInvoiceName = function(invoiceName) {
  var dataToEncrypt = invoiceName;
  this._invoiceName = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the invoiceName of this AccountingInfo.
 * @return {string} The invoiceName of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getInvoiceName = function() {
  if (this._invoiceName == "") {
    return "";
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._invoiceName);
  return value;
};

/**
 * Sets the lastInvoiceNbrOfSentSms of this AccountingInfo.
 * @param {string} lastInvoiceNbrOfSentSms The lastInvoiceNbrOfSentSms of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setLastInvoiceNbrOfSentSms = function(lastInvoiceNbrOfSentSms) {
  this._lastInvoiceNbrOfSentSms = lastInvoiceNbrOfSentSms;
  return this;
};

/**
 * Provides the lastInvoiceNbrOfSentSms of this AccountingInfo.
 * @return {string} The lastInvoiceNbrOfSentSms of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getLastInvoiceNbrOfSentSms = function() {
  return this._lastInvoiceNbrOfSentSms;
};

/**
 * Sets the lastInvoiceTimestamp of this AccountingInfo.
 * @param {Date} lastInvoiceTimestamp The lastInvoiceTimestamp of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setLastInvoiceTimestamp = function(lastInvoiceTimestamp) {
  if (lastInvoiceTimestamp == null) {
    this._lastInvoiceTimestamp = null;
  } else {
    this._lastInvoiceTimestamp = String(lastInvoiceTimestamp.getTime());
  }
  return this;
};

/**
 * Provides the lastInvoiceTimestamp of this AccountingInfo.
 * @return {Date} The lastInvoiceTimestamp of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getLastInvoiceTimestamp = function() {
  if (this._lastInvoiceTimestamp == null) {
    return null;
  }
  if (isNaN(this._lastInvoiceTimestamp)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._lastInvoiceTimestamp);
  }
  return new Date(Number(this._lastInvoiceTimestamp));
};

/**
 * Sets the paymentMethod of this AccountingInfo.
 * @param {string} paymentMethod The paymentMethod of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setPaymentMethod = function(paymentMethod) {
  if (paymentMethod == null) {
    this._paymentMethod = null;
  } else {
    var dataToEncrypt = paymentMethod;
    this._paymentMethod = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  }
  return this;
};

/**
 * Provides the paymentMethod of this AccountingInfo.
 * @return {string} The paymentMethod of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getPaymentMethod = function() {
  if (this._paymentMethod == null) {
    return null;
  }
  var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._paymentMethod);
  return value;
};

/**
 * Sets the invoiceInfo of this AccountingInfo.
 * @param {string} invoiceInfo The invoiceInfo of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setInvoiceInfo = function(invoiceInfo) {
  this._invoiceInfo = invoiceInfo;
  return this;
};

/**
 * Provides the invoiceInfo of this AccountingInfo.
 * @return {string} The invoiceInfo of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getInvoiceInfo = function() {
  return this._invoiceInfo;
};

/**
 * Loads the invoiceInfo of this AccountingInfo.
 * @return {Promise.<tutao.entity.sys.InvoiceInfo>} Resolves to the loaded invoiceInfo of this AccountingInfo or an exception if the loading failed.
 */
tutao.entity.sys.AccountingInfo.prototype.loadInvoiceInfo = function() {
  return tutao.entity.sys.InvoiceInfo.load(this._invoiceInfo);
};

/**
 * Loads a AccountingInfo from the server.
 * @param {string} id The id of the AccountingInfo.
 * @return {Promise.<tutao.entity.sys.AccountingInfo>} Resolves to the AccountingInfo or an exception if the loading failed.
 */
tutao.entity.sys.AccountingInfo.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.AccountingInfo, tutao.entity.sys.AccountingInfo.PATH, id, null, {"v" : 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads a version of this AccountingInfo from the server.
 * @param {string} versionId The id of the requested version.
 * @return {Promise.<tutao.entity.sys.AccountingInfo>} Resolves to AccountingInfo or an exception if the loading failed.
 */
tutao.entity.sys.AccountingInfo.prototype.loadVersion = function(versionId) {
  var map = {};
  map["version"] = versionId;
  map["v"] = 9;
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.AccountingInfo, tutao.entity.sys.AccountingInfo.PATH, this.getId(), null, map, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Loads information about all versions of this AccountingInfo from the server.
 * @return {Promise.<tutao.entity.sys.VersionReturn>} Resolves to an tutao.entity.sys.VersionReturn or an exception if the loading failed.
 */
tutao.entity.sys.AccountingInfo.prototype.loadVersionInfo = function() {
  var versionData = new tutao.entity.sys.VersionData()
    .setApplication("sys")
    .setType(143)
    .setId(this.getId());
  return tutao.entity.sys.VersionReturn.load(versionData, {}, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Loads multiple AccountingInfos from the server.
 * @param {Array.<string>} ids The ids of the AccountingInfos to load.
 * @return {Promise.<Array.<tutao.entity.sys.AccountingInfo>>} Resolves to an array of AccountingInfo or rejects with an exception if the loading failed.
 */
tutao.entity.sys.AccountingInfo.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.AccountingInfo, tutao.entity.sys.AccountingInfo.PATH, ids, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates this AccountingInfo on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.AccountingInfo.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.AccountingInfo.PATH, this, {"v": 9}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.AccountingInfo.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.AccountingInfo.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
