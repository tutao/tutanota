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
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._business = null;
    this._invoiceAddress = null;
    this._invoiceAddress_ = null;
    this._invoiceCountry = null;
    this._invoiceCountry_ = null;
    this._invoiceName = null;
    this._invoiceName_ = null;
    this._invoiceVatIdNo = null;
    this._invoiceVatIdNo_ = null;
    this._lastInvoiceNbrOfSentSms = null;
    this._lastInvoiceTimestamp = null;
    this._paymentAccountIdentifier = null;
    this._paymentAccountIdentifier_ = null;
    this._paymentInterval = null;
    this._paymentMethod = null;
    this._paymentMethod_ = null;
    this._paymentMethodInfo = null;
    this._paymentMethodInfo_ = null;
    this._paymentProviderCustomerId = null;
    this._paymentProviderCustomerId_ = null;
    this._secondCountryInfo = null;
    this._secondCountryInfo_ = null;
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
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._business = data.business;
  this._invoiceAddress = data.invoiceAddress;
  this._invoiceAddress_ = null;
  this._invoiceCountry = data.invoiceCountry;
  this._invoiceCountry_ = null;
  this._invoiceName = data.invoiceName;
  this._invoiceName_ = null;
  this._invoiceVatIdNo = data.invoiceVatIdNo;
  this._invoiceVatIdNo_ = null;
  this._lastInvoiceNbrOfSentSms = data.lastInvoiceNbrOfSentSms;
  this._lastInvoiceTimestamp = data.lastInvoiceTimestamp;
  this._paymentAccountIdentifier = data.paymentAccountIdentifier;
  this._paymentAccountIdentifier_ = null;
  this._paymentInterval = data.paymentInterval;
  this._paymentMethod = data.paymentMethod;
  this._paymentMethod_ = null;
  this._paymentMethodInfo = data.paymentMethodInfo;
  this._paymentMethodInfo_ = null;
  this._paymentProviderCustomerId = data.paymentProviderCustomerId;
  this._paymentProviderCustomerId_ = null;
  this._secondCountryInfo = data.secondCountryInfo;
  this._secondCountryInfo_ = null;
  this._invoiceInfo = data.invoiceInfo;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.AccountingInfo.MODEL_VERSION = '23';

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
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    business: this._business, 
    invoiceAddress: this._invoiceAddress, 
    invoiceCountry: this._invoiceCountry, 
    invoiceName: this._invoiceName, 
    invoiceVatIdNo: this._invoiceVatIdNo, 
    lastInvoiceNbrOfSentSms: this._lastInvoiceNbrOfSentSms, 
    lastInvoiceTimestamp: this._lastInvoiceTimestamp, 
    paymentAccountIdentifier: this._paymentAccountIdentifier, 
    paymentInterval: this._paymentInterval, 
    paymentMethod: this._paymentMethod, 
    paymentMethodInfo: this._paymentMethodInfo, 
    paymentProviderCustomerId: this._paymentProviderCustomerId, 
    secondCountryInfo: this._secondCountryInfo, 
    invoiceInfo: this._invoiceInfo
  };
};

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
 * Sets the ownerEncSessionKey of this AccountingInfo.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this AccountingInfo.
 * @return {string} The ownerEncSessionKey of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this AccountingInfo.
 * @param {string} ownerGroup The ownerGroup of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this AccountingInfo.
 * @return {string} The ownerGroup of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
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
 * Sets the business of this AccountingInfo.
 * @param {boolean} business The business of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setBusiness = function(business) {
  this._business = business ? '1' : '0';
  return this;
};

/**
 * Provides the business of this AccountingInfo.
 * @return {boolean} The business of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getBusiness = function() {
  return this._business != '0';
};

/**
 * Sets the invoiceAddress of this AccountingInfo.
 * @param {string} invoiceAddress The invoiceAddress of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setInvoiceAddress = function(invoiceAddress) {
  var dataToEncrypt = invoiceAddress;
  this._invoiceAddress = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._invoiceAddress_ = invoiceAddress;
  return this;
};

/**
 * Provides the invoiceAddress of this AccountingInfo.
 * @return {string} The invoiceAddress of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getInvoiceAddress = function() {
  if (this._invoiceAddress_ != null) {
    return this._invoiceAddress_;
  }
  if (this._invoiceAddress == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._invoiceAddress);
    this._invoiceAddress_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the invoiceCountry of this AccountingInfo.
 * @param {string} invoiceCountry The invoiceCountry of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setInvoiceCountry = function(invoiceCountry) {
  if (invoiceCountry == null) {
    this._invoiceCountry = null;
    this._invoiceCountry_ = null;
  } else {
    var dataToEncrypt = invoiceCountry;
    this._invoiceCountry = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._invoiceCountry_ = invoiceCountry;
  }
  return this;
};

/**
 * Provides the invoiceCountry of this AccountingInfo.
 * @return {string} The invoiceCountry of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getInvoiceCountry = function() {
  if (this._invoiceCountry == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._invoiceCountry_ != null) {
    return this._invoiceCountry_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._invoiceCountry);
    this._invoiceCountry_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the invoiceName of this AccountingInfo.
 * @param {string} invoiceName The invoiceName of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setInvoiceName = function(invoiceName) {
  var dataToEncrypt = invoiceName;
  this._invoiceName = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._invoiceName_ = invoiceName;
  return this;
};

/**
 * Provides the invoiceName of this AccountingInfo.
 * @return {string} The invoiceName of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getInvoiceName = function() {
  if (this._invoiceName_ != null) {
    return this._invoiceName_;
  }
  if (this._invoiceName == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._invoiceName);
    this._invoiceName_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the invoiceVatIdNo of this AccountingInfo.
 * @param {string} invoiceVatIdNo The invoiceVatIdNo of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setInvoiceVatIdNo = function(invoiceVatIdNo) {
  var dataToEncrypt = invoiceVatIdNo;
  this._invoiceVatIdNo = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._invoiceVatIdNo_ = invoiceVatIdNo;
  return this;
};

/**
 * Provides the invoiceVatIdNo of this AccountingInfo.
 * @return {string} The invoiceVatIdNo of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getInvoiceVatIdNo = function() {
  if (this._invoiceVatIdNo_ != null) {
    return this._invoiceVatIdNo_;
  }
  if (this._invoiceVatIdNo == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._invoiceVatIdNo);
    this._invoiceVatIdNo_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
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
 * Sets the paymentAccountIdentifier of this AccountingInfo.
 * @param {string} paymentAccountIdentifier The paymentAccountIdentifier of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setPaymentAccountIdentifier = function(paymentAccountIdentifier) {
  if (paymentAccountIdentifier == null) {
    this._paymentAccountIdentifier = null;
    this._paymentAccountIdentifier_ = null;
  } else {
    var dataToEncrypt = paymentAccountIdentifier;
    this._paymentAccountIdentifier = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._paymentAccountIdentifier_ = paymentAccountIdentifier;
  }
  return this;
};

/**
 * Provides the paymentAccountIdentifier of this AccountingInfo.
 * @return {string} The paymentAccountIdentifier of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getPaymentAccountIdentifier = function() {
  if (this._paymentAccountIdentifier == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._paymentAccountIdentifier_ != null) {
    return this._paymentAccountIdentifier_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._paymentAccountIdentifier);
    this._paymentAccountIdentifier_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the paymentInterval of this AccountingInfo.
 * @param {string} paymentInterval The paymentInterval of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setPaymentInterval = function(paymentInterval) {
  this._paymentInterval = paymentInterval;
  return this;
};

/**
 * Provides the paymentInterval of this AccountingInfo.
 * @return {string} The paymentInterval of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getPaymentInterval = function() {
  return this._paymentInterval;
};

/**
 * Sets the paymentMethod of this AccountingInfo.
 * @param {string} paymentMethod The paymentMethod of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setPaymentMethod = function(paymentMethod) {
  if (paymentMethod == null) {
    this._paymentMethod = null;
    this._paymentMethod_ = null;
  } else {
    var dataToEncrypt = paymentMethod;
    this._paymentMethod = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._paymentMethod_ = paymentMethod;
  }
  return this;
};

/**
 * Provides the paymentMethod of this AccountingInfo.
 * @return {string} The paymentMethod of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getPaymentMethod = function() {
  if (this._paymentMethod == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._paymentMethod_ != null) {
    return this._paymentMethod_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._paymentMethod);
    this._paymentMethod_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "0";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the paymentMethodInfo of this AccountingInfo.
 * @param {string} paymentMethodInfo The paymentMethodInfo of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setPaymentMethodInfo = function(paymentMethodInfo) {
  if (paymentMethodInfo == null) {
    this._paymentMethodInfo = null;
    this._paymentMethodInfo_ = null;
  } else {
    var dataToEncrypt = paymentMethodInfo;
    this._paymentMethodInfo = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._paymentMethodInfo_ = paymentMethodInfo;
  }
  return this;
};

/**
 * Provides the paymentMethodInfo of this AccountingInfo.
 * @return {string} The paymentMethodInfo of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getPaymentMethodInfo = function() {
  if (this._paymentMethodInfo == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._paymentMethodInfo_ != null) {
    return this._paymentMethodInfo_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._paymentMethodInfo);
    this._paymentMethodInfo_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the paymentProviderCustomerId of this AccountingInfo.
 * @param {string} paymentProviderCustomerId The paymentProviderCustomerId of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setPaymentProviderCustomerId = function(paymentProviderCustomerId) {
  if (paymentProviderCustomerId == null) {
    this._paymentProviderCustomerId = null;
    this._paymentProviderCustomerId_ = null;
  } else {
    var dataToEncrypt = paymentProviderCustomerId;
    this._paymentProviderCustomerId = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._paymentProviderCustomerId_ = paymentProviderCustomerId;
  }
  return this;
};

/**
 * Provides the paymentProviderCustomerId of this AccountingInfo.
 * @return {string} The paymentProviderCustomerId of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getPaymentProviderCustomerId = function() {
  if (this._paymentProviderCustomerId == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._paymentProviderCustomerId_ != null) {
    return this._paymentProviderCustomerId_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._paymentProviderCustomerId);
    this._paymentProviderCustomerId_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "";
    } else {
      throw e;
    }
  }
};

/**
 * Sets the secondCountryInfo of this AccountingInfo.
 * @param {string} secondCountryInfo The secondCountryInfo of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.setSecondCountryInfo = function(secondCountryInfo) {
  var dataToEncrypt = secondCountryInfo;
  this._secondCountryInfo = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._secondCountryInfo_ = secondCountryInfo;
  return this;
};

/**
 * Provides the secondCountryInfo of this AccountingInfo.
 * @return {string} The secondCountryInfo of this AccountingInfo.
 */
tutao.entity.sys.AccountingInfo.prototype.getSecondCountryInfo = function() {
  if (this._secondCountryInfo_ != null) {
    return this._secondCountryInfo_;
  }
  if (this._secondCountryInfo == "" || !this._entityHelper.getSessionKey()) {
    return "0";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._secondCountryInfo);
    this._secondCountryInfo_ = value;
    return value;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return "0";
    } else {
      throw e;
    }
  }
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
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.AccountingInfo, tutao.entity.sys.AccountingInfo.PATH, id, null, {"v" : "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple AccountingInfos from the server.
 * @param {Array.<string>} ids The ids of the AccountingInfos to load.
 * @return {Promise.<Array.<tutao.entity.sys.AccountingInfo>>} Resolves to an array of AccountingInfo or rejects with an exception if the loading failed.
 */
tutao.entity.sys.AccountingInfo.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.AccountingInfo, tutao.entity.sys.AccountingInfo.PATH, ids, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.AccountingInfo.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "23";
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.AccountingInfo.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this AccountingInfo on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.AccountingInfo.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.AccountingInfo.PATH, this, {"v": "23"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
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
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.AccountingInfo.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
