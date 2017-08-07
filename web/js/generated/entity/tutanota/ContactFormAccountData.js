"use strict";

tutao.provide('tutao.entity.tutanota.ContactFormAccountData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormAccountData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._contactForm = null;
    this._statisticFields = [];
    this._userData = null;
    this._userGroupData = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.ContactFormAccountData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._contactForm = data.contactForm;
  this._statisticFields = [];
  for (var i=0; i < data.statisticFields.length; i++) {
    this._statisticFields.push(new tutao.entity.tutanota.ContactFormStatisticField(this, data.statisticFields[i]));
  }
  this._userData = (data.userData) ? new tutao.entity.tutanota.ContactFormUserData(this, data.userData) : null;
  this._userGroupData = (data.userGroupData) ? new tutao.entity.tutanota.InternalGroupData(this, data.userGroupData) : null;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.ContactFormAccountData.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.ContactFormAccountData.PATH = '/rest/tutanota/contactformaccountservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    contactForm: this._contactForm, 
    statisticFields: tutao.entity.EntityHelper.aggregatesToJsonData(this._statisticFields), 
    userData: tutao.entity.EntityHelper.aggregatesToJsonData(this._userData), 
    userGroupData: tutao.entity.EntityHelper.aggregatesToJsonData(this._userGroupData)
  };
};

/**
 * Sets the format of this ContactFormAccountData.
 * @param {string} format The format of this ContactFormAccountData.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this ContactFormAccountData.
 * @return {string} The format of this ContactFormAccountData.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the contactForm of this ContactFormAccountData.
 * @param {Array.<string>} contactForm The contactForm of this ContactFormAccountData.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.setContactForm = function(contactForm) {
  this._contactForm = contactForm;
  return this;
};

/**
 * Provides the contactForm of this ContactFormAccountData.
 * @return {Array.<string>} The contactForm of this ContactFormAccountData.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.getContactForm = function() {
  return this._contactForm;
};

/**
 * Loads the contactForm of this ContactFormAccountData.
 * @return {Promise.<tutao.entity.tutanota.ContactForm>} Resolves to the loaded contactForm of this ContactFormAccountData or an exception if the loading failed.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.loadContactForm = function() {
  return tutao.entity.tutanota.ContactForm.load(this._contactForm);
};

/**
 * Provides the statisticFields of this ContactFormAccountData.
 * @return {Array.<tutao.entity.tutanota.ContactFormStatisticField>} The statisticFields of this ContactFormAccountData.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.getStatisticFields = function() {
  return this._statisticFields;
};

/**
 * Sets the userData of this ContactFormAccountData.
 * @param {tutao.entity.tutanota.ContactFormUserData} userData The userData of this ContactFormAccountData.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.setUserData = function(userData) {
  this._userData = userData;
  return this;
};

/**
 * Provides the userData of this ContactFormAccountData.
 * @return {tutao.entity.tutanota.ContactFormUserData} The userData of this ContactFormAccountData.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.getUserData = function() {
  return this._userData;
};

/**
 * Sets the userGroupData of this ContactFormAccountData.
 * @param {tutao.entity.tutanota.InternalGroupData} userGroupData The userGroupData of this ContactFormAccountData.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.setUserGroupData = function(userGroupData) {
  this._userGroupData = userGroupData;
  return this;
};

/**
 * Provides the userGroupData of this ContactFormAccountData.
 * @return {tutao.entity.tutanota.InternalGroupData} The userGroupData of this ContactFormAccountData.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.getUserGroupData = function() {
  return this._userGroupData;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<tutao.entity.tutanota.ContactFormAccountReturn>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.ContactFormAccountData.PATH, this, parameters, headers, tutao.entity.tutanota.ContactFormAccountReturn);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.ContactFormAccountData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
