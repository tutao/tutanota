"use strict";

tutao.provide('tutao.entity.tutanota.FeedbackData');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FeedbackData = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__format = "0";
    this._image = null;
    this._msg = null;
    this._useragent = null;
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.FeedbackData.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.FeedbackData.prototype.updateData = function(data) {
  this.__format = data._format;
  this._image = data.image;
  this._msg = data.msg;
  this._useragent = data.useragent;
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.FeedbackData.MODEL_VERSION = '21';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.FeedbackData.PATH = '/rest/tutanota/feedbackservice';

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.FeedbackData.prototype.ENCRYPTED = false;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.FeedbackData.prototype.toJsonData = function() {
  return {
    _format: this.__format, 
    image: this._image, 
    msg: this._msg, 
    useragent: this._useragent
  };
};

/**
 * Sets the format of this FeedbackData.
 * @param {string} format The format of this FeedbackData.
 */
tutao.entity.tutanota.FeedbackData.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this FeedbackData.
 * @return {string} The format of this FeedbackData.
 */
tutao.entity.tutanota.FeedbackData.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the image of this FeedbackData.
 * @param {string} image The image of this FeedbackData.
 */
tutao.entity.tutanota.FeedbackData.prototype.setImage = function(image) {
  this._image = image;
  return this;
};

/**
 * Provides the image of this FeedbackData.
 * @return {string} The image of this FeedbackData.
 */
tutao.entity.tutanota.FeedbackData.prototype.getImage = function() {
  return this._image;
};

/**
 * Sets the msg of this FeedbackData.
 * @param {string} msg The msg of this FeedbackData.
 */
tutao.entity.tutanota.FeedbackData.prototype.setMsg = function(msg) {
  this._msg = msg;
  return this;
};

/**
 * Provides the msg of this FeedbackData.
 * @return {string} The msg of this FeedbackData.
 */
tutao.entity.tutanota.FeedbackData.prototype.getMsg = function() {
  return this._msg;
};

/**
 * Sets the useragent of this FeedbackData.
 * @param {string} useragent The useragent of this FeedbackData.
 */
tutao.entity.tutanota.FeedbackData.prototype.setUseragent = function(useragent) {
  this._useragent = useragent;
  return this;
};

/**
 * Provides the useragent of this FeedbackData.
 * @return {string} The useragent of this FeedbackData.
 */
tutao.entity.tutanota.FeedbackData.prototype.getUseragent = function() {
  return this._useragent;
};

/**
 * Posts to a service.
 * @param {Object.<string, string>} parameters The parameters to send to the service.
 * @param {?Object.<string, string>} headers The headers to send to the service. If null, the default authentication data is used.
 * @return {Promise.<null>} Resolves to the string result of the server or rejects with an exception if the post failed.
 */
tutao.entity.tutanota.FeedbackData.prototype.setup = function(parameters, headers) {
  if (!headers) {
    headers = tutao.entity.EntityHelper.createAuthHeaders();
  }
  parameters["v"] = "21";
  this._entityHelper.notifyObservers(false);
  return tutao.locator.entityRestClient.postService(tutao.entity.tutanota.FeedbackData.PATH, this, parameters, headers, null);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.FeedbackData.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
