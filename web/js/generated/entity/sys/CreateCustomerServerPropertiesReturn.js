"use strict";

tutao.provide('tutao.entity.sys.CreateCustomerServerPropertiesReturn');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._id = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype.updateData = function(data) {
  this.__format = data._format;
  this._id = data.id;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.MODEL_VERSION = '15';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    id: this._id
  };
};

/**
 * The id of the CreateCustomerServerPropertiesReturn type.
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype.TYPE_ID = 964;

/**
 * The id of the id attribute.
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype.ID_ATTRIBUTE_ID = 966;

/**
 * Sets the format of this CreateCustomerServerPropertiesReturn.
 * @param {string} format The format of this CreateCustomerServerPropertiesReturn.
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CreateCustomerServerPropertiesReturn.
 * @return {string} The format of this CreateCustomerServerPropertiesReturn.
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the id of this CreateCustomerServerPropertiesReturn.
 * @param {string} id The id of this CreateCustomerServerPropertiesReturn.
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype.setId = function(id) {
  this._id = id;
  return this;
};

/**
 * Provides the id of this CreateCustomerServerPropertiesReturn.
 * @return {string} The id of this CreateCustomerServerPropertiesReturn.
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype.getId = function() {
  return this._id;
};

/**
 * Loads the id of this CreateCustomerServerPropertiesReturn.
 * @return {Promise.<tutao.entity.sys.CustomerServerProperties>} Resolves to the loaded id of this CreateCustomerServerPropertiesReturn or an exception if the loading failed.
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype.loadId = function() {
  return tutao.entity.sys.CustomerServerProperties.load(this._id);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CreateCustomerServerPropertiesReturn.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
