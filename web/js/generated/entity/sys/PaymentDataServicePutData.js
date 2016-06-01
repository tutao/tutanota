"use strict";

tutao.provide('tutao.entity.sys.PaymentDataServicePutData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PaymentDataServicePutData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._business = null;
    this._confirmedCountry = null;
    this._confirmedCountry_ = null;
    this._invoiceAddress = null;
    this._invoiceAddress_ = null;
    this._invoiceCountry = null;
    this._invoiceCountry_ = null;
    this._invoiceName = null;
    this._invoiceName_ = null;
    this._invoiceVatIdNo = null;
    this._invoiceVatIdNo_ = null;
    this._paymentInterval = null;
    this._paymentMethod = null;
    this._paymentMethod_ = null;
    this._paymentMethodInfo = null;
    this._paymentMethodInfo_ = null;
    this._paymentToken = null;
    this._paymentToken_ = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PaymentDataServicePutData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._business = data.business;
  this._confirmedCountry = data.confirmedCountry;
  this._confirmedCountry_ = null;
  this._invoiceAddress = data.invoiceAddress;
  this._invoiceAddress_ = null;
  this._invoiceCountry = data.invoiceCountry;
  this._invoiceCountry_ = null;
  this._invoiceName = data.invoiceName;
  this._invoiceName_ = null;
  this._invoiceVatIdNo = data.invoiceVatIdNo;
  this._invoiceVatIdNo_ = null;
  this._paymentInterval = data.paymentInterval;
  this._paymentMethod = data.paymentMethod;
  this._paymentMethod_ = null;
  this._paymentMethodInfo = data.paymentMethodInfo;
  this._paymentMethodInfo_ = null;
  this._paymentToken = data.paymentToken;
  this._paymentToken_ = null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PaymentDataServicePutData.MODEL_VERSION = '17';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.PaymentDataServicePutData.PATH = '/rest/sys/paymentdataservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    business: this._business, 
    confirmedCountry: this._confirmedCountry, 
    invoiceAddress: this._invoiceAddress, 
    invoiceCountry: this._invoiceCountry, 
    invoiceName: this._invoiceName, 
    invoiceVatIdNo: this._invoiceVatIdNo, 
    paymentInterval: this._paymentInterval, 
    paymentMethod: this._paymentMethod, 
    paymentMethodInfo: this._paymentMethodInfo, 
    paymentToken: this._paymentToken
  };
};

/**
 * The id of the PaymentDataServicePutData type.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.TYPE_ID = 793;

/**
 * The id of the business attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.BUSINESS_ATTRIBUTE_ID = 795;

/**
 * The id of the confirmedCountry attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.CONFIRMEDCOUNTRY_ATTRIBUTE_ID = 804;

/**
 * The id of the invoiceAddress attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.INVOICEADDRESS_ATTRIBUTE_ID = 797;

/**
 * The id of the invoiceCountry attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.INVOICECOUNTRY_ATTRIBUTE_ID = 798;

/**
 * The id of the invoiceName attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.INVOICENAME_ATTRIBUTE_ID = 796;

/**
 * The id of the invoiceVatIdNo attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.INVOICEVATIDNO_ATTRIBUTE_ID = 799;

/**
 * The id of the paymentInterval attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.PAYMENTINTERVAL_ATTRIBUTE_ID = 802;

/**
 * The id of the paymentMethod attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.PAYMENTMETHOD_ATTRIBUTE_ID = 800;

/**
 * The id of the paymentMethodInfo attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.PAYMENTMETHODINFO_ATTRIBUTE_ID = 801;

/**
 * The id of the paymentToken attribute.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.PAYMENTTOKEN_ATTRIBUTE_ID = 803;

/**
 * Sets the format of this PaymentDataServicePutData.
 * @param {string} format The format of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PaymentDataServicePutData.
 * @return {string} The format of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the business of this PaymentDataServicePutData.
 * @param {boolean} business The business of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setBusiness = function(business) {
  this._business = business ? '1' : '0';
  return this;
};

/**
 * Provides the business of this PaymentDataServicePutData.
 * @return {boolean} The business of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getBusiness = function() {
  return this._business != '0';
};

/**
 * Sets the confirmedCountry of this PaymentDataServicePutData.
 * @param {string} confirmedCountry The confirmedCountry of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setConfirmedCountry = function(confirmedCountry) {
  if (confirmedCountry == null) {
    this._confirmedCountry = null;
    this._confirmedCountry_ = null;
  } else {
    var dataToEncrypt = confirmedCountry;
    this._confirmedCountry = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._confirmedCountry_ = confirmedCountry;
  }
  return this;
};

/**
 * Provides the confirmedCountry of this PaymentDataServicePutData.
 * @return {string} The confirmedCountry of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getConfirmedCountry = function() {
  if (this._confirmedCountry == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._confirmedCountry_ != null) {
    return this._confirmedCountry_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._confirmedCountry);
    this._confirmedCountry_ = value;
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
 * Sets the invoiceAddress of this PaymentDataServicePutData.
 * @param {string} invoiceAddress The invoiceAddress of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setInvoiceAddress = function(invoiceAddress) {
  var dataToEncrypt = invoiceAddress;
  this._invoiceAddress = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._invoiceAddress_ = invoiceAddress;
  return this;
};

/**
 * Provides the invoiceAddress of this PaymentDataServicePutData.
 * @return {string} The invoiceAddress of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getInvoiceAddress = function() {
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
 * Sets the invoiceCountry of this PaymentDataServicePutData.
 * @param {string} invoiceCountry The invoiceCountry of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setInvoiceCountry = function(invoiceCountry) {
  var dataToEncrypt = invoiceCountry;
  this._invoiceCountry = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._invoiceCountry_ = invoiceCountry;
  return this;
};

/**
 * Provides the invoiceCountry of this PaymentDataServicePutData.
 * @return {string} The invoiceCountry of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getInvoiceCountry = function() {
  if (this._invoiceCountry_ != null) {
    return this._invoiceCountry_;
  }
  if (this._invoiceCountry == "" || !this._entityHelper.getSessionKey()) {
    return "";
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
 * Sets the invoiceName of this PaymentDataServicePutData.
 * @param {string} invoiceName The invoiceName of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setInvoiceName = function(invoiceName) {
  var dataToEncrypt = invoiceName;
  this._invoiceName = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._invoiceName_ = invoiceName;
  return this;
};

/**
 * Provides the invoiceName of this PaymentDataServicePutData.
 * @return {string} The invoiceName of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getInvoiceName = function() {
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
 * Sets the invoiceVatIdNo of this PaymentDataServicePutData.
 * @param {string} invoiceVatIdNo The invoiceVatIdNo of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setInvoiceVatIdNo = function(invoiceVatIdNo) {
  var dataToEncrypt = invoiceVatIdNo;
  this._invoiceVatIdNo = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._invoiceVatIdNo_ = invoiceVatIdNo;
  return this;
};

/**
 * Provides the invoiceVatIdNo of this PaymentDataServicePutData.
 * @return {string} The invoiceVatIdNo of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getInvoiceVatIdNo = function() {
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
 * Sets the paymentInterval of this PaymentDataServicePutData.
 * @param {string} paymentInterval The paymentInterval of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setPaymentInterval = function(paymentInterval) {
  this._paymentInterval = paymentInterval;
  return this;
};

/**
 * Provides the paymentInterval of this PaymentDataServicePutData.
 * @return {string} The paymentInterval of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getPaymentInterval = function() {
  return this._paymentInterval;
};

/**
 * Sets the paymentMethod of this PaymentDataServicePutData.
 * @param {string} paymentMethod The paymentMethod of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setPaymentMethod = function(paymentMethod) {
  var dataToEncrypt = paymentMethod;
  this._paymentMethod = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._paymentMethod_ = paymentMethod;
  return this;
};

/**
 * Provides the paymentMethod of this PaymentDataServicePutData.
 * @return {string} The paymentMethod of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getPaymentMethod = function() {
  if (this._paymentMethod_ != null) {
    return this._paymentMethod_;
  }
  if (this._paymentMethod == "" || !this._entityHelper.getSessionKey()) {
    return "0";
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
 * Sets the paymentMethodInfo of this PaymentDataServicePutData.
 * @param {string} paymentMethodInfo The paymentMethodInfo of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setPaymentMethodInfo = function(paymentMethodInfo) {
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
 * Provides the paymentMethodInfo of this PaymentDataServicePutData.
 * @return {string} The paymentMethodInfo of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getPaymentMethodInfo = function() {
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
 * Sets the paymentToken of this PaymentDataServicePutData.
 * @param {string} paymentToken The paymentToken of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.setPaymentToken = function(paymentToken) {
  if (paymentToken == null) {
    this._paymentToken = null;
    this._paymentToken_ = null;
  } else {
    var dataToEncrypt = paymentToken;
    this._paymentToken = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
    this._paymentToken_ = paymentToken;
  }
  return this;
};

/**
 * Provides the paymentToken of this PaymentDataServicePutData.
 * @return {string} The paymentToken of this PaymentDataServicePutData.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getPaymentToken = function() {
  if (this._paymentToken == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  if (this._paymentToken_ != null) {
    return this._paymentToken_;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._paymentToken);
    this._paymentToken_ = value;
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
 * Updates this service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.PaymentDataServicePutReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.update = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "17";
  return tutao.locator.entityRestClient.putService(tutao.entity.sys.PaymentDataServicePutData.PATH, this, parameters, headers, tutao.entity.sys.PaymentDataServicePutReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PaymentDataServicePutData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
