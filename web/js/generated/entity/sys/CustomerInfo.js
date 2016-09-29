"use strict";

tutao.provide('tutao.entity.sys.CustomerInfo');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerInfo = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._activationTime = null;
    this._company = null;
    this._creationTime = null;
    this._deletionReason = null;
    this._deletionTime = null;
    this._domain = null;
    this._includedEmailAliases = null;
    this._includedStorageCapacity = null;
    this._promotionEmailAliases = null;
    this._promotionStorageCapacity = null;
    this._registrationMailAddress = null;
    this._source = null;
    this._testEndTime = null;
    this._usedSharedEmailAliases = null;
    this._accountingInfo = null;
    this._bookings = null;
    this._customer = null;
    this._domainInfos = [];
    this._takeoverCustomer = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.CustomerInfo.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.CustomerInfo.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._activationTime = data.activationTime;
  this._company = data.company;
  this._creationTime = data.creationTime;
  this._deletionReason = data.deletionReason;
  this._deletionTime = data.deletionTime;
  this._domain = data.domain;
  this._includedEmailAliases = data.includedEmailAliases;
  this._includedStorageCapacity = data.includedStorageCapacity;
  this._promotionEmailAliases = data.promotionEmailAliases;
  this._promotionStorageCapacity = data.promotionStorageCapacity;
  this._registrationMailAddress = data.registrationMailAddress;
  this._source = data.source;
  this._testEndTime = data.testEndTime;
  this._usedSharedEmailAliases = data.usedSharedEmailAliases;
  this._accountingInfo = data.accountingInfo;
  this._bookings = (data.bookings) ? new tutao.entity.sys.BookingsRef(this, data.bookings) : null;
  this._customer = data.customer;
  this._domainInfos = [];
  for (var i=0; i < data.domainInfos.length; i++) {
    this._domainInfos.push(new tutao.entity.sys.DomainInfo(this, data.domainInfos[i]));
  }
  this._takeoverCustomer = data.takeoverCustomer;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.CustomerInfo.MODEL_VERSION = '19';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.CustomerInfo.PATH = '/rest/sys/customerinfo';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.CustomerInfo.ROOT_INSTANCE_ID = 'A3N5cwAAlA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.CustomerInfo.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.CustomerInfo.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.CustomerInfo.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    activationTime: this._activationTime, 
    company: this._company, 
    creationTime: this._creationTime, 
    deletionReason: this._deletionReason, 
    deletionTime: this._deletionTime, 
    domain: this._domain, 
    includedEmailAliases: this._includedEmailAliases, 
    includedStorageCapacity: this._includedStorageCapacity, 
    promotionEmailAliases: this._promotionEmailAliases, 
    promotionStorageCapacity: this._promotionStorageCapacity, 
    registrationMailAddress: this._registrationMailAddress, 
    source: this._source, 
    testEndTime: this._testEndTime, 
    usedSharedEmailAliases: this._usedSharedEmailAliases, 
    accountingInfo: this._accountingInfo, 
    bookings: tutao.entity.EntityHelper.aggregatesToJsonData(this._bookings), 
    customer: this._customer, 
    domainInfos: tutao.entity.EntityHelper.aggregatesToJsonData(this._domainInfos), 
    takeoverCustomer: this._takeoverCustomer
  };
};

/**
 * Provides the id of this CustomerInfo.
 * @return {Array.<string>} The id of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this CustomerInfo.
 * @param {string} format The format of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this CustomerInfo.
 * @return {string} The format of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this CustomerInfo.
 * @param {string} ownerGroup The ownerGroup of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this CustomerInfo.
 * @return {string} The ownerGroup of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this CustomerInfo.
 * @param {string} permissions The permissions of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this CustomerInfo.
 * @return {string} The permissions of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the activationTime of this CustomerInfo.
 * @param {Date} activationTime The activationTime of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setActivationTime = function(activationTime) {
  if (activationTime == null) {
    this._activationTime = null;
  } else {
    this._activationTime = String(activationTime.getTime());
  }
  return this;
};

/**
 * Provides the activationTime of this CustomerInfo.
 * @return {Date} The activationTime of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getActivationTime = function() {
  if (this._activationTime == null) {
    return null;
  }
  if (isNaN(this._activationTime)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._activationTime);
  }
  return new Date(Number(this._activationTime));
};

/**
 * Sets the company of this CustomerInfo.
 * @param {string} company The company of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setCompany = function(company) {
  this._company = company;
  return this;
};

/**
 * Provides the company of this CustomerInfo.
 * @return {string} The company of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getCompany = function() {
  return this._company;
};

/**
 * Sets the creationTime of this CustomerInfo.
 * @param {Date} creationTime The creationTime of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setCreationTime = function(creationTime) {
  this._creationTime = String(creationTime.getTime());
  return this;
};

/**
 * Provides the creationTime of this CustomerInfo.
 * @return {Date} The creationTime of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getCreationTime = function() {
  if (isNaN(this._creationTime)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._creationTime);
  }
  return new Date(Number(this._creationTime));
};

/**
 * Sets the deletionReason of this CustomerInfo.
 * @param {string} deletionReason The deletionReason of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setDeletionReason = function(deletionReason) {
  this._deletionReason = deletionReason;
  return this;
};

/**
 * Provides the deletionReason of this CustomerInfo.
 * @return {string} The deletionReason of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getDeletionReason = function() {
  return this._deletionReason;
};

/**
 * Sets the deletionTime of this CustomerInfo.
 * @param {Date} deletionTime The deletionTime of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setDeletionTime = function(deletionTime) {
  if (deletionTime == null) {
    this._deletionTime = null;
  } else {
    this._deletionTime = String(deletionTime.getTime());
  }
  return this;
};

/**
 * Provides the deletionTime of this CustomerInfo.
 * @return {Date} The deletionTime of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getDeletionTime = function() {
  if (this._deletionTime == null) {
    return null;
  }
  if (isNaN(this._deletionTime)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._deletionTime);
  }
  return new Date(Number(this._deletionTime));
};

/**
 * Sets the domain of this CustomerInfo.
 * @param {string} domain The domain of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setDomain = function(domain) {
  this._domain = domain;
  return this;
};

/**
 * Provides the domain of this CustomerInfo.
 * @return {string} The domain of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getDomain = function() {
  return this._domain;
};

/**
 * Sets the includedEmailAliases of this CustomerInfo.
 * @param {string} includedEmailAliases The includedEmailAliases of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setIncludedEmailAliases = function(includedEmailAliases) {
  this._includedEmailAliases = includedEmailAliases;
  return this;
};

/**
 * Provides the includedEmailAliases of this CustomerInfo.
 * @return {string} The includedEmailAliases of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getIncludedEmailAliases = function() {
  return this._includedEmailAliases;
};

/**
 * Sets the includedStorageCapacity of this CustomerInfo.
 * @param {string} includedStorageCapacity The includedStorageCapacity of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setIncludedStorageCapacity = function(includedStorageCapacity) {
  this._includedStorageCapacity = includedStorageCapacity;
  return this;
};

/**
 * Provides the includedStorageCapacity of this CustomerInfo.
 * @return {string} The includedStorageCapacity of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getIncludedStorageCapacity = function() {
  return this._includedStorageCapacity;
};

/**
 * Sets the promotionEmailAliases of this CustomerInfo.
 * @param {string} promotionEmailAliases The promotionEmailAliases of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setPromotionEmailAliases = function(promotionEmailAliases) {
  this._promotionEmailAliases = promotionEmailAliases;
  return this;
};

/**
 * Provides the promotionEmailAliases of this CustomerInfo.
 * @return {string} The promotionEmailAliases of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getPromotionEmailAliases = function() {
  return this._promotionEmailAliases;
};

/**
 * Sets the promotionStorageCapacity of this CustomerInfo.
 * @param {string} promotionStorageCapacity The promotionStorageCapacity of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setPromotionStorageCapacity = function(promotionStorageCapacity) {
  this._promotionStorageCapacity = promotionStorageCapacity;
  return this;
};

/**
 * Provides the promotionStorageCapacity of this CustomerInfo.
 * @return {string} The promotionStorageCapacity of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getPromotionStorageCapacity = function() {
  return this._promotionStorageCapacity;
};

/**
 * Sets the registrationMailAddress of this CustomerInfo.
 * @param {string} registrationMailAddress The registrationMailAddress of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setRegistrationMailAddress = function(registrationMailAddress) {
  this._registrationMailAddress = registrationMailAddress;
  return this;
};

/**
 * Provides the registrationMailAddress of this CustomerInfo.
 * @return {string} The registrationMailAddress of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getRegistrationMailAddress = function() {
  return this._registrationMailAddress;
};

/**
 * Sets the source of this CustomerInfo.
 * @param {string} source The source of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setSource = function(source) {
  this._source = source;
  return this;
};

/**
 * Provides the source of this CustomerInfo.
 * @return {string} The source of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getSource = function() {
  return this._source;
};

/**
 * Sets the testEndTime of this CustomerInfo.
 * @param {Date} testEndTime The testEndTime of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setTestEndTime = function(testEndTime) {
  if (testEndTime == null) {
    this._testEndTime = null;
  } else {
    this._testEndTime = String(testEndTime.getTime());
  }
  return this;
};

/**
 * Provides the testEndTime of this CustomerInfo.
 * @return {Date} The testEndTime of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getTestEndTime = function() {
  if (this._testEndTime == null) {
    return null;
  }
  if (isNaN(this._testEndTime)) {
    throw new tutao.InvalidDataError('invalid time data: ' + this._testEndTime);
  }
  return new Date(Number(this._testEndTime));
};

/**
 * Sets the usedSharedEmailAliases of this CustomerInfo.
 * @param {string} usedSharedEmailAliases The usedSharedEmailAliases of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setUsedSharedEmailAliases = function(usedSharedEmailAliases) {
  this._usedSharedEmailAliases = usedSharedEmailAliases;
  return this;
};

/**
 * Provides the usedSharedEmailAliases of this CustomerInfo.
 * @return {string} The usedSharedEmailAliases of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getUsedSharedEmailAliases = function() {
  return this._usedSharedEmailAliases;
};

/**
 * Sets the accountingInfo of this CustomerInfo.
 * @param {string} accountingInfo The accountingInfo of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setAccountingInfo = function(accountingInfo) {
  this._accountingInfo = accountingInfo;
  return this;
};

/**
 * Provides the accountingInfo of this CustomerInfo.
 * @return {string} The accountingInfo of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getAccountingInfo = function() {
  return this._accountingInfo;
};

/**
 * Loads the accountingInfo of this CustomerInfo.
 * @return {Promise.<tutao.entity.sys.AccountingInfo>} Resolves to the loaded accountingInfo of this CustomerInfo or an exception if the loading failed.
 */
tutao.entity.sys.CustomerInfo.prototype.loadAccountingInfo = function() {
  return tutao.entity.sys.AccountingInfo.load(this._accountingInfo);
};

/**
 * Sets the bookings of this CustomerInfo.
 * @param {tutao.entity.sys.BookingsRef} bookings The bookings of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setBookings = function(bookings) {
  this._bookings = bookings;
  return this;
};

/**
 * Provides the bookings of this CustomerInfo.
 * @return {tutao.entity.sys.BookingsRef} The bookings of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getBookings = function() {
  return this._bookings;
};

/**
 * Sets the customer of this CustomerInfo.
 * @param {string} customer The customer of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setCustomer = function(customer) {
  this._customer = customer;
  return this;
};

/**
 * Provides the customer of this CustomerInfo.
 * @return {string} The customer of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getCustomer = function() {
  return this._customer;
};

/**
 * Loads the customer of this CustomerInfo.
 * @return {Promise.<tutao.entity.sys.Customer>} Resolves to the loaded customer of this CustomerInfo or an exception if the loading failed.
 */
tutao.entity.sys.CustomerInfo.prototype.loadCustomer = function() {
  return tutao.entity.sys.Customer.load(this._customer);
};

/**
 * Provides the domainInfos of this CustomerInfo.
 * @return {Array.<tutao.entity.sys.DomainInfo>} The domainInfos of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getDomainInfos = function() {
  return this._domainInfos;
};

/**
 * Sets the takeoverCustomer of this CustomerInfo.
 * @param {string} takeoverCustomer The takeoverCustomer of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.setTakeoverCustomer = function(takeoverCustomer) {
  this._takeoverCustomer = takeoverCustomer;
  return this;
};

/**
 * Provides the takeoverCustomer of this CustomerInfo.
 * @return {string} The takeoverCustomer of this CustomerInfo.
 */
tutao.entity.sys.CustomerInfo.prototype.getTakeoverCustomer = function() {
  return this._takeoverCustomer;
};

/**
 * Loads the takeoverCustomer of this CustomerInfo.
 * @return {Promise.<tutao.entity.sys.Customer>} Resolves to the loaded takeoverCustomer of this CustomerInfo or an exception if the loading failed.
 */
tutao.entity.sys.CustomerInfo.prototype.loadTakeoverCustomer = function() {
  return tutao.entity.sys.Customer.load(this._takeoverCustomer);
};

/**
 * Loads a CustomerInfo from the server.
 * @param {Array.<string>} id The id of the CustomerInfo.
 * @return {Promise.<tutao.entity.sys.CustomerInfo>} Resolves to the CustomerInfo or an exception if the loading failed.
 */
tutao.entity.sys.CustomerInfo.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.CustomerInfo, tutao.entity.sys.CustomerInfo.PATH, id[1], id[0], {"v" : "19"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple CustomerInfos from the server.
 * @param {Array.<Array.<string>>} ids The ids of the CustomerInfos to load.
 * @return {Promise.<Array.<tutao.entity.sys.CustomerInfo>>} Resolves to an array of CustomerInfo or rejects with an exception if the loading failed.
 */
tutao.entity.sys.CustomerInfo.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.CustomerInfo, tutao.entity.sys.CustomerInfo.PATH, ids, {"v": "19"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Updates this CustomerInfo on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.sys.CustomerInfo.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.sys.CustomerInfo.PATH, this, {"v": "19"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Provides a  list of CustomerInfos loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.sys.CustomerInfo>>} Resolves to an array of CustomerInfo or rejects with an exception if the loading failed.
 */
tutao.entity.sys.CustomerInfo.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.sys.CustomerInfo, tutao.entity.sys.CustomerInfo.PATH, listId, start, count, reverse, {"v": "19"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.CustomerInfo.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.CustomerInfo.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.sys.CustomerInfo.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
