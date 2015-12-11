"use strict";

tutao.provide('tutao.entity.sys.Customer');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Customer = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._approvalStatus = null;
    this._canceledPremiumAccount = null;
    this._type = null;
    this._adminGroup = null;
    this._adminGroups = null;
    this._customerGroup = null;
    this._customerGroups = null;
    this._customerInfo = null;
    this._properties = null;
    this._serverProperties = null;
    this._teamGroups = null;
    this._userGroups = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.Customer.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Customer.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__permissions = data._permissions;
  this._approvalStatus = data.approvalStatus;
  this._canceledPremiumAccount = data.canceledPremiumAccount;
  this._type = data.type;
  this._adminGroup = data.adminGroup;
  this._adminGroups = data.adminGroups;
  this._customerGroup = data.customerGroup;
  this._customerGroups = data.customerGroups;
  this._customerInfo = data.customerInfo;
  this._properties = data.properties;
  this._serverProperties = data.serverProperties;
  this._teamGroups = data.teamGroups;
  this._userGroups = data.userGroups;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.Customer.MODEL_VERSION = '14';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.Customer.PATH = '/rest/sys/customer';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.Customer.ROOT_INSTANCE_ID = 'A3N5cwAf';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.Customer.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.Customer.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Customer.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    approvalStatus: this._approvalStatus, 
    canceledPremiumAccount: this._canceledPremiumAccount, 
    type: this._type, 
    adminGroup: this._adminGroup, 
    adminGroups: this._adminGroups, 
    customerGroup: this._customerGroup, 
    customerGroups: this._customerGroups, 
    customerInfo: this._customerInfo, 
    properties: this._properties, 
    serverProperties: this._serverProperties, 
    teamGroups: this._teamGroups, 
    userGroups: this._userGroups
  };
};

/**
 * The id of the Customer type.
 */
tutao.entity.sys.Customer.prototype.TYPE_ID = 31;

/**
 * The id of the approvalStatus attribute.
 */
tutao.entity.sys.Customer.prototype.APPROVALSTATUS_ATTRIBUTE_ID = 926;

/**
 * The id of the canceledPremiumAccount attribute.
 */
tutao.entity.sys.Customer.prototype.CANCELEDPREMIUMACCOUNT_ATTRIBUTE_ID = 902;

/**
 * The id of the type attribute.
 */
tutao.entity.sys.Customer.prototype.TYPE_ATTRIBUTE_ID = 36;

/**
 * The id of the adminGroup attribute.
 */
tutao.entity.sys.Customer.prototype.ADMINGROUP_ATTRIBUTE_ID = 37;

/**
 * The id of the adminGroups attribute.
 */
tutao.entity.sys.Customer.prototype.ADMINGROUPS_ATTRIBUTE_ID = 39;

/**
 * The id of the customerGroup attribute.
 */
tutao.entity.sys.Customer.prototype.CUSTOMERGROUP_ATTRIBUTE_ID = 38;

/**
 * The id of the customerGroups attribute.
 */
tutao.entity.sys.Customer.prototype.CUSTOMERGROUPS_ATTRIBUTE_ID = 40;

/**
 * The id of the customerInfo attribute.
 */
tutao.entity.sys.Customer.prototype.CUSTOMERINFO_ATTRIBUTE_ID = 160;

/**
 * The id of the properties attribute.
 */
tutao.entity.sys.Customer.prototype.PROPERTIES_ATTRIBUTE_ID = 662;

/**
 * The id of the serverProperties attribute.
 */
tutao.entity.sys.Customer.prototype.SERVERPROPERTIES_ATTRIBUTE_ID = 960;

/**
 * The id of the teamGroups attribute.
 */
tutao.entity.sys.Customer.prototype.TEAMGROUPS_ATTRIBUTE_ID = 42;

/**
 * The id of the userGroups attribute.
 */
tutao.entity.sys.Customer.prototype.USERGROUPS_ATTRIBUTE_ID = 41;

/**
 * Provides the id of this Customer.
 * @return {string} The id of this Customer.
 */
tutao.entity.sys.Customer.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this Customer.
 * @param {string} format The format of this Customer.
 */
tutao.entity.sys.Customer.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Customer.
 * @return {string} The format of this Customer.
 */
tutao.entity.sys.Customer.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this Customer.
 * @param {string} permissions The permissions of this Customer.
 */
tutao.entity.sys.Customer.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Customer.
 * @return {string} The permissions of this Customer.
 */
tutao.entity.sys.Customer.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the approvalStatus of this Customer.
 * @param {string} approvalStatus The approvalStatus of this Customer.
 */
tutao.entity.sys.Customer.prototype.setApprovalStatus = function(approvalStatus) {
  this._approvalStatus = approvalStatus;
  return this;
};

/**
 * Provides the approvalStatus of this Customer.
 * @return {string} The approvalStatus of this Customer.
 */
tutao.entity.sys.Customer.prototype.getApprovalStatus = function() {
  return this._approvalStatus;
};

/**
 * Sets the canceledPremiumAccount of this Customer.
 * @param {boolean} canceledPremiumAccount The canceledPremiumAccount of this Customer.
 */
tutao.entity.sys.Customer.prototype.setCanceledPremiumAccount = function(canceledPremiumAccount) {
  this._canceledPremiumAccount = canceledPremiumAccount ? '1' : '0';
  return this;
};

/**
 * Provides the canceledPremiumAccount of this Customer.
 * @return {boolean} The canceledPremiumAccount of this Customer.
 */
tutao.entity.sys.Customer.prototype.getCanceledPremiumAccount = function() {
  return this._canceledPremiumAccount != '0';
};

/**
 * Sets the type of this Customer.
 * @param {string} type The type of this Customer.
 */
tutao.entity.sys.Customer.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this Customer.
 * @return {string} The type of this Customer.
 */
tutao.entity.sys.Customer.prototype.getType = function() {
  return this._type;
};

/**
 * Sets the adminGroup of this Customer.
 * @param {string} adminGroup The adminGroup of this Customer.
 */
tutao.entity.sys.Customer.prototype.setAdminGroup = function(adminGroup) {
  this._adminGroup = adminGroup;
  return this;
};

/**
 * Provides the adminGroup of this Customer.
 * @return {string} The adminGroup of this Customer.
 */
tutao.entity.sys.Customer.prototype.getAdminGroup = function() {
  return this._adminGroup;
};

/**
 * Loads the adminGroup of this Customer.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded adminGroup of this Customer or an exception if the loading failed.
 */
tutao.entity.sys.Customer.prototype.loadAdminGroup = function() {
  return tutao.entity.sys.Group.load(this._adminGroup);
};

/**
 * Sets the adminGroups of this Customer.
 * @param {string} adminGroups The adminGroups of this Customer.
 */
tutao.entity.sys.Customer.prototype.setAdminGroups = function(adminGroups) {
  this._adminGroups = adminGroups;
  return this;
};

/**
 * Provides the adminGroups of this Customer.
 * @return {string} The adminGroups of this Customer.
 */
tutao.entity.sys.Customer.prototype.getAdminGroups = function() {
  return this._adminGroups;
};

/**
 * Sets the customerGroup of this Customer.
 * @param {string} customerGroup The customerGroup of this Customer.
 */
tutao.entity.sys.Customer.prototype.setCustomerGroup = function(customerGroup) {
  this._customerGroup = customerGroup;
  return this;
};

/**
 * Provides the customerGroup of this Customer.
 * @return {string} The customerGroup of this Customer.
 */
tutao.entity.sys.Customer.prototype.getCustomerGroup = function() {
  return this._customerGroup;
};

/**
 * Loads the customerGroup of this Customer.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded customerGroup of this Customer or an exception if the loading failed.
 */
tutao.entity.sys.Customer.prototype.loadCustomerGroup = function() {
  return tutao.entity.sys.Group.load(this._customerGroup);
};

/**
 * Sets the customerGroups of this Customer.
 * @param {string} customerGroups The customerGroups of this Customer.
 */
tutao.entity.sys.Customer.prototype.setCustomerGroups = function(customerGroups) {
  this._customerGroups = customerGroups;
  return this;
};

/**
 * Provides the customerGroups of this Customer.
 * @return {string} The customerGroups of this Customer.
 */
tutao.entity.sys.Customer.prototype.getCustomerGroups = function() {
  return this._customerGroups;
};

/**
 * Sets the customerInfo of this Customer.
 * @param {Array.<string>} customerInfo The customerInfo of this Customer.
 */
tutao.entity.sys.Customer.prototype.setCustomerInfo = function(customerInfo) {
  this._customerInfo = customerInfo;
  return this;
};

/**
 * Provides the customerInfo of this Customer.
 * @return {Array.<string>} The customerInfo of this Customer.
 */
tutao.entity.sys.Customer.prototype.getCustomerInfo = function() {
  return this._customerInfo;
};

/**
 * Loads the customerInfo of this Customer.
 * @return {Promise.<tutao.entity.sys.CustomerInfo>} Resolves to the loaded customerInfo of this Customer or an exception if the loading failed.
 */
tutao.entity.sys.Customer.prototype.loadCustomerInfo = function() {
  return tutao.entity.sys.CustomerInfo.load(this._customerInfo);
};

/**
 * Sets the properties of this Customer.
 * @param {string} properties The properties of this Customer.
 */
tutao.entity.sys.Customer.prototype.setProperties = function(properties) {
  this._properties = properties;
  return this;
};

/**
 * Provides the properties of this Customer.
 * @return {string} The properties of this Customer.
 */
tutao.entity.sys.Customer.prototype.getProperties = function() {
  return this._properties;
};

/**
 * Loads the properties of this Customer.
 * @return {Promise.<tutao.entity.sys.CustomerProperties>} Resolves to the loaded properties of this Customer or an exception if the loading failed.
 */
tutao.entity.sys.Customer.prototype.loadProperties = function() {
  return tutao.entity.sys.CustomerProperties.load(this._properties);
};

/**
 * Sets the serverProperties of this Customer.
 * @param {string} serverProperties The serverProperties of this Customer.
 */
tutao.entity.sys.Customer.prototype.setServerProperties = function(serverProperties) {
  this._serverProperties = serverProperties;
  return this;
};

/**
 * Provides the serverProperties of this Customer.
 * @return {string} The serverProperties of this Customer.
 */
tutao.entity.sys.Customer.prototype.getServerProperties = function() {
  return this._serverProperties;
};

/**
 * Loads the serverProperties of this Customer.
 * @return {Promise.<tutao.entity.sys.CustomerServerProperties>} Resolves to the loaded serverProperties of this Customer or an exception if the loading failed.
 */
tutao.entity.sys.Customer.prototype.loadServerProperties = function() {
  return tutao.entity.sys.CustomerServerProperties.load(this._serverProperties);
};

/**
 * Sets the teamGroups of this Customer.
 * @param {string} teamGroups The teamGroups of this Customer.
 */
tutao.entity.sys.Customer.prototype.setTeamGroups = function(teamGroups) {
  this._teamGroups = teamGroups;
  return this;
};

/**
 * Provides the teamGroups of this Customer.
 * @return {string} The teamGroups of this Customer.
 */
tutao.entity.sys.Customer.prototype.getTeamGroups = function() {
  return this._teamGroups;
};

/**
 * Sets the userGroups of this Customer.
 * @param {string} userGroups The userGroups of this Customer.
 */
tutao.entity.sys.Customer.prototype.setUserGroups = function(userGroups) {
  this._userGroups = userGroups;
  return this;
};

/**
 * Provides the userGroups of this Customer.
 * @return {string} The userGroups of this Customer.
 */
tutao.entity.sys.Customer.prototype.getUserGroups = function() {
  return this._userGroups;
};

/**
 * Loads a Customer from the server.
 * @param {string} id The id of the Customer.
 * @return {Promise.<tutao.entity.sys.Customer>} Resolves to the Customer or an exception if the loading failed.
 */
tutao.entity.sys.Customer.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.Customer, tutao.entity.sys.Customer.PATH, id, null, {"v" : 14}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple Customers from the server.
 * @param {Array.<string>} ids The ids of the Customers to load.
 * @return {Promise.<Array.<tutao.entity.sys.Customer>>} Resolves to an array of Customer or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Customer.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.Customer, tutao.entity.sys.Customer.PATH, ids, {"v": 14}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this Customer on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.Customer.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.Customer.PATH, this, {"v": 14}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.Customer.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.Customer.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.Customer.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
