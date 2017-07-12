"use strict";

tutao.provide('tutao.entity.tutanota.ContactForm');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactForm = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this.__id = null;
    this.__ownerGroup = null;
    this.__permissions = null;
    this._footerHtml = null;
    this._headerHtml = null;
    this._helpHtml = null;
    this._pageTitle = null;
    this._path = null;
    this._replyToSenderOnly = null;
    this._delegationGroups = [];
    this._statisticsFields = [];
    this._targetMailGroup = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.ContactForm.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactForm.prototype.updateData = function(data) {
  this.__format = data._format;
  this.__id = data._id;
  this.__ownerGroup = data._ownerGroup;
  this.__permissions = data._permissions;
  this._footerHtml = data.footerHtml;
  this._headerHtml = data.headerHtml;
  this._helpHtml = data.helpHtml;
  this._pageTitle = data.pageTitle;
  this._path = data.path;
  this._replyToSenderOnly = data.replyToSenderOnly;
  this._delegationGroups = data.delegationGroups;
  this._statisticsFields = [];
  for (var i=0; i < data.statisticsFields.length; i++) {
    this._statisticsFields.push(new tutao.entity.tutanota.InputField(this, data.statisticsFields[i]));
  }
  this._targetMailGroup = data.targetMailGroup;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.ContactForm.MODEL_VERSION = '20';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.ContactForm.PATH = '/rest/tutanota/contactform';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.ContactForm.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAALd';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.ContactForm.GENERATED_ID = false;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.ContactForm.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactForm.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    _id: this.__id, 
    _ownerGroup: this.__ownerGroup, 
    _permissions: this.__permissions, 
    footerHtml: this._footerHtml, 
    headerHtml: this._headerHtml, 
    helpHtml: this._helpHtml, 
    pageTitle: this._pageTitle, 
    path: this._path, 
    replyToSenderOnly: this._replyToSenderOnly, 
    delegationGroups: this._delegationGroups, 
    statisticsFields: tutao.entity.EntityHelper.aggregatesToJsonData(this._statisticsFields), 
    targetMailGroup: this._targetMailGroup
  };
};

/**
 * Sets the custom id of this ContactForm.
 * @param {Array.<string>} id The custom id of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.setId = function(id) {
  this.__id = id;
};

/**
 * Provides the id of this ContactForm.
 * @return {Array.<string>} The id of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the format of this ContactForm.
 * @param {string} format The format of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ContactForm.
 * @return {string} The format of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the ownerGroup of this ContactForm.
 * @param {string} ownerGroup The ownerGroup of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.setOwnerGroup = function(ownerGroup) {
  this.__ownerGroup = ownerGroup;
  return this;
};

/**
 * Provides the ownerGroup of this ContactForm.
 * @return {string} The ownerGroup of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getOwnerGroup = function() {
  return this.__ownerGroup;
};

/**
 * Sets the permissions of this ContactForm.
 * @param {string} permissions The permissions of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this ContactForm.
 * @return {string} The permissions of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the footerHtml of this ContactForm.
 * @param {string} footerHtml The footerHtml of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.setFooterHtml = function(footerHtml) {
  this._footerHtml = footerHtml;
  return this;
};

/**
 * Provides the footerHtml of this ContactForm.
 * @return {string} The footerHtml of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getFooterHtml = function() {
  return this._footerHtml;
};

/**
 * Sets the headerHtml of this ContactForm.
 * @param {string} headerHtml The headerHtml of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.setHeaderHtml = function(headerHtml) {
  this._headerHtml = headerHtml;
  return this;
};

/**
 * Provides the headerHtml of this ContactForm.
 * @return {string} The headerHtml of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getHeaderHtml = function() {
  return this._headerHtml;
};

/**
 * Sets the helpHtml of this ContactForm.
 * @param {string} helpHtml The helpHtml of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.setHelpHtml = function(helpHtml) {
  this._helpHtml = helpHtml;
  return this;
};

/**
 * Provides the helpHtml of this ContactForm.
 * @return {string} The helpHtml of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getHelpHtml = function() {
  return this._helpHtml;
};

/**
 * Sets the pageTitle of this ContactForm.
 * @param {string} pageTitle The pageTitle of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.setPageTitle = function(pageTitle) {
  this._pageTitle = pageTitle;
  return this;
};

/**
 * Provides the pageTitle of this ContactForm.
 * @return {string} The pageTitle of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getPageTitle = function() {
  return this._pageTitle;
};

/**
 * Sets the path of this ContactForm.
 * @param {string} path The path of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.setPath = function(path) {
  this._path = path;
  return this;
};

/**
 * Provides the path of this ContactForm.
 * @return {string} The path of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getPath = function() {
  return this._path;
};

/**
 * Sets the replyToSenderOnly of this ContactForm.
 * @param {boolean} replyToSenderOnly The replyToSenderOnly of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.setReplyToSenderOnly = function(replyToSenderOnly) {
  this._replyToSenderOnly = replyToSenderOnly ? '1' : '0';
  return this;
};

/**
 * Provides the replyToSenderOnly of this ContactForm.
 * @return {boolean} The replyToSenderOnly of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getReplyToSenderOnly = function() {
  return this._replyToSenderOnly != '0';
};

/**
 * Provides the delegationGroups of this ContactForm.
 * @return {Array.<string>} The delegationGroups of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getDelegationGroups = function() {
  return this._delegationGroups;
};

/**
 * Provides the statisticsFields of this ContactForm.
 * @return {Array.<tutao.entity.tutanota.InputField>} The statisticsFields of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getStatisticsFields = function() {
  return this._statisticsFields;
};

/**
 * Sets the targetMailGroup of this ContactForm.
 * @param {string} targetMailGroup The targetMailGroup of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.setTargetMailGroup = function(targetMailGroup) {
  this._targetMailGroup = targetMailGroup;
  return this;
};

/**
 * Provides the targetMailGroup of this ContactForm.
 * @return {string} The targetMailGroup of this ContactForm.
 */
tutao.entity.tutanota.ContactForm.prototype.getTargetMailGroup = function() {
  return this._targetMailGroup;
};

/**
 * Loads the targetMailGroup of this ContactForm.
 * @return {Promise.<tutao.entity.tutanota.Group>} Resolves to the loaded targetMailGroup of this ContactForm or an exception if the loading failed.
 */
tutao.entity.tutanota.ContactForm.prototype.loadTargetMailGroup = function() {
  return tutao.entity.tutanota.Group.load(this._targetMailGroup);
};

/**
 * Loads a ContactForm from the server.
 * @param {Array.<string>} id The id of the ContactForm.
 * @return {Promise.<tutao.entity.tutanota.ContactForm>} Resolves to the ContactForm or an exception if the loading failed.
 */
tutao.entity.tutanota.ContactForm.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.ContactForm, tutao.entity.tutanota.ContactForm.PATH, id[1], id[0], {"v" : "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity;
  });
};

/**
 * Loads multiple ContactForms from the server.
 * @param {Array.<Array.<string>>} ids The ids of the ContactForms to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.ContactForm>>} Resolves to an array of ContactForm or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.ContactForm.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.ContactForm, tutao.entity.tutanota.ContactForm.PATH, ids, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return entities;
  });
};

/**
 * Stores ContactForm on the server and updates this instance with _id and _permission values generated on the server.
 * @param {string} listId The list id of the ContactForm.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.tutanota.ContactForm.prototype.setup = function(listId) {
  var self = this;
  self._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.ContactForm.PATH, self, listId, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    self.setPermissions(entity.getPermissionListId());
  });
};

/**
 * Updates this ContactForm on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.ContactForm.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.ContactForm.PATH, this, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this ContactForm on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.tutanota.ContactForm.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanota.ContactForm.PATH, this.__id[1], this.__id[0], {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Creates a new ContactForm list on the server.
 * @param {string} ownerGroupId The group for which the list shall be created.
 * @return {Promise.<string>} Resolves to the id of the new tutao.entity.tutanota.ContactForm list or rejects with an exception if the createList failed.
 */
tutao.entity.tutanota.ContactForm.createList = function(ownerGroupId) {
  var params = tutao.entity.EntityHelper.createPostListPermissionMap(ownerGroupId);
  params["v"] = "20";
  return tutao.locator.entityRestClient.postList(tutao.entity.tutanota.ContactForm.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(returnEntity) {
    return returnEntity.getGeneratedId();
  });
};

/**
 * Provides a  list of ContactForms loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.tutanota.ContactForm>>} Resolves to an array of ContactForm or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.ContactForm.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.ContactForm, tutao.entity.tutanota.ContactForm.PATH, listId, start, count, reverse, {"v": "20"}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return entities;
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.ContactForm.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.ContactForm.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ContactForm.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
