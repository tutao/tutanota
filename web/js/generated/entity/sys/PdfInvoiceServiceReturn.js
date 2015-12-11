"use strict";

tutao.provide('tutao.entity.sys.PdfInvoiceServiceReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PdfInvoiceServiceReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._data = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.PdfInvoiceServiceReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.PdfInvoiceServiceReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._data = data.data;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.PdfInvoiceServiceReturn.MODEL_VERSION = '14';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.PdfInvoiceServiceReturn.PATH = '/rest/sys/pdfinvoiceservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.PdfInvoiceServiceReturn.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.PdfInvoiceServiceReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    data: this._data
  };
};

/**
 * The id of the PdfInvoiceServiceReturn type.
 */
tutao.entity.sys.PdfInvoiceServiceReturn.prototype.TYPE_ID = 780;

/**
 * The id of the data attribute.
 */
tutao.entity.sys.PdfInvoiceServiceReturn.prototype.DATA_ATTRIBUTE_ID = 782;

/**
 * Sets the format of this PdfInvoiceServiceReturn.
 * @param {string} format The format of this PdfInvoiceServiceReturn.
 */
tutao.entity.sys.PdfInvoiceServiceReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this PdfInvoiceServiceReturn.
 * @return {string} The format of this PdfInvoiceServiceReturn.
 */
tutao.entity.sys.PdfInvoiceServiceReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the data of this PdfInvoiceServiceReturn.
 * @param {string} data The data of this PdfInvoiceServiceReturn.
 */
tutao.entity.sys.PdfInvoiceServiceReturn.prototype.setData = function(data) {
  var dataToEncrypt = data;
  this._data = tutao.locator.aesCrypter.encryptBytes(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the data of this PdfInvoiceServiceReturn.
 * @return {string} The data of this PdfInvoiceServiceReturn.
 */
tutao.entity.sys.PdfInvoiceServiceReturn.prototype.getData = function() {
  if (this._data == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptBytes(this._entityHelper.getSessionKey(), this._data);
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
 * Loads from the service.
 * @param {tutao.entity.sys.PdfInvoiceServiceData} entity The entity to send to the service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.sys.PdfInvoiceServiceReturn>} Resolves to PdfInvoiceServiceReturn or an exception if the loading failed.
 */
tutao.entity.sys.PdfInvoiceServiceReturn.load = function(entity, parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = 14;
  return tutao.locator.entityRestClient.getService(tutao.entity.sys.PdfInvoiceServiceReturn, tutao.entity.sys.PdfInvoiceServiceReturn.PATH, entity, parameters, headers);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.PdfInvoiceServiceReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
