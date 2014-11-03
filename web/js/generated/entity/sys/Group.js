"use strict";

tutao.provide('tutao.entity.sys.Group');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.sys.Group = function(data) {
  if (data) {
    this.__format = data._format;
    this.__id = data._id;
    this.__permissions = data._permissions;
    this._adminGroupEncGKey = data.adminGroupEncGKey;
    this._enabled = data.enabled;
    this._type = data.type;
    this._admin = data.admin;
    this._customer = data.customer;
    this._groupInfo = data.groupInfo;
    this._invitations = data.invitations;
    this._keys = [];
    for (var i=0; i < data.keys.length; i++) {
      this._keys.push(new tutao.entity.sys.KeyPair(this, data.keys[i]));
    }
    this._members = data.members;
    this._user = data.user;
  } else {
    this.__format = "0";
    this.__id = null;
    this.__permissions = null;
    this._adminGroupEncGKey = null;
    this._enabled = null;
    this._type = null;
    this._admin = null;
    this._customer = null;
    this._groupInfo = null;
    this._invitations = null;
    this._keys = [];
    this._members = null;
    this._user = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.sys.Group.prototype;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.sys.Group.MODEL_VERSION = '5';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.sys.Group.PATH = '/rest/sys/group';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.sys.Group.ROOT_INSTANCE_ID = 'A3N5cwAF';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.sys.Group.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.sys.Group.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.sys.Group.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _permissions: this.__permissions, 
    adminGroupEncGKey: this._adminGroupEncGKey, 
    enabled: this._enabled, 
    type: this._type, 
    admin: this._admin, 
    customer: this._customer, 
    groupInfo: this._groupInfo, 
    invitations: this._invitations, 
    keys: tutao.entity.EntityHelper.aggregatesToJsonData(this._keys), 
    members: this._members, 
    user: this._user
  };
};

/**
 * The id of the Group type.
 */
tutao.entity.sys.Group.prototype.TYPE_ID = 5;

/**
 * The id of the adminGroupEncGKey attribute.
 */
tutao.entity.sys.Group.prototype.ADMINGROUPENCGKEY_ATTRIBUTE_ID = 11;

/**
 * The id of the enabled attribute.
 */
tutao.entity.sys.Group.prototype.ENABLED_ATTRIBUTE_ID = 12;

/**
 * The id of the type attribute.
 */
tutao.entity.sys.Group.prototype.TYPE_ATTRIBUTE_ID = 10;

/**
 * The id of the admin attribute.
 */
tutao.entity.sys.Group.prototype.ADMIN_ATTRIBUTE_ID = 224;

/**
 * The id of the customer attribute.
 */
tutao.entity.sys.Group.prototype.CUSTOMER_ATTRIBUTE_ID = 226;

/**
 * The id of the groupInfo attribute.
 */
tutao.entity.sys.Group.prototype.GROUPINFO_ATTRIBUTE_ID = 227;

/**
 * The id of the invitations attribute.
 */
tutao.entity.sys.Group.prototype.INVITATIONS_ATTRIBUTE_ID = 228;

/**
 * The id of the keys attribute.
 */
tutao.entity.sys.Group.prototype.KEYS_ATTRIBUTE_ID = 13;

/**
 * The id of the members attribute.
 */
tutao.entity.sys.Group.prototype.MEMBERS_ATTRIBUTE_ID = 229;

/**
 * The id of the user attribute.
 */
tutao.entity.sys.Group.prototype.USER_ATTRIBUTE_ID = 225;

/**
 * Provides the id of this Group.
 * @return {string} The id of this Group.
 */
tutao.entity.sys.Group.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this Group.
 * @param {string} format The format of this Group.
 */
tutao.entity.sys.Group.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Group.
 * @return {string} The format of this Group.
 */
tutao.entity.sys.Group.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the permissions of this Group.
 * @param {string} permissions The permissions of this Group.
 */
tutao.entity.sys.Group.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Group.
 * @return {string} The permissions of this Group.
 */
tutao.entity.sys.Group.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the adminGroupEncGKey of this Group.
 * @param {string} adminGroupEncGKey The adminGroupEncGKey of this Group.
 */
tutao.entity.sys.Group.prototype.setAdminGroupEncGKey = function(adminGroupEncGKey) {
  this._adminGroupEncGKey = adminGroupEncGKey;
  return this;
};

/**
 * Provides the adminGroupEncGKey of this Group.
 * @return {string} The adminGroupEncGKey of this Group.
 */
tutao.entity.sys.Group.prototype.getAdminGroupEncGKey = function() {
  return this._adminGroupEncGKey;
};

/**
 * Sets the enabled of this Group.
 * @param {boolean} enabled The enabled of this Group.
 */
tutao.entity.sys.Group.prototype.setEnabled = function(enabled) {
  this._enabled = enabled ? '1' : '0';
  return this;
};

/**
 * Provides the enabled of this Group.
 * @return {boolean} The enabled of this Group.
 */
tutao.entity.sys.Group.prototype.getEnabled = function() {
  return this._enabled == '1';
};

/**
 * Sets the type of this Group.
 * @param {string} type The type of this Group.
 */
tutao.entity.sys.Group.prototype.setType = function(type) {
  this._type = type;
  return this;
};

/**
 * Provides the type of this Group.
 * @return {string} The type of this Group.
 */
tutao.entity.sys.Group.prototype.getType = function() {
  return this._type;
};

/**
 * Sets the admin of this Group.
 * @param {string} admin The admin of this Group.
 */
tutao.entity.sys.Group.prototype.setAdmin = function(admin) {
  this._admin = admin;
  return this;
};

/**
 * Provides the admin of this Group.
 * @return {string} The admin of this Group.
 */
tutao.entity.sys.Group.prototype.getAdmin = function() {
  return this._admin;
};

/**
 * Loads the admin of this Group.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the loaded admin of this Group or an exception if the loading failed.
 */
tutao.entity.sys.Group.prototype.loadAdmin = function() {
  return tutao.entity.sys.Group.load(this._admin);
};

/**
 * Sets the customer of this Group.
 * @param {string} customer The customer of this Group.
 */
tutao.entity.sys.Group.prototype.setCustomer = function(customer) {
  this._customer = customer;
  return this;
};

/**
 * Provides the customer of this Group.
 * @return {string} The customer of this Group.
 */
tutao.entity.sys.Group.prototype.getCustomer = function() {
  return this._customer;
};

/**
 * Loads the customer of this Group.
 * @return {Promise.<tutao.entity.sys.Customer>} Resolves to the loaded customer of this Group or an exception if the loading failed.
 */
tutao.entity.sys.Group.prototype.loadCustomer = function() {
  return tutao.entity.sys.Customer.load(this._customer);
};

/**
 * Sets the groupInfo of this Group.
 * @param {Array.<string>} groupInfo The groupInfo of this Group.
 */
tutao.entity.sys.Group.prototype.setGroupInfo = function(groupInfo) {
  this._groupInfo = groupInfo;
  return this;
};

/**
 * Provides the groupInfo of this Group.
 * @return {Array.<string>} The groupInfo of this Group.
 */
tutao.entity.sys.Group.prototype.getGroupInfo = function() {
  return this._groupInfo;
};

/**
 * Loads the groupInfo of this Group.
 * @return {Promise.<tutao.entity.sys.GroupInfo>} Resolves to the loaded groupInfo of this Group or an exception if the loading failed.
 */
tutao.entity.sys.Group.prototype.loadGroupInfo = function() {
  return tutao.entity.sys.GroupInfo.load(this._groupInfo);
};

/**
 * Sets the invitations of this Group.
 * @param {string} invitations The invitations of this Group.
 */
tutao.entity.sys.Group.prototype.setInvitations = function(invitations) {
  this._invitations = invitations;
  return this;
};

/**
 * Provides the invitations of this Group.
 * @return {string} The invitations of this Group.
 */
tutao.entity.sys.Group.prototype.getInvitations = function() {
  return this._invitations;
};

/**
 * Provides the keys of this Group.
 * @return {Array.<tutao.entity.sys.KeyPair>} The keys of this Group.
 */
tutao.entity.sys.Group.prototype.getKeys = function() {
  return this._keys;
};

/**
 * Sets the members of this Group.
 * @param {string} members The members of this Group.
 */
tutao.entity.sys.Group.prototype.setMembers = function(members) {
  this._members = members;
  return this;
};

/**
 * Provides the members of this Group.
 * @return {string} The members of this Group.
 */
tutao.entity.sys.Group.prototype.getMembers = function() {
  return this._members;
};

/**
 * Sets the user of this Group.
 * @param {string} user The user of this Group.
 */
tutao.entity.sys.Group.prototype.setUser = function(user) {
  this._user = user;
  return this;
};

/**
 * Provides the user of this Group.
 * @return {string} The user of this Group.
 */
tutao.entity.sys.Group.prototype.getUser = function() {
  return this._user;
};

/**
 * Loads the user of this Group.
 * @return {Promise.<tutao.entity.sys.User>} Resolves to the loaded user of this Group or an exception if the loading failed.
 */
tutao.entity.sys.Group.prototype.loadUser = function() {
  return tutao.entity.sys.User.load(this._user);
};

/**
 * Loads a Group from the server.
 * @param {string} id The id of the Group.
 * @return {Promise.<tutao.entity.sys.Group>} Resolves to the Group or an exception if the loading failed.
 */
tutao.entity.sys.Group.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.sys.Group, tutao.entity.sys.Group.PATH, id, null, {"v" : 5}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple Groups from the server.
 * @param {Array.<string>} ids The ids of the Groups to load.
 * @return {Promise.<Array.<tutao.entity.sys.Group>>} Resolves to an array of Group or rejects with an exception if the loading failed.
 */
tutao.entity.sys.Group.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.sys.Group, tutao.entity.sys.Group.PATH, ids, {"v": 5}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.sys.Group.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.sys.Group.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
