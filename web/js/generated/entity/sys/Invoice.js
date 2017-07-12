"use strict";

tutao.provide('tutao.entity.sys.Invoice');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Invoice = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__listEncSessionKey = null;
    this.__ownerEncSessionKey = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._country = null;
    this._country_ = null;
    this._date = null;
    this._date_ = null;
    this._grandTotal = null;
    this._grandTotal_ = null;
    this._number = null;
    this._number_ = null;
    this._paymentMethod = null;
    this._paymentMethod_ = null;
    this._source = null;
    this._source_ = null;
    this._status = null;
    this._vat = null;
    this._vat_ = null;
    this._vatRate = null;
    this._vatRate_ = null;
    this._bookings = [];
    this._changes = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.Invoice.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Invoice.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__listEncSessionKey = data._listEncSessionKey;
  this.__ownerEncSessionKey = data._ownerEncSessionKey;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._country = data.country;
  this._country_ = null;
  this._date = data.date;
  this._date_ = null;
  this._grandTotal = data.grandTotal;
  this._grandTotal_ = null;
  this._number = data.number;
  this._number_ = null;
  this._paymentMethod = data.paymentMethod;
  this._paymentMethod_ = null;
  this._source = data.source;
  this._source_ = null;
  this._status = data.status;
  this._vat = data.vat;
  this._vat_ = null;
  this._vatRate = data.vatRate;
  this._vatRate_ = null;
  this._bookings = data.bookings;
  this._changes = data.changes;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.Invoice.MODEL_VERSION = '22';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.Invoice.PATH = '/rest/sys/invoice';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.Invoice.ROOT_INSTANCE_ID = 'A3N5cwAC4w';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.Invoice.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.Invoice.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Invoice.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _listEncSessionKey: this.__listEncSessionKey, 
    _ownerEncSessionKey: this.__ownerEncSessionKey, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    country: this._country, 
    date: this._date, 
    grandTotal: this._grandTotal, 
    number: this._number, 
    paymentMethod: this._paymentMethod, 
    source: this._source, 
    status: this._status, 
    vat: this._vat, 
    vatRate: this._vatRate, 
    bookings: this._bookings, 
    changes: this._changes
  };
};

/**
 * Provides the id of this Invoice.
 * @return {Array.<string>} The id of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this Invoice.
 * @param {string} format The format of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Invoice.
 * @return {string} The format of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the listEncSessionKey of this Invoice.
 * @param {string} listEncSessionKey The listEncSessionKey of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setListEncSessionKey = function(listEncSessionKey) {
  this.__listEncSessionKey = listEncSessionKey;
  return this;
};

/**
 * Provides the listEncSessionKey of this Invoice.
 * @return {string} The listEncSessionKey of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getListEncSessionKey = function() {
  return this.__listEncSessionKey;
};

/**
 * Sets the ownerEncSessionKey of this Invoice.
 * @param {string} ownerEncSessionKey The ownerEncSessionKey of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setOwnerEncSessionKey = function(ownerEncSessionKey) {
  this.__ownerEncSessionKey = ownerEncSessionKey;
  return this;
};

/**
 * Provides the ownerEncSessionKey of this Invoice.
 * @return {string} The ownerEncSessionKey of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getOwnerEncSessionKey = function() {
  return this.__ownerEncSessionKey;
};

/**
 * Sets the ownerGroup of this Invoice.
 * @param {string} ownerGroup The ownerGroup of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this Invoice.
 * @return {string} The ownerGroup of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this Invoice.
 * @param {string} permissions The permissions of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Invoice.
 * @return {string} The permissions of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the country of this Invoice.
 * @param {string} country The country of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setCountry = function(country) {
  var dataToEncrypt = country;
  this._country = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._country_ = country;
  return this;
};

/**
 * Provides the country of this Invoice.
 * @return {string} The country of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getCountry = function() {
  if (this._country_ != null) {
    return this._country_;
  }
  if (this._country == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._country);
    this._country_ = value;
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
 * Sets the date of this Invoice.
 * @param {Date} date The date of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setDate = function(date) {
  var dataToEncrypt = String(date.getTime());
  this._date = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._date_ = date;
  return this;
};

/**
 * Provides the date of this Invoice.
 * @return {Date} The date of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getDate = function() {
  if (this._date_ != null) {
    return this._date_;
  }
  if (this._date == "" || !this._entityHelper.getSessionKey()) {
    return new Date(0);
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._date);
    if (isNaN(value)) {
      this.getEntityHelper().invalidateSessionKey();
      return new Date(0);
    }
    this._date_ = new Date(Number(value));
    return this._date_;
  } catch (e) {
    if (e instanceof tutao.crypto.CryptoError) {
      this.getEntityHelper().invalidateSessionKey();
      return new Date(0);
    } else {
      throw e;
    }
  }
};

/**
 * Sets the grandTotal of this Invoice.
 * @param {string} grandTotal The grandTotal of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setGrandTotal = function(grandTotal) {
  var dataToEncrypt = grandTotal;
  this._grandTotal = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._grandTotal_ = grandTotal;
  return this;
};

/**
 * Provides the grandTotal of this Invoice.
 * @return {string} The grandTotal of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getGrandTotal = function() {
  if (this._grandTotal_ != null) {
    return this._grandTotal_;
  }
  if (this._grandTotal == "" || !this._entityHelper.getSessionKey()) {
    return "0";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._grandTotal);
    this._grandTotal_ = value;
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
 * Sets the number of this Invoice.
 * @param {string} number The number of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setNumber = function(number) {
  var dataToEncrypt = number;
  this._number = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._number_ = number;
  return this;
};

/**
 * Provides the number of this Invoice.
 * @return {string} The number of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getNumber = function() {
  if (this._number_ != null) {
    return this._number_;
  }
  if (this._number == "" || !this._entityHelper.getSessionKey()) {
    return "0";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._number);
    this._number_ = value;
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
 * Sets the paymentMethod of this Invoice.
 * @param {string} paymentMethod The paymentMethod of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setPaymentMethod = function(paymentMethod) {
  var dataToEncrypt = paymentMethod;
  this._paymentMethod = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._paymentMethod_ = paymentMethod;
  return this;
};

/**
 * Provides the paymentMethod of this Invoice.
 * @return {string} The paymentMethod of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getPaymentMethod = function() {
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
 * Sets the source of this Invoice.
 * @param {string} source The source of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setSource = function(source) {
  var dataToEncrypt = source;
  this._source = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._source_ = source;
  return this;
};

/**
 * Provides the source of this Invoice.
 * @return {string} The source of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getSource = function() {
  if (this._source_ != null) {
    return this._source_;
  }
  if (this._source == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._source);
    this._source_ = value;
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
 * Sets the status of this Invoice.
 * @param {string} status The status of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setStatus = function(status) {
  this._status = status;
  return this;
};

/**
 * Provides the status of this Invoice.
 * @return {string} The status of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getStatus = function() {
  return this._status;
};

/**
 * Sets the vat of this Invoice.
 * @param {string} vat The vat of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setVat = function(vat) {
  var dataToEncrypt = vat;
  this._vat = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._vat_ = vat;
  return this;
};

/**
 * Provides the vat of this Invoice.
 * @return {string} The vat of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getVat = function() {
  if (this._vat_ != null) {
    return this._vat_;
  }
  if (this._vat == "" || !this._entityHelper.getSessionKey()) {
    return "0";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._vat);
    this._vat_ = value;
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
 * Sets the vatRate of this Invoice.
 * @param {string} vatRate The vatRate of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.setVatRate = function(vatRate) {
  var dataToEncrypt = vatRate;
  this._vatRate = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  this._vatRate_ = vatRate;
  return this;
};

/**
 * Provides the vatRate of this Invoice.
 * @return {string} The vatRate of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getVatRate = function() {
  if (this._vatRate_ != null) {
    return this._vatRate_;
  }
  if (this._vatRate == "" || !this._entityHelper.getSessionKey()) {
    return "0";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._vatRate);
    this._vatRate_ = value;
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
 * Provides the bookings of this Invoice.
 * @return {Array.<Array.<string>>} The bookings of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getBookings = function() {
  return this._bookings;
};

/**
 * Provides the changes of this Invoice.
 * @return {Array.<Array.<string>>} The changes of this Invoice.
 */
tutao.entity.sys.Invoice.prototype.getChanges = function() {
  return this._changes;
};

/**
 * Loads a Invoice from the server.
 * @param {Array.<string>} id The id of the Invoice.
 * @return {Promise.<tutao.entity.sys.Invoice>} Resolves to the Invoice or an exception if the loading failed.
 */
tutao.entity.sys.Invoice.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.Invoice, tutao.entity.sys.Invoice.PATH, id[1], id[0], {"v" : "22"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads multiple Invoices from the server.
 * @param {Array.<Array.<string>>} ids The ids of the Invoices to load.
 * @return {Promise.<Array.<tutao.entity.sys.Invoice>>} Resolves to an array of Invoice or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Invoice.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.Invoice, tutao.entity.sys.Invoice.PATH, ids, {"v": "22"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Updates the ownerEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.Invoice.prototype.updateOwnerEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_OWNER_ENC_SESSION_KEY] = "true";
  params["v"] = "22";
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.Invoice.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this Invoice on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.Invoice.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.Invoice.PATH, this, {"v": "22"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of Invoices loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.Invoice>>} Resolves to an array of Invoice or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Invoice.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.Invoice, tutao.entity.sys.Invoice.PATH, listId, start, count, reverse, {"v": "22"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.Invoice.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.Invoice.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.Invoice.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
