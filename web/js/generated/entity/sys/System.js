"use strict";

tutao.provide('tutao.entity.sys.System');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.System = function(data) {
  if (data) {
    this.__format = data._format;
    this.__id = data._id;
    this.__permissions = data._permissions;
    this._lastInvoiceNbr = data.lastInvoiceNbr;
    this._freeCustomerInfos = data.freeCustomerInfos;
    this._freeGroup = data.freeGroup;
    this._premiumCustomerInfos = data.premiumCustomerInfos;
    this._premiumGroup = data.premiumGroup;
    this._registrationDataList = data.registrationDataList;
    this._starterCustomerInfos = data.starterCustomerInfos;
    this._starterGroup = data.starterGroup;
    this._streamCustomerInfos = data.streamCustomerInfos;
    this._streamGroup = data.streamGroup;
    this._systemAdminGroup = data.systemAdminGroup;
    this._systemCustomer = data.systemCustomer;
    this._systemCustomerInfo = data.systemCustomerInfo;
    this._systemUserGroup = data.systemUserGroup;
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._lastInvoiceNbr = null;
    this._freeCustomerInfos = null;
    this._freeGroup = null;
    this._premiumCustomerInfos = null;
    this._premiumGroup = null;
    this._registrationDataList = null;
    this._starterCustomerInfos = null;
    this._starterGroup = null;
    this._streamCustomerInfos = null;
    this._streamGroup = null;
    this._systemAdminGroup = null;
    this._systemCustomer = null;
    this._systemCustomerInfo = null;
    this._systemUserGroup = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.System.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.System.MODEL_VERSION = '5';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.System.PATH = '/rest/sys/system';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.System.ROOT_INSTANCE_ID = 'A3N5cwAAsQ';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.System.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.System.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.System.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    lastInvoiceNbr: this._lastInvoiceNbr, 
    freeCustomerInfos: this._freeCustomerInfos, 
    freeGroup: this._freeGroup, 
    premiumCustomerInfos: this._premiumCustomerInfos, 
    premiumGroup: this._premiumGroup, 
    registrationDataList: this._registrationDataList, 
    starterCustomerInfos: this._starterCustomerInfos, 
    starterGroup: this._starterGroup, 
    streamCustomerInfos: this._streamCustomerInfos, 
    streamGroup: this._streamGroup, 
    systemAdminGroup: this._systemAdminGroup, 
    systemCustomer: this._systemCustomer, 
    systemCustomerInfo: this._systemCustomerInfo, 
    systemUserGroup: this._systemUserGroup
  };
};

/**
 * The id of the System type.
 */
tutao.entity.sys.System.prototype.TYPE_ID = 177;

/**
 * The id of the lastInvoiceNbr attribute.
 */
tutao.entity.sys.System.prototype.LASTINVOICENBR_ATTRIBUTE_ID = 591;

/**
 * The id of the freeCustomerInfos attribute.
 */
tutao.entity.sys.System.prototype.FREECUSTOMERINFOS_ATTRIBUTE_ID = 183;

/**
 * The id of the freeGroup attribute.
 */
tutao.entity.sys.System.prototype.FREEGROUP_ATTRIBUTE_ID = 191;

/**
 * The id of the premiumCustomerInfos attribute.
 */
tutao.entity.sys.System.prototype.PREMIUMCUSTOMERINFOS_ATTRIBUTE_ID = 185;

/**
 * The id of the premiumGroup attribute.
 */
tutao.entity.sys.System.prototype.PREMIUMGROUP_ATTRIBUTE_ID = 190;

/**
 * The id of the registrationDataList attribute.
 */
tutao.entity.sys.System.prototype.REGISTRATIONDATALIST_ATTRIBUTE_ID = 194;

/**
 * The id of the starterCustomerInfos attribute.
 */
tutao.entity.sys.System.prototype.STARTERCUSTOMERINFOS_ATTRIBUTE_ID = 184;

/**
 * The id of the starterGroup attribute.
 */
tutao.entity.sys.System.prototype.STARTERGROUP_ATTRIBUTE_ID = 192;

/**
 * The id of the streamCustomerInfos attribute.
 */
tutao.entity.sys.System.prototype.STREAMCUSTOMERINFOS_ATTRIBUTE_ID = 186;

/**
 * The id of the streamGroup attribute.
 */
tutao.entity.sys.System.prototype.STREAMGROUP_ATTRIBUTE_ID = 193;

/**
 * The id of the systemAdminGroup attribute.
 */
tutao.entity.sys.System.prototype.SYSTEMADMINGROUP_ATTRIBUTE_ID = 189;

/**
 * The id of the systemCustomer attribute.
 */
tutao.entity.sys.System.prototype.SYSTEMCUSTOMER_ATTRIBUTE_ID = 187;

/**
 * The id of the systemCustomerInfo attribute.
 */
tutao.entity.sys.System.prototype.SYSTEMCUSTOMERINFO_ATTRIBUTE_ID = 182;

/**
 * The id of the systemUserGroup attribute.
 */
tutao.entity.sys.System.prototype.SYSTEMUSERGROUP_ATTRIBUTE_ID = 188;

/**
 * Provides the id of this System.
 * @return {string} The id of this System.
 */
tutao.entity.sys.System.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this System.
 * @param {string} format The format of this System.
 */
tutao.entity.sys.System.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this System.
 * @return {string} The format of this System.
 */
tutao.entity.sys.System.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this System.
 * @param {string} permissions The permissions of this System.
 */
tutao.entity.sys.System.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this System.
 * @return {string} The permissions of this System.
 */
tutao.entity.sys.System.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the lastInvoiceNbr of this System.
 * @param {string} lastInvoiceNbr The lastInvoiceNbr of this System.
 */
tutao.entity.sys.System.prototype.setLastInvoiceNbr = function(lastInvoiceNbr) {
  this._lastInvoiceNbr = lastInvoiceNbr;
  return this;
};

/**
 * Provides the lastInvoiceNbr of this System.
 * @return {string} The lastInvoiceNbr of this System.
 */
tutao.entity.sys.System.prototype.getLastInvoiceNbr = function() {
  return this._lastInvoiceNbr;
};

/**
 * Sets the freeCustomerInfos of this System.
 * @param {string} freeCustomerInfos The freeCustomerInfos of this System.
 */
tutao.entity.sys.System.prototype.setFreeCustomerInfos = function(freeCustomerInfos) {
  this._freeCustomerInfos = freeCustomerInfos;
  return this;
};

/**
 * Provides the freeCustomerInfos of this System.
 * @return {string} The freeCustomerInfos of this System.
 */
tutao.entity.sys.System.prototype.getFreeCustomerInfos = function() {
  return this._freeCustomerInfos;
};

/**
 * Sets the freeGroup of this System.
 * @param {string} freeGroup The freeGroup of this System.
 */
tutao.entity.sys.System.prototype.setFreeGroup = function(freeGroup) {
  this._freeGroup = freeGroup;
  return this;
};

/**
 * Provides the freeGroup of this System.
 * @return {string} The freeGroup of this System.
 */
tutao.entity.sys.System.prototype.getFreeGroup = function() {
  return this._freeGroup;
};

/**
 * Loads the freeGroup of this System.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded freeGroup of this System or an exception if the loading failed.
 */
tutao.entity.sys.System.prototype.loadFreeGroup = function() {
  return tutao.entity.sys.Group.load(this._freeGroup);
};

/**
 * Sets the premiumCustomerInfos of this System.
 * @param {string} premiumCustomerInfos The premiumCustomerInfos of this System.
 */
tutao.entity.sys.System.prototype.setPremiumCustomerInfos = function(premiumCustomerInfos) {
  this._premiumCustomerInfos = premiumCustomerInfos;
  return this;
};

/**
 * Provides the premiumCustomerInfos of this System.
 * @return {string} The premiumCustomerInfos of this System.
 */
tutao.entity.sys.System.prototype.getPremiumCustomerInfos = function() {
  return this._premiumCustomerInfos;
};

/**
 * Sets the premiumGroup of this System.
 * @param {string} premiumGroup The premiumGroup of this System.
 */
tutao.entity.sys.System.prototype.setPremiumGroup = function(premiumGroup) {
  this._premiumGroup = premiumGroup;
  return this;
};

/**
 * Provides the premiumGroup of this System.
 * @return {string} The premiumGroup of this System.
 */
tutao.entity.sys.System.prototype.getPremiumGroup = function() {
  return this._premiumGroup;
};

/**
 * Loads the premiumGroup of this System.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded premiumGroup of this System or an exception if the loading failed.
 */
tutao.entity.sys.System.prototype.loadPremiumGroup = function() {
  return tutao.entity.sys.Group.load(this._premiumGroup);
};

/**
 * Sets the registrationDataList of this System.
 * @param {string} registrationDataList The registrationDataList of this System.
 */
tutao.entity.sys.System.prototype.setRegistrationDataList = function(registrationDataList) {
  this._registrationDataList = registrationDataList;
  return this;
};

/**
 * Provides the registrationDataList of this System.
 * @return {string} The registrationDataList of this System.
 */
tutao.entity.sys.System.prototype.getRegistrationDataList = function() {
  return this._registrationDataList;
};

/**
 * Sets the starterCustomerInfos of this System.
 * @param {string} starterCustomerInfos The starterCustomerInfos of this System.
 */
tutao.entity.sys.System.prototype.setStarterCustomerInfos = function(starterCustomerInfos) {
  this._starterCustomerInfos = starterCustomerInfos;
  return this;
};

/**
 * Provides the starterCustomerInfos of this System.
 * @return {string} The starterCustomerInfos of this System.
 */
tutao.entity.sys.System.prototype.getStarterCustomerInfos = function() {
  return this._starterCustomerInfos;
};

/**
 * Sets the starterGroup of this System.
 * @param {string} starterGroup The starterGroup of this System.
 */
tutao.entity.sys.System.prototype.setStarterGroup = function(starterGroup) {
  this._starterGroup = starterGroup;
  return this;
};

/**
 * Provides the starterGroup of this System.
 * @return {string} The starterGroup of this System.
 */
tutao.entity.sys.System.prototype.getStarterGroup = function() {
  return this._starterGroup;
};

/**
 * Loads the starterGroup of this System.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded starterGroup of this System or an exception if the loading failed.
 */
tutao.entity.sys.System.prototype.loadStarterGroup = function() {
  return tutao.entity.sys.Group.load(this._starterGroup);
};

/**
 * Sets the streamCustomerInfos of this System.
 * @param {string} streamCustomerInfos The streamCustomerInfos of this System.
 */
tutao.entity.sys.System.prototype.setStreamCustomerInfos = function(streamCustomerInfos) {
  this._streamCustomerInfos = streamCustomerInfos;
  return this;
};

/**
 * Provides the streamCustomerInfos of this System.
 * @return {string} The streamCustomerInfos of this System.
 */
tutao.entity.sys.System.prototype.getStreamCustomerInfos = function() {
  return this._streamCustomerInfos;
};

/**
 * Sets the streamGroup of this System.
 * @param {string} streamGroup The streamGroup of this System.
 */
tutao.entity.sys.System.prototype.setStreamGroup = function(streamGroup) {
  this._streamGroup = streamGroup;
  return this;
};

/**
 * Provides the streamGroup of this System.
 * @return {string} The streamGroup of this System.
 */
tutao.entity.sys.System.prototype.getStreamGroup = function() {
  return this._streamGroup;
};

/**
 * Loads the streamGroup of this System.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded streamGroup of this System or an exception if the loading failed.
 */
tutao.entity.sys.System.prototype.loadStreamGroup = function() {
  return tutao.entity.sys.Group.load(this._streamGroup);
};

/**
 * Sets the systemAdminGroup of this System.
 * @param {string} systemAdminGroup The systemAdminGroup of this System.
 */
tutao.entity.sys.System.prototype.setSystemAdminGroup = function(systemAdminGroup) {
  this._systemAdminGroup = systemAdminGroup;
  return this;
};

/**
 * Provides the systemAdminGroup of this System.
 * @return {string} The systemAdminGroup of this System.
 */
tutao.entity.sys.System.prototype.getSystemAdminGroup = function() {
  return this._systemAdminGroup;
};

/**
 * Loads the systemAdminGroup of this System.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded systemAdminGroup of this System or an exception if the loading failed.
 */
tutao.entity.sys.System.prototype.loadSystemAdminGroup = function() {
  return tutao.entity.sys.Group.load(this._systemAdminGroup);
};

/**
 * Sets the systemCustomer of this System.
 * @param {string} systemCustomer The systemCustomer of this System.
 */
tutao.entity.sys.System.prototype.setSystemCustomer = function(systemCustomer) {
  this._systemCustomer = systemCustomer;
  return this;
};

/**
 * Provides the systemCustomer of this System.
 * @return {string} The systemCustomer of this System.
 */
tutao.entity.sys.System.prototype.getSystemCustomer = function() {
  return this._systemCustomer;
};

/**
 * Loads the systemCustomer of this System.
 * @return {Promise.<tutao.entity.sys.Customer>} Resolves to the loaded systemCustomer of this System or an exception if the loading failed.
 */
tutao.entity.sys.System.prototype.loadSystemCustomer = function() {
  return tutao.entity.sys.Customer.load(this._systemCustomer);
};

/**
 * Sets the systemCustomerInfo of this System.
 * @param {string} systemCustomerInfo The systemCustomerInfo of this System.
 */
tutao.entity.sys.System.prototype.setSystemCustomerInfo = function(systemCustomerInfo) {
  this._systemCustomerInfo = systemCustomerInfo;
  return this;
};

/**
 * Provides the systemCustomerInfo of this System.
 * @return {string} The systemCustomerInfo of this System.
 */
tutao.entity.sys.System.prototype.getSystemCustomerInfo = function() {
  return this._systemCustomerInfo;
};

/**
 * Sets the systemUserGroup of this System.
 * @param {string} systemUserGroup The systemUserGroup of this System.
 */
tutao.entity.sys.System.prototype.setSystemUserGroup = function(systemUserGroup) {
  this._systemUserGroup = systemUserGroup;
  return this;
};

/**
 * Provides the systemUserGroup of this System.
 * @return {string} The systemUserGroup of this System.
 */
tutao.entity.sys.System.prototype.getSystemUserGroup = function() {
  return this._systemUserGroup;
};

/**
 * Loads the systemUserGroup of this System.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded systemUserGroup of this System or an exception if the loading failed.
 */
tutao.entity.sys.System.prototype.loadSystemUserGroup = function() {
  return tutao.entity.sys.Group.load(this._systemUserGroup);
};

/**
 * Loads a System from the server.
 * @param {string} id The id of the System.
 * @return {Promise.<tutao.entity.sys.System>} Resolves to the System or an exception if the loading failed.
 */
tutao.entity.sys.System.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.System, tutao.entity.sys.System.PATH, id, null, {"v" : 5}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple Systems from the server.
 * @param {Array.<string>} ids The ids of the Systems to load.
 * @return {Promise.<Array.<tutao.entity.sys.System>>} Resolves to an array of System or rejects with an exception if the loading failed.
 */
tutao.entity.sys.System.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.System, tutao.entity.sys.System.PATH, ids, {"v": 5}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.System.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.System.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
