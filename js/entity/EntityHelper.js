"use strict";

goog.provide('tutao.entity.EntityHelper');

/**
 * Entity helper instances exist for each instance.
 * @param {Object} entity The entity this helper belongs to.
 * @constructor
 */
tutao.entity.EntityHelper = function(entity) {
	this._entity = entity;
	// contains objects of the form {callback: function(), id: *}
	this._observers = [];
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this callback
 * was already registered it is overwritten (i.e. the new id is stored)
 * @param {function(Object,*=)} callback. The callback function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the callback.
 */
tutao.entity.EntityHelper.prototype.registerObserver = function(callback, id) {
	for (var i = 0; i < this._observers.length; i++) {
		if (this._observers[i].callback == callback) {
			// just update the id
			this._observers[i].id = id;
			return;
		}
	}
	this._observers.push({ callback: callback, id: id });
};

/**
 * Removes a registered callback function if it was registered before.
 * @param {function(Object)} callback. The callback to unregister.
 */
tutao.entity.EntityHelper.prototype.unregisterObserver = function(callback) {
	for (var i = 0; i < this._observers.length; i++) {
		if (this._observers[i].callback == callback) {
			this._observers.splice(i, 1);
			break;
		}
	}
};

/**
 * Must be called when any attribute of the entity has changed. Notifies all registered observers.
 * @param {boolean} deleted Indicates if the entity was deleted. True = deleted, false = update.
 */
tutao.entity.EntityHelper.prototype.notifyObservers = function(deleted) {
	for (var i = 0; i < this._observers.length; i++) {
		this._observers[i].callback(deleted, this._entity, this._observers[i].id);
	}
};

/**
 * @return {boolean} True if this is a new object which is not yet stored on the server.
 */
tutao.entity.EntityHelper.prototype._isNewObject = function() {
	return (this._entity.__permissions == null);
};

/**
 * Loads the session key from permissions. If not locally available, the permissions are loaded from the server. If the entity itself is a permission, no session key is loaded because permissions are not encrypted.
 * Tries to retrieve the symmetric encrypted sessionKey first for perfomance reasons. Otherwise, the public encrypted sessionKey is used.
 * @param {function(Object, tutao.rest.EntityRestException=)}  callback. Called when finished with the same entity as entered. Gets passed an exception if something went wrong.
 */
tutao.entity.EntityHelper.prototype.loadSessionKey = function(callback) {
	var self = this;
	if (!this._entity.ENCRYPTED || this._sessionKey != null) {
		callback(this._entity);
		return;
	}
	if (this._entity.getListEncSessionKey && this._entity.getListEncSessionKey()) { // check that it is a list element type and that the list key is set
		tutao.entity.EntityHelper.getListKey(this._entity.getId()[0], function(listKey, exception) {
			if (exception) {
				callback(null, exception);
			} else {				
				self.setSessionKey(tutao.locator.aesCrypter.decryptKey(listKey, self._entity.getListEncSessionKey()));
				callback(self._entity);
			}
		});
	} else {
		tutao.entity.sys.Permission.loadRange(this._entity.__permissions, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, tutao.rest.EntityRestInterface.MAX_RANGE_COUNT, false, function(permissions, exception) {
			if (exception) {
				callback(null, exception);
				return;
			}
			if (tutao.locator.userController.isInternalUserLoggedIn()) {
				try {
					self.setSessionKey(tutao.entity.EntityHelper._tryGetSymEncSessionKey(permissions));
				} catch (e) {
					callback(null, new tutao.rest.EntityRestException(e));
					return;
				}
				if (self._sessionKey != null) {
					callback(self._entity);
					return;
				}
				self._tryGetPubEncSessionKey(permissions, function(sessionKey, exception) {
					if (exception) {
						callback(null, new tutao.rest.EntityRestException(exception));
						return;
					}
					self.setSessionKey(sessionKey);
					if (sessionKey == null) {
						callback(null, new tutao.rest.EntityRestException(new tutao.entity.NotAuthorizedException("session key not found in permissions")));
					} else {
						callback(self._entity);
					}
				});
			} else {
				try {
					self.setSessionKey(tutao.entity.EntityHelper._tryGetSymEncSessionKey(permissions));
				} catch (e) {
					callback(null, new tutao.rest.EntityRestException(e));
					return;
				}
				if (self._sessionKey != null) {
					callback(self._entity);
					return;
				}
				self._tryGetExternalSessionKey(permissions, function(sessionKey, exception) {
					if (exception) {
						callback(null, new tutao.rest.EntityRestException(new tutao.entity.NotAuthorizedException("session key not found in permissions")));
						return;
					}
					self.setSessionKey(sessionKey);
					callback(self._entity);
				});
			}
		});
	}
};

/**
 * Loads the list key from a list permission.
 * @param {string} listId The id of the list.
 * @param {function(?Object, tutao.rest.EntityRestException=)} callback Called when finished.
 */
tutao.entity.EntityHelper.getListKey = function(listId, callback) {
	var self = this;
	tutao.entity.sys.Permission.loadRange(listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, tutao.rest.EntityRestInterface.MAX_RANGE_COUNT, false, function(permissions, exception) {
		if (exception) {
			callback(null, exception);
			return;
		}
		try {
			var listKey = tutao.entity.EntityHelper._tryGetSymEncSessionKey(permissions);
		} catch (e) {
			callback(null, new tutao.rest.EntityRestException(e));
			return;
		}
		callback(listKey);
	});
};

/**
 * Returns the session key of the entity.
 * @return {Object|null} The session key of this entity or null if the session key is not available.
 */
tutao.entity.EntityHelper.prototype.getSessionKey = function() {
	if (this._sessionKey) {
		return this._sessionKey;
	}
	if (this._isNewObject() && this._entity.ENCRYPTED) {
		this._sessionKey = tutao.locator.aesCrypter.generateRandomKey();
	} else {
		// the session key is loaded when loadSessionKey is called directly after the entity was received from the server.
		console.log("session key is missing");
		this._sessionKey = null;
	}
	return this._sessionKey;
};

/**
 * Sets the session key
 * @param {Object} sessionKey The session key to set.
 */
tutao.entity.EntityHelper.prototype.setSessionKey = function(sessionKey) {
	this._sessionKey = sessionKey;
};

/**
 * Provides the session key via an externally encrypted session key.
 * @param {Array.<tutao.entity.sys.Permission>} permissions The permissions of the user on this entity.
 * @param {function(?Object, tutao.rest.EntityRestException=)} callback Returns null if no permission was found and the session key otherwise. Returns an exception if decrypting the session key failed.
 */
tutao.entity.EntityHelper.prototype._tryGetExternalSessionKey = function(permissions, callback) {
	if (permissions.length == 0) {
		callback(null, new tutao.rest.EntityRestException(new Error("no permission found")));
		return;
	}
	// there should be only one permission
	var permission = permissions[0];
	if (permission.getType() != "5") {
		callback(null, new tutao.rest.EntityRestException(new Error("no external permission type: " + permission.getType())));
		return;
	}
	this._loadBucketPermissions(permission.getBucket(), function(bucketPermissions, exception) {
		if (exception) {
			callback(null, exception);
			return;
		}
		// find the bucket permission with the same group as the permission and external type
		var bucketPermission = null;
		for (var i = 0; i < bucketPermissions.length; i++) {
			if (bucketPermissions[i].getType() == "3" && permission.getGroup() == bucketPermissions[i].getGroup()) {
				bucketPermission = bucketPermissions[i];
				break;
			}
		}
		if (bucketPermission == null) {
			callback(null, new tutao.rest.EntityRestException(new Error("no corresponding bucket permission found")));
			return;
		}
		var sessionKey;
		try {
			var bucketKey = tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), bucketPermission.getSymEncBucketKey());
			sessionKey = tutao.locator.aesCrypter.decryptKey(bucketKey, permission.getBucketEncSessionKey());
		} catch (e) {
			callback(null, new tutao.rest.EntityRestException(e));
			return;
		}
		callback(sessionKey);
	});
};

/**
 * Provides the session key via a symmetric encrypted session key.
 * @param {Array.<tutao.entity.sys.Permission>} permissions The permissions of the user on this entity.
 * @return {Object} Returns null if no permission was found and the session key otherwise.
 * @throw {tutao.crypto.CryptoException} If an error occurs during session key decryption.
 */
tutao.entity.EntityHelper._tryGetSymEncSessionKey = function(permissions) {
	var user = tutao.locator.userController.getLoggedInUser();
	for (var i = 0; i < permissions.length; i++) {
		if (permissions[i].getGroup() == user.getUserGroup().getGroup() && (permissions[i].getType() == "1" || permissions[i].getType() == "2")) {
			return tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), permissions[i].getSymEncSessionKey());
		}
	}
	var memberships = user.getMemberships();
	for (var i = 0; i < permissions.length; i++) {
		for (var a = 0; a < memberships.length; a++) {
			if (permissions[i].getGroup() == memberships[a].getGroup() && (permissions[i].getType() == "1" || permissions[i].getType() == "2")) {
				var groupKey = tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), memberships[a].getSymEncGKey());
				return tutao.locator.aesCrypter.decryptKey(groupKey, permissions[i].getSymEncSessionKey());
			}
		}
	}
	return null;
};

/**
 * Provides the session key via an asymmetric encrypted session key.
 * @param {Array.<tutao.entity.sys.Permission>} permissions The permissions of the user on this entity.
 * @param {function(?Object, tutao.rest.EntityRestException=)} callback Returns null if no permission was found and the session key otherwise. Returns an exception if decrypting the session key failed.
 */
tutao.entity.EntityHelper.prototype._tryGetPubEncSessionKey = function(permissions, callback) {
	var self = this;
	var user = tutao.locator.userController.getLoggedInUser();
    var groupKey;
	for (var i = 0; i < permissions.length; i++) {
		if (permissions[i].getGroup() == user.getUserGroup().getGroup() && permissions[i].getType() == "0") {
			groupKey = tutao.locator.userController.getUserGroupKey();
			self._loadPublicBucketPermissionSessionKey(permissions[i], groupKey, callback);
			return;
		}
	}
	var memberships = user.getMemberships();
	for (var i = 0; i < permissions.length; i++) {
		for (var a = 0; a < memberships.length; a++) {
			if (permissions[i].getGroup() == memberships[a].getGroup() && permissions[i].getType() == "0") {
				try {
					groupKey = tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), memberships[a].getSymEncGKey());
				} catch (e) {
					callback(null, new tutao.rest.EntityRestException(e));
					return;
				}
				self._loadPublicBucketPermissionSessionKey(permissions[i], groupKey, callback);
				return;
			}
		}
	}
	callback(null);
};

/**
 * Updates the given public permission with the given symmetric key for faster access.
 * @param {tutao.entity.sys.Permission} permission The permission.
 * @param {tutao.entity.sys.BucketPermission} bucketPermission The bucket permission.
 * @param {Object} groupKey The symmetric group key.
 * @param {Object} sessionKey The symmetric session key.
 */
tutao.entity.EntityHelper.prototype._updateWithSymPermissionKey = function(permission, bucketPermission, groupKey, sessionKey) {
	var self = this;
	if (this._entity.getListEncSessionKey) {
		tutao.entity.EntityHelper.getListKey(this._entity.getId()[0], function(listKey, exception) {
			if (!exception) {
				self._entity.setListEncSessionKey(tutao.locator.aesCrypter.encryptKey(listKey, sessionKey));
				try {
					self._entity.updateListEncSessionKey(function(exception) {
						if (exception) {
							console.log("this exception is ok for testing if another user is logged asynchronously (this method is not waiting executed synchronous)", exception);
						}
					});
				} catch (e) {
					console.log("this exception is ok for testing if another user is logged asynchronously (this method is not waiting executed synchronous)", e);
				}
			} else {
				console.log("this exception is ok for testing if another user is logged asynchronously (this method is not waiting executed synchronous)", exception);
			}
		});
	} else {
		var updateService = new tutao.entity.sys.UpdatePermissionKeyData();
		updateService.setPermission(permission.getId());
		updateService.setBucketPermission(bucketPermission.getId());
		updateService.setSymEncSessionKey(tutao.locator.aesCrypter.encryptKey(groupKey, sessionKey));
		updateService.setSymEncBucketKey("");
		updateService.setBucketEncSessionKey("");
		updateService.setup({}, tutao.entity.EntityHelper.createAuthHeaders(), function() {});
	}
};

/**
 * Downloads the list key and encrypts the session key of the instance with this key.
 * @param {string} listId The id of the list.
 * @param {function(?string, tutao.rest.EntityRestException=)} callback Called when finished.
 */
tutao.entity.EntityHelper.prototype.createListEncSessionKey = function(listId, callback) {
	var self = this;
	tutao.entity.EntityHelper.getListKey(listId, function(listKey, exception) {
		if (exception) {
			callback(null, exception);
		} else {
			callback(tutao.locator.aesCrypter.encryptKey(listKey, self.getSessionKey()));
		}
	});
};

/**
 * Loads the bucket permissions for the given bucket permission list id.
 * @param {string} bucketId The list id of the bucket permissions.
 * @param {function(?Array.<tutao.entity.sys.BucketPermission>, tutao.rest.EntityRestException=)} callback Called when finished.
 */
tutao.entity.EntityHelper.prototype._loadBucketPermissions = function(bucketId, callback) {
	tutao.entity.sys.BucketPermission.loadRange(bucketId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID, tutao.rest.EntityRestInterface.MAX_RANGE_COUNT, false, callback);
};

/**
 * Loads the session key from the given public permission. Updates the permission on the server with the
 * symmetric encrypted session key.
 * @param {tutao.entity.sys.Permission} permission The permission that contains the bucket encrypted session key.
 * @param {Object} groupKey The symmetric group key of the owner group of the permission.
 * @param {function(Object, tutao.rest.EntityRestException=)} callback Returns the session key or an exception if decrypting the session key failed or the group could not be loaded.
 */
tutao.entity.EntityHelper.prototype._loadPublicBucketPermissionSessionKey = function(permission, groupKey, callback) {
	var self = this;
	this._loadBucketPermissions(permission.getBucket(), function(bucketPermissions, exception) {
		if (exception) {
			callback(null, exception);
			return;
		}
		// find the bucket permission with the same group as the permission and public type
		var bucketPermission = null;
		for (var i = 0; i < bucketPermissions.length; i++) {
			if (bucketPermissions[i].getType() == "2" && permission.getGroup() == bucketPermissions[i].getGroup()) {
				bucketPermission = bucketPermissions[i];
				break;
			}
		}
		if (bucketPermission == null) {
			callback(null, new tutao.rest.EntityRestException(new Error("no corresponding bucket permission found")));
			return;
		}
		tutao.entity.sys.Group.load(permission.getGroup(), function(group, exception) {
			if (exception) {
				callback(null, exception);
				return;
			}
			var privateKey;
			try {
				privateKey = self._getPrivateKey(group, Number(bucketPermission.getPubKeyVersion()), groupKey);
			} catch (e) {
				callback(null, e);
				return;
			}
			tutao.locator.rsaCrypter.decryptAesKey(privateKey, bucketPermission.getPubEncBucketKey(), function(bucketKeyHex, exception) {
				if (exception) {
					callback(null, new tutao.rest.EntityRestException(exception));
					return;
				}
				var sessionKey;
				try {
					var bucketKey = tutao.locator.aesCrypter.hexToKey(bucketKeyHex);
					sessionKey = tutao.locator.aesCrypter.decryptKey(bucketKey, permission.getBucketEncSessionKey());
					self._updateWithSymPermissionKey(permission, bucketPermission, groupKey, sessionKey);
				} catch (e) {
					callback(null, new tutao.rest.EntityRestException(e));
					return;
				}
				callback(sessionKey);
			});
		});
	});
};

/**
 * Provides the private key corresponding to the given key pair version from the given group.
 * @param {tutao.entity.sys.Group} group The group.
 * @param {number} version The version of the key pair.
 * @param {Object} symGroupKey The group key of the given group.
 * @return {Object} The private key.
 * @throws {tutao.rest.EntityRestException} If the private key could not be found or could not be decrypted.
 */
tutao.entity.EntityHelper.prototype._getPrivateKey = function(group, version, symGroupKey) {
	var keyPairs = group.getKeys();
	for (var i = 0; i < group.getKeys().length; i++) {
		if (Number(keyPairs[i].getVersion()) == version) {
			try {
				var privateKeyHex = tutao.locator.aesCrypter.decryptPrivateRsaKey(symGroupKey, keyPairs[i].getSymEncPrivKey());
				return tutao.locator.rsaCrypter.hexToKey(privateKeyHex);
			} catch (e) {
				throw new tutao.rest.EntityRestException(e);
			}
		}
	}
	throw new tutao.rest.EntityRestException(new tutao.entity.InvalidDataException("private key with version" + version + " not found for group " + group.getId()));
};

/**
 * Returns a map which contains the encrypted session key for post requests.
 * @param {tutao.entity.BucketData} bucketData The bucket for which the shared permission shall be created
 * @return {Object.<string, string>} The post permission map.
 */
tutao.entity.EntityHelper.prototype.createPostPermissionMap = function(bucketData) {
	// use the user group as owner for now
	var map = {};
	map[tutao.rest.ResourceConstants.GROUP_ID] = tutao.locator.userController.getUserGroupId();
	if (this._entity.ENCRYPTED) {
		var symEncSessionKey = tutao.locator.aesCrypter.encryptKey(tutao.locator.userController.getUserGroupKey(), this.getSessionKey());
		map[tutao.rest.ResourceConstants.SYM_ENC_SESSION_KEY] = tutao.util.EncodingConverter.base64ToBase64Url(symEncSessionKey);
		map[tutao.rest.ResourceConstants.BUCKET_ENC_SESSION_KEY] = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.aesCrypter.encryptKey(bucketData.getBucketKey(), this.getSessionKey()));
	}
	map[tutao.rest.ResourceConstants.BUCKET_PERMISSION_LIST_ID] = bucketData.getBucketId();
	return map;
};

/**
 * Returns a map which contains the permission data for creating a list.
 * @param {tutao.entity.BucketData} bucketData The bucket for which the shared permission shall be created
 * @param {boolean} encrypted True if the type for which the list shall be created is encrypted, false otherwise.
 * @return {Object.<string, string>} The map.
 */
tutao.entity.EntityHelper.createPostListPermissionMap = function(bucketData, encrypted) {
	// user the user group as owner for now
	var listKey = tutao.locator.aesCrypter.generateRandomKey();
	var map = {};
	map[tutao.rest.ResourceConstants.GROUP_ID] = tutao.locator.userController.getUserGroupId();
	if (encrypted) {
		map[tutao.rest.ResourceConstants.SYM_ENC_LIST_KEY] = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.aesCrypter.encryptKey(tutao.locator.userController.getUserGroupKey(), listKey));
		map[tutao.rest.ResourceConstants.BUCKET_ENC_LIST_KEY] = tutao.util.EncodingConverter.base64ToBase64Url(tutao.locator.aesCrypter.encryptKey(bucketData.getBucketKey(), listKey));
	}
	map[tutao.rest.ResourceConstants.BUCKET_PERMISSION_LIST_ID] = bucketData.getBucketId();
	return map;
};

/**
 * Returns a map which contains authentication data for the logged in user.
 * @return {Object.<string, string>} The user id map.
 */
tutao.entity.EntityHelper.createAuthHeaders = function() {
	var map = {};
	map[tutao.rest.ResourceConstants.AUTH_VERIFIER_PARAMETER_NAME] = tutao.locator.userController.getAuthVerifier();
	if (tutao.locator.userController.isExternalUserLoggedIn()) {
		map[tutao.rest.ResourceConstants.AUTH_ID_PARAMETER_NAME] = tutao.locator.userController.getAuthId();
		map[tutao.rest.ResourceConstants.AUTH_TOKEN_PARAMETER_NAME] = tutao.locator.userController.getAuthToken();
	} else {
		map[tutao.rest.ResourceConstants.USER_ID_PARAMETER_NAME] = tutao.locator.userController.getUserId();		
	}
	return map;
};

/**
 * Converts the given aggregated type instances to a json string.
 * @param {Object|Array.<Object>} aggregates One or more aggregates.
 */
tutao.entity.EntityHelper.aggregatesToJsonData = function(aggregates) {
	if (!aggregates) {
		return null;
	} else if (aggregates instanceof Array) {
		var aggregateDataList = [];
		for (var i = 0; i < aggregates.length; i++) {
			aggregateDataList[i] = aggregates[i].toJsonData();
		}
		return aggregateDataList;
	} else {
		return aggregates.toJsonData();
	}
};

/**
 * Generates a random id for an aggregate.
 * @return {string} The id.
 */
tutao.entity.EntityHelper.generateAggregateId = function() {
	return tutao.util.EncodingConverter.base64ToBase64Url(tutao.util.EncodingConverter.hexToBase64(tutao.locator.randomizer.generateRandomData(4)));
};

/**
 * Loads the session keys for the given entities.
 * @param {Array.<Object>} entities. The entities to prepare.
 * @param {function(Array.<Object>, tutao.rest.EntityRestException=)} callback. Called when finished with the same entities as entered. Gets passed an exception if something went wrong.
 */
tutao.entity.EntityHelper.loadSessionKeys = function(entities, callback) {
	tutao.util.FunctionUtils.executeSequentially(entities, function(entity, elementFinishedCallback) {
		entity._entityHelper.loadSessionKey(function(entity, exception) {
			elementFinishedCallback(exception);
		});
	}, function(exception) {
		if (exception) {
			callback(null, exception);
		} else {
			callback(entities);
		}
	});
};
