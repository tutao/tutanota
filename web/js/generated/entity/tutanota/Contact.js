"use strict";

tutao.provide('tutao.entity.tutanota.Contact');

/**
 * @constructor
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Contact = function(data) {
  if (data) {
    this.updateData(data);
  } else {
    this.__area = null;
    this.__format = "0";
    this.__id = null;
    this.__listEncSessionKey = null;
    this.__owner = null;
    this.__permissions = null;
    this._autoTransmitPassword = null;
    this._birthday = null;
    this._comment = null;
    this._company = null;
    this._firstName = null;
    this._lastName = null;
    this._presharedPassword = null;
    this._title = null;
    this._addresses = [];
    this._mailAddresses = [];
    this._phoneNumbers = [];
    this._socialIds = [];
  }
  this._entityHelper = new tutao.entity.EntityHelper(this);
  this.prototype = tutao.entity.tutanota.Contact.prototype;
};

/**
 * Updates the data of this entity.
 * @param {Object=} data The json data to store in this entity.
 */
tutao.entity.tutanota.Contact.prototype.updateData = function(data) {
  this.__area = data._area;
  this.__format = data._format;
  this.__id = data._id;
  this.__listEncSessionKey = data._listEncSessionKey;
  this.__owner = data._owner;
  this.__permissions = data._permissions;
  this._autoTransmitPassword = data.autoTransmitPassword;
  this._birthday = data.birthday;
  this._comment = data.comment;
  this._company = data.company;
  this._firstName = data.firstName;
  this._lastName = data.lastName;
  this._presharedPassword = data.presharedPassword;
  this._title = data.title;
  this._addresses = [];
  for (var i=0; i < data.addresses.length; i++) {
    this._addresses.push(new tutao.entity.tutanota.ContactAddress(this, data.addresses[i]));
  }
  this._mailAddresses = [];
  for (var i=0; i < data.mailAddresses.length; i++) {
    this._mailAddresses.push(new tutao.entity.tutanota.ContactMailAddress(this, data.mailAddresses[i]));
  }
  this._phoneNumbers = [];
  for (var i=0; i < data.phoneNumbers.length; i++) {
    this._phoneNumbers.push(new tutao.entity.tutanota.ContactPhoneNumber(this, data.phoneNumbers[i]));
  }
  this._socialIds = [];
  for (var i=0; i < data.socialIds.length; i++) {
    this._socialIds.push(new tutao.entity.tutanota.ContactSocialId(this, data.socialIds[i]));
  }
};

/**
 * The version of the model this type belongs to.
 * @const
 */
tutao.entity.tutanota.Contact.MODEL_VERSION = '8';

/**
 * The url path to the resource.
 * @const
 */
tutao.entity.tutanota.Contact.PATH = '/rest/tutanota/contact';

/**
 * The id of the root instance reference.
 * @const
 */
tutao.entity.tutanota.Contact.ROOT_INSTANCE_ID = 'CHR1dGFub3RhAEA';

/**
 * The generated id type flag.
 * @const
 */
tutao.entity.tutanota.Contact.GENERATED_ID = true;

/**
 * The encrypted flag.
 * @const
 */
tutao.entity.tutanota.Contact.prototype.ENCRYPTED = true;

/**
 * Provides the data of this instances as an object that can be converted to json.
 * @return {Object} The json object.
 */
tutao.entity.tutanota.Contact.prototype.toJsonData = function() {
  return {
    _area: this.__area, 
    _format: this.__format, 
    _id: this.__id, 
    _listEncSessionKey: this.__listEncSessionKey, 
    _owner: this.__owner, 
    _permissions: this.__permissions, 
    autoTransmitPassword: this._autoTransmitPassword, 
    birthday: this._birthday, 
    comment: this._comment, 
    company: this._company, 
    firstName: this._firstName, 
    lastName: this._lastName, 
    presharedPassword: this._presharedPassword, 
    title: this._title, 
    addresses: tutao.entity.EntityHelper.aggregatesToJsonData(this._addresses), 
    mailAddresses: tutao.entity.EntityHelper.aggregatesToJsonData(this._mailAddresses), 
    phoneNumbers: tutao.entity.EntityHelper.aggregatesToJsonData(this._phoneNumbers), 
    socialIds: tutao.entity.EntityHelper.aggregatesToJsonData(this._socialIds)
  };
};

/**
 * The id of the Contact type.
 */
tutao.entity.tutanota.Contact.prototype.TYPE_ID = 64;

/**
 * The id of the _area attribute.
 */
tutao.entity.tutanota.Contact.prototype._AREA_ATTRIBUTE_ID = 71;

/**
 * The id of the _owner attribute.
 */
tutao.entity.tutanota.Contact.prototype._OWNER_ATTRIBUTE_ID = 70;

/**
 * The id of the autoTransmitPassword attribute.
 */
tutao.entity.tutanota.Contact.prototype.AUTOTRANSMITPASSWORD_ATTRIBUTE_ID = 78;

/**
 * The id of the birthday attribute.
 */
tutao.entity.tutanota.Contact.prototype.BIRTHDAY_ATTRIBUTE_ID = 76;

/**
 * The id of the comment attribute.
 */
tutao.entity.tutanota.Contact.prototype.COMMENT_ATTRIBUTE_ID = 77;

/**
 * The id of the company attribute.
 */
tutao.entity.tutanota.Contact.prototype.COMPANY_ATTRIBUTE_ID = 74;

/**
 * The id of the firstName attribute.
 */
tutao.entity.tutanota.Contact.prototype.FIRSTNAME_ATTRIBUTE_ID = 72;

/**
 * The id of the lastName attribute.
 */
tutao.entity.tutanota.Contact.prototype.LASTNAME_ATTRIBUTE_ID = 73;

/**
 * The id of the presharedPassword attribute.
 */
tutao.entity.tutanota.Contact.prototype.PRESHAREDPASSWORD_ATTRIBUTE_ID = 79;

/**
 * The id of the title attribute.
 */
tutao.entity.tutanota.Contact.prototype.TITLE_ATTRIBUTE_ID = 75;

/**
 * The id of the addresses attribute.
 */
tutao.entity.tutanota.Contact.prototype.ADDRESSES_ATTRIBUTE_ID = 82;

/**
 * The id of the mailAddresses attribute.
 */
tutao.entity.tutanota.Contact.prototype.MAILADDRESSES_ATTRIBUTE_ID = 80;

/**
 * The id of the phoneNumbers attribute.
 */
tutao.entity.tutanota.Contact.prototype.PHONENUMBERS_ATTRIBUTE_ID = 81;

/**
 * The id of the socialIds attribute.
 */
tutao.entity.tutanota.Contact.prototype.SOCIALIDS_ATTRIBUTE_ID = 83;

/**
 * Provides the id of this Contact.
 * @return {Array.<string>} The id of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getId = function() {
  return this.__id;
};

/**
 * Sets the area of this Contact.
 * @param {string} area The area of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setArea = function(area) {
  this.__area = area;
  return this;
};

/**
 * Provides the area of this Contact.
 * @return {string} The area of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getArea = function() {
  return this.__area;
};

/**
 * Sets the format of this Contact.
 * @param {string} format The format of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setFormat = function(format) {
  this.__format = format;
  return this;
};

/**
 * Provides the format of this Contact.
 * @return {string} The format of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getFormat = function() {
  return this.__format;
};

/**
 * Sets the listEncSessionKey of this Contact.
 * @param {string} listEncSessionKey The listEncSessionKey of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setListEncSessionKey = function(listEncSessionKey) {
  this.__listEncSessionKey = listEncSessionKey;
  return this;
};

/**
 * Provides the listEncSessionKey of this Contact.
 * @return {string} The listEncSessionKey of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getListEncSessionKey = function() {
  return this.__listEncSessionKey;
};

/**
 * Sets the owner of this Contact.
 * @param {string} owner The owner of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setOwner = function(owner) {
  this.__owner = owner;
  return this;
};

/**
 * Provides the owner of this Contact.
 * @return {string} The owner of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getOwner = function() {
  return this.__owner;
};

/**
 * Sets the permissions of this Contact.
 * @param {string} permissions The permissions of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setPermissions = function(permissions) {
  this.__permissions = permissions;
  return this;
};

/**
 * Provides the permissions of this Contact.
 * @return {string} The permissions of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getPermissions = function() {
  return this.__permissions;
};

/**
 * Sets the autoTransmitPassword of this Contact.
 * @param {string} autoTransmitPassword The autoTransmitPassword of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setAutoTransmitPassword = function(autoTransmitPassword) {
  var dataToEncrypt = autoTransmitPassword;
  this._autoTransmitPassword = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the autoTransmitPassword of this Contact.
 * @return {string} The autoTransmitPassword of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getAutoTransmitPassword = function() {
  if (this._autoTransmitPassword == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._autoTransmitPassword);
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
 * Sets the birthday of this Contact.
 * @param {Date} birthday The birthday of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setBirthday = function(birthday) {
  if (birthday == null) {
    this._birthday = null;
  } else {
    var dataToEncrypt = String(birthday.getTime());
    this._birthday = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  }
  return this;
};

/**
 * Provides the birthday of this Contact.
 * @return {Date} The birthday of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getBirthday = function() {
  if (this._birthday == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._birthday);
    if (isNaN(value)) {
      this.getEntityHelper().invalidateSessionKey();
      return new Date(0);
    }
    return new Date(Number(value));
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
 * Sets the comment of this Contact.
 * @param {string} comment The comment of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setComment = function(comment) {
  var dataToEncrypt = comment;
  this._comment = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the comment of this Contact.
 * @return {string} The comment of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getComment = function() {
  if (this._comment == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._comment);
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
 * Sets the company of this Contact.
 * @param {string} company The company of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setCompany = function(company) {
  var dataToEncrypt = company;
  this._company = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the company of this Contact.
 * @return {string} The company of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getCompany = function() {
  if (this._company == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._company);
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
 * Sets the firstName of this Contact.
 * @param {string} firstName The firstName of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setFirstName = function(firstName) {
  var dataToEncrypt = firstName;
  this._firstName = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the firstName of this Contact.
 * @return {string} The firstName of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getFirstName = function() {
  if (this._firstName == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._firstName);
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
 * Sets the lastName of this Contact.
 * @param {string} lastName The lastName of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setLastName = function(lastName) {
  var dataToEncrypt = lastName;
  this._lastName = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the lastName of this Contact.
 * @return {string} The lastName of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getLastName = function() {
  if (this._lastName == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._lastName);
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
 * Sets the presharedPassword of this Contact.
 * @param {string} presharedPassword The presharedPassword of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setPresharedPassword = function(presharedPassword) {
  if (presharedPassword == null) {
    this._presharedPassword = null;
  } else {
    var dataToEncrypt = presharedPassword;
    this._presharedPassword = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  }
  return this;
};

/**
 * Provides the presharedPassword of this Contact.
 * @return {string} The presharedPassword of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getPresharedPassword = function() {
  if (this._presharedPassword == null || !this._entityHelper.getSessionKey()) {
    return null;
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._presharedPassword);
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
 * Sets the title of this Contact.
 * @param {string} title The title of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.setTitle = function(title) {
  var dataToEncrypt = title;
  this._title = tutao.locator.aesCrypter.encryptUtf8(this._entityHelper.getSessionKey(), dataToEncrypt);
  return this;
};

/**
 * Provides the title of this Contact.
 * @return {string} The title of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getTitle = function() {
  if (this._title == "" || !this._entityHelper.getSessionKey()) {
    return "";
  }
  try {
    var value = tutao.locator.aesCrypter.decryptUtf8(this._entityHelper.getSessionKey(), this._title);
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
 * Provides the addresses of this Contact.
 * @return {Array.<tutao.entity.tutanota.ContactAddress>} The addresses of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getAddresses = function() {
  return this._addresses;
};

/**
 * Provides the mailAddresses of this Contact.
 * @return {Array.<tutao.entity.tutanota.ContactMailAddress>} The mailAddresses of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getMailAddresses = function() {
  return this._mailAddresses;
};

/**
 * Provides the phoneNumbers of this Contact.
 * @return {Array.<tutao.entity.tutanota.ContactPhoneNumber>} The phoneNumbers of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getPhoneNumbers = function() {
  return this._phoneNumbers;
};

/**
 * Provides the socialIds of this Contact.
 * @return {Array.<tutao.entity.tutanota.ContactSocialId>} The socialIds of this Contact.
 */
tutao.entity.tutanota.Contact.prototype.getSocialIds = function() {
  return this._socialIds;
};

/**
 * Loads a Contact from the server.
 * @param {Array.<string>} id The id of the Contact.
 * @return {Promise.<tutao.entity.tutanota.Contact>} Resolves to the Contact or an exception if the loading failed.
 */
tutao.entity.tutanota.Contact.load = function(id) {
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.Contact, tutao.entity.tutanota.Contact.PATH, id[1], id[0], {"v" : 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
    return entity._entityHelper.loadSessionKey();
  });
};

/**
 * Loads a version of this Contact from the server.
 * @param {string} versionId The id of the requested version.
 * @return {Promise.<tutao.entity.tutanota.Contact>} Resolves to Contact or an exception if the loading failed.
 */
tutao.entity.tutanota.Contact.prototype.loadVersion = function(versionId) {
  var map = {};
  map["version"] = versionId;
  map["v"] = 8;
  return tutao.locator.entityRestClient.getElement(tutao.entity.tutanota.Contact, tutao.entity.tutanota.Contact.PATH, this.getId()[1], this.getId()[0], map, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Loads information about all versions of this Contact from the server.
 * @return {Promise.<tutao.entity.sys.VersionReturn>} Resolves to an tutao.entity.sys.VersionReturn or an exception if the loading failed.
 */
tutao.entity.tutanota.Contact.prototype.loadVersionInfo = function() {
  var versionData = new tutao.entity.sys.VersionData()
    .setApplication("tutanota")
    .setType(64)
    .setId(this.getId()[1]);
  versionData.setListId(this.getId()[0]);
  return tutao.entity.sys.VersionReturn.load(versionData, {}, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Loads multiple Contacts from the server.
 * @param {Array.<Array.<string>>} ids The ids of the Contacts to load.
 * @return {Promise.<Array.<tutao.entity.tutanota.Contact>>} Resolves to an array of Contact or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.Contact.loadMultiple = function(ids) {
  return tutao.locator.entityRestClient.getElements(tutao.entity.tutanota.Contact, tutao.entity.tutanota.Contact.PATH, ids, {"v": 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Stores Contact on the server and updates this instance with _id and _permission values generated on the server.
 * @param {string} listId The list id of the Contact.
 * @return {Promise.<>} Resolves when finished, rejected if the post failed.
 */
tutao.entity.tutanota.Contact.prototype.setup = function(listId) {
  var self = this;
  return this._entityHelper.createListEncSessionKey(listId).then(function(listEncSessionKey) {
    self.setListEncSessionKey(listEncSessionKey);
    self._entityHelper.notifyObservers(false);
    return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Contact.PATH, self, listId, {"v": 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entity) {
      self.__id = [listId, entity.getGeneratedId()];
      self.setPermissions(entity.getPermissionListId());
    });
  });
};

/**
 * Updates the listEncSessionKey on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.Contact.prototype.updateListEncSessionKey = function() {
  var params = {};
  params[tutao.rest.ResourceConstants.UPDATE_LIST_ENC_SESSION_KEY] = "true";
  params["v"] = 8;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.Contact.PATH, this, params, tutao.entity.EntityHelper.createAuthHeaders());
};

/**
 * Updates this Contact on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the update failed.
 */
tutao.entity.tutanota.Contact.prototype.update = function() {
  var self = this;
  return tutao.locator.entityRestClient.putElement(tutao.entity.tutanota.Contact.PATH, this, {"v": 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function() {
    self._entityHelper.notifyObservers(false);
  });
};

/**
 * Deletes this Contact on the server.
 * @return {Promise.<>} Resolves when finished, rejected if the delete failed.
 */
tutao.entity.tutanota.Contact.prototype.erase = function() {
  var self = this;
  return tutao.locator.entityRestClient.deleteElement(tutao.entity.tutanota.Contact.PATH, this.__id[1], this.__id[0], {"v": 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(data) {
    self._entityHelper.notifyObservers(true);
  });
};

/**
 * Creates a new Contact list on the server.
 * @param {tutao.entity.BucketData} bucketData The bucket data for which the share permission on the list shall be created.
 * @return {Promise.<string=>} Resolves to the id of the new tutao.entity.tutanota.Contact list or rejects with an exception if the createList failed.
 */
tutao.entity.tutanota.Contact.createList = function(bucketData) {
  var params = tutao.entity.EntityHelper.createPostListPermissionMap(bucketData, true);
  params["v"] = 8;
  return tutao.locator.entityRestClient.postList(tutao.entity.tutanota.Contact.PATH, params, tutao.entity.EntityHelper.createAuthHeaders()).then(function(returnEntity) {
    return returnEntity.getGeneratedId();
  });
};

/**
 * Provides a  list of Contacts loaded from the server.
 * @param {string} listId The list id.
 * @param {string} start Start id.
 * @param {number} count Max number of mails.
 * @param {boolean} reverse Reverse or not.
 * @return {Promise.<Array.<tutao.entity.tutanota.Contact>>} Resolves to an array of Contact or rejects with an exception if the loading failed.
 */
tutao.entity.tutanota.Contact.loadRange = function(listId, start, count, reverse) {
  return tutao.locator.entityRestClient.getElementRange(tutao.entity.tutanota.Contact, tutao.entity.tutanota.Contact.PATH, listId, start, count, reverse, {"v": 8}, tutao.entity.EntityHelper.createAuthHeaders()).then(function(entities) {;
    return tutao.entity.EntityHelper.loadSessionKeys(entities);
  });
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is not registered again.
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.tutanota.Contact.prototype.registerObserver = function(listener, id) {
  this._entityHelper.registerObserver(listener, id);
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.tutanota.Contact.prototype.unregisterObserver = function(listener) {
  this._entityHelper.unregisterObserver(listener);
};
/**
 * Provides the entity helper of this entity.
 * @return {tutao.entity.EntityHelper} The entity helper.
 */
tutao.entity.tutanota.Contact.prototype.getEntityHelper = function() {
  return this._entityHelper;
};
