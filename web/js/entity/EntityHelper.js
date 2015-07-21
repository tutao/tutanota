"use strict";

tutao.provide('tutao.entity.EntityHelper');

/**
 * Entity helper instances exist for each instance.
 * @param {Object} entity The entity this helper belongs to.
 * @constructor
 */
tutao.entity.EntityHelper = function(entity) {
	this._entity = entity;
	// contains objects of the form {listener: function(), id: *}
	this._observers = [];
};

/**
 * Register a function that is called as soon as any attribute of the entity has changed. If this listener
 * was already registered it is overwritten (i.e. the new id is stored)
 * @param {function(Object,*=)} listener. The listener function. When called it gets the entity and the given id as arguments.
 * @param {*=} id. An optional value that is just passed-through to the listener.
 */
tutao.entity.EntityHelper.prototype.registerObserver = function(listener, id) {
	for (var i = 0; i < this._observers.length; i++) {
		if (this._observers[i].listener == listener) {
			// just update the id
			this._observers[i].id = id;
			return;
		}
	}
	this._observers.push({ listener: listener, id: id });
};

/**
 * Removes a registered listener function if it was registered before.
 * @param {function(Object)} listener. The listener to unregister.
 */
tutao.entity.EntityHelper.prototype.unregisterObserver = function(listener) {
	for (var i = 0; i < this._observers.length; i++) {
		if (this._observers[i].listener == listener) {
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
		this._observers[i].listener(deleted, this._entity, this._observers[i].id);
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
 * @return {Promise.<Object>} Resolves to the entity this function has been called on or an exception if the loading failed.
 */
tutao.entity.EntityHelper.prototype.loadSessionKey = function() {
	var self = this;
	if (!this._entity.ENCRYPTED || this._sessionKey != null) {
		return Promise.resolve(this._entity);
	}
	if (this._entity.getListEncSessionKey && this._entity.getListEncSessionKey()) { // check that it is a list element type and that the list key is set
		return tutao.entity.EntityHelper.getListKey(this._entity.getId()[0]).then(function(listKey) {
            self.setSessionKey(tutao.locator.aesCrypter.decryptKey(listKey, self._entity.getListEncSessionKey()));
            return self._entity;
		}).caught(function(e) {
            return self._loadSessionKeyOfSinglePermission();
        });
	} else {
		return this._loadSessionKeyOfSinglePermission();
	}
};

/**
 * Loads the session key from a single permission (no list key is used).
 * @return {Promise.<Object>} Resolves to the entity this function has been called on or an exception if the loading failed.
 * @private
 */
tutao.entity.EntityHelper.prototype._loadSessionKeyOfSinglePermission = function() {
    var self = this;
    //TODO (Performance) avoid to load elements from server if some are already cached.
    return tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.Permission, this._entity.__permissions).then(function(permissions, exception) {
        if (tutao.locator.userController.isInternalUserLoggedIn()) {
            self.setSessionKey(tutao.entity.EntityHelper._tryGetSymEncSessionKey(permissions));
            if (self._sessionKey != null) {
                return self._entity;
            }
            return self._tryGetPubEncSessionKey(permissions).then(function(sessionKey) {
                self.setSessionKey(sessionKey);
                if (sessionKey == null) {
                    throw new tutao.NotAuthorizedError("session key not found in permissions");
                } else {
                    return self._entity;
                }
            });
        } else {
            self.setSessionKey(tutao.entity.EntityHelper._tryGetSymEncSessionKey(permissions));
            if (self._sessionKey != null) {
                return self._entity;
            }
            return self._tryGetExternalSessionKey(permissions).then(function(sessionKey) {
                self.setSessionKey(sessionKey);
                return self._entity;
            });
        }
    });
};

/**
 * Loads the list key from a list permission.
 * @param {string} listId The id of the list.
 * @return {Promise.<Object>} Resolves to the listKey or an exception if the loading failed.
 */
tutao.entity.EntityHelper.getListKey = function(listId) {
    return this._getListKey(listId, tutao.rest.EntityRestInterface.GENERATED_MIN_ID );
};

tutao.entity.EntityHelper._getListKey = function(listId, startId) {
    var self = this;
    return tutao.entity.sys.Permission.loadRange(listId, startId, 1, false).then(function(permissions) {
        var listKey = tutao.entity.EntityHelper._tryGetSymEncSessionKey(permissions);
        if (listKey != null) {
            return listKey;
        }
        // we have to create a dummy EntityHelper here because _tryGetPubEncSessionKey is not static. Pass an empty entity to allow updating a public list permission in _updateWithSymPermissionKey()
        return new tutao.entity.EntityHelper({})._tryGetPubEncSessionKey(permissions).then(function(listKey) {
            if (listKey != null) {
                return listKey;
            }
            if (permissions.length > 0) {
                return self._getListKey(listId, permissions[permissions.length -1].getId()[1]);
            } else {
                throw new Error("no list permission found");
            }
        });
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
 * @return {Promise.<Object>} Resolves to null if no permission was found and the session key otherwise. Rejects, if decrypting the session key failed.
 */
tutao.entity.EntityHelper.prototype._tryGetExternalSessionKey = function(permissions) {
    var self = this;
	if (permissions.length == 0) {
		return Promise.reject(new Error("no permission found"));
	}
	// there should be only one permission
	var permission = permissions[0];
	if (permission.getType() != "5") {
		return Promise.reject(new Error("no external permission type: " + permission.getType()));
	}
	return this._loadBucketPermissions(permission.getBucket().getBucketPermissions()).then(function(bucketPermissions) {
		// find the bucket permission with the same group as the permission and external type
		var bucketPermission = null;
		for (var i = 0; i < bucketPermissions.length; i++) {
			if (bucketPermissions[i].getType() == "3" && permission.getGroup() == bucketPermissions[i].getGroup()) {
				bucketPermission = bucketPermissions[i];
				break;
			}
		}
		if (bucketPermission == null) {
			throw new Error("no corresponding bucket permission found");
		}
		var sessionKey;
        var bucketKey = tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), bucketPermission.getSymEncBucketKey());
        sessionKey = tutao.locator.aesCrypter.decryptKey(bucketKey, permission.getBucketEncSessionKey());
        // finish _updateWithSymPermissionKey() before returning the session key to avoid that parallel updates result in BadRequestExceptions
        return self._updateWithSymPermissionKey(permission, bucketPermission, tutao.locator.userController.getUserGroupKey(), sessionKey).then(function() {
            return sessionKey;
        });
    });
};

/**
 * Provides the session key via a symmetric encrypted session key.
 * @param {Array.<tutao.entity.sys.Permission>} permissions The permissions of the user on this entity.
 * @return {Object} Returns null if no permission was found and the session key otherwise.
 * @throw {tutao.crypto.CryptoError} If an error occurs during session key decryption.
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
 * @return {Promise.<Object>} Resolves to null if no permission was found and the session key otherwise. Rejects if decrypting the session key failed.
 */
tutao.entity.EntityHelper.prototype._tryGetPubEncSessionKey = function(permissions) {
	var self = this;
	var user = tutao.locator.userController.getLoggedInUser();
    var groupKey;
	for (var i = 0; i < permissions.length; i++) {
		if (permissions[i].getGroup() == user.getUserGroup().getGroup() && permissions[i].getType() == "0") {
			groupKey = tutao.locator.userController.getUserGroupKey();
			return self._loadPublicBucketPermissionSessionKey(permissions[i], groupKey);
		}
	}
	var memberships = user.getMemberships();
	for (var i = 0; i < permissions.length; i++) {
		for (var a = 0; a < memberships.length; a++) {
			if (permissions[i].getGroup() == memberships[a].getGroup() && permissions[i].getType() == "0") {
                groupKey = tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), memberships[a].getSymEncGKey());
				return self._loadPublicBucketPermissionSessionKey(permissions[i], groupKey);
			}
		}
	}
	return Promise.resolve(null);
};

/**
 * Updates the given public permission with the given symmetric key for faster access.
 * @param {tutao.entity.sys.Permission} permission The permission.
 * @param {tutao.entity.sys.BucketPermission} bucketPermission The bucket permission.
 * @param {Object} groupKey The symmetric group key.
 * @param {Object} sessionKey The symmetric session key.
 * @return {Promise} When finished.
 */
tutao.entity.EntityHelper.prototype._updateWithSymPermissionKey = function(permission, bucketPermission, groupKey, sessionKey) {
	var self = this;
	if (this._entity.getListEncSessionKey) {
		return tutao.entity.EntityHelper.getListKey(this._entity.getId()[0]).then(function(listKey) {
            self._entity.setListEncSessionKey(tutao.locator.aesCrypter.encryptKey(listKey, sessionKey));
            return self._entity.updateListEncSessionKey();
		}).caught(function(e) {
            console.log("this exception is ok for testing if another user is logged asynchronously (this method is not waiting executed synchronous)", e);
        });
	} else {
		var updateService = new tutao.entity.sys.UpdatePermissionKeyData();
		updateService.setPermission(permission.getId());
		updateService.setBucketPermission(bucketPermission.getId());
		updateService.setSymEncSessionKey(tutao.locator.aesCrypter.encryptKey(groupKey, sessionKey));
		updateService.setSymEncBucketKey(null);
		updateService.setBucketEncSessionKey(null);
		return updateService.setup({}, tutao.entity.EntityHelper.createAuthHeaders());
	}
};

/**
 * Downloads the list key and encrypts the session key of the instance with this key.
 * @param {string} listId The id of the list.
 * @return {Promise.<string>}
 */
tutao.entity.EntityHelper.prototype.createListEncSessionKey = function(listId) {
	var self = this;
	return tutao.entity.EntityHelper.getListKey(listId).then(function(listKey, exception) {
		return tutao.locator.aesCrypter.encryptKey(listKey, self.getSessionKey());
	});
};

/**
 * Loads the bucket permissions for the given bucket permission list id.
 * @param {string} bucketId The list id of the bucket permissions.
 * @return {Promise.<Array.<tutao.entity.sys.BucketPermission>>}
 */
tutao.entity.EntityHelper.prototype._loadBucketPermissions = function(bucketId) {
    //TODO (Performance) avoid to load elements from server if some are already cached.
    return tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.BucketPermission, bucketId);
};

/**
 * Loads the session key from the given public permission. Updates the permission on the server with the
 * symmetric encrypted session key.
 * @param {tutao.entity.sys.Permission} permission The permission that contains the bucket encrypted session key.
 * @param {Object} groupKey The symmetric group key of the owner group of the permission.
 * @return {Promise.<Object>} Resolves to the session key. Rejects if decrypting the session key failed or the group could not be loaded.
 */
tutao.entity.EntityHelper.prototype._loadPublicBucketPermissionSessionKey = function(permission, groupKey) {
	var self = this;
	return this._loadBucketPermissions(permission.getBucket().getBucketPermissions()).then(function(bucketPermissions) {
		// find the bucket permission with the same group as the permission and public type
		var bucketPermission = null;
		for (var i = 0; i < bucketPermissions.length; i++) {
			if (bucketPermissions[i].getType() == "2" && permission.getGroup() == bucketPermissions[i].getGroup()) {
				bucketPermission = bucketPermissions[i];
				break;
			}
		}
		if (bucketPermission == null) {
			throw new Error("no corresponding bucket permission found");
		}
		return tutao.entity.sys.Group.load(permission.getGroup()).then(function(group) {
			var privateKey = self._getPrivateKey(group, Number(bucketPermission.getPubKeyVersion()), groupKey);
            return tutao.locator.crypto.rsaDecrypt(privateKey, tutao.util.EncodingConverter.base64ToArray(bucketPermission.getPubEncBucketKey())).then(function(bucketKeyBytes) {
                var bucketKey = sjcl.codec.bytes.toBits(bucketKeyBytes);
                var sessionKey = tutao.locator.aesCrypter.decryptKey(bucketKey, permission.getBucketEncSessionKey());
                // finish _updateWithSymPermissionKey() before returning the session key to avoid that parallel updates result in BadRequestExceptions
                return self._updateWithSymPermissionKey(permission, bucketPermission, groupKey, sessionKey).then(function() {
                    return sessionKey;
                });
            });
		});
	});
};

/**
 * Provides the private key corresponding to the given key pair version from the given group.
 * @param {tutao.entity.sys.Group} group The group.
 * @param {number} version The version of the key pair.
 * @param {Object} symGroupKey The group key of the given group.
 * @return {tutao.native.PrivateKey} The private key.
 * @throws {tutao.InvalidDataError} If the private key could not be found or could not be decrypted.
 */
tutao.entity.EntityHelper.prototype._getPrivateKey = function(group, version, symGroupKey) {
	var keyPairs = group.getKeys();
	for (var i = 0; i < group.getKeys().length; i++) {
		if (Number(keyPairs[i].getVersion()) == version) {
            var privateKeyHex = tutao.locator.aesCrypter.decryptPrivateRsaKey(symGroupKey, keyPairs[i].getSymEncPrivKey());
            return tutao.locator.rsaUtil.hexToPrivateKey(privateKeyHex);
		}
	}
	throw new tutao.InvalidDataError("private key with version" + version + " not found for group " + group.getId());
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
    map[tutao.rest.ResourceConstants.USER_ID_PARAMETER_NAME] = tutao.locator.userController.getUserId();
	map[tutao.rest.ResourceConstants.AUTH_VERIFIER_PARAMETER_NAME] = tutao.locator.userController.getAuthVerifier();
	if (tutao.locator.userController.isExternalUserLoggedIn()) {
        map[tutao.rest.ResourceConstants.AUTH_TOKEN_PARAMETER_NAME] = tutao.locator.userController.getAuthToken();
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
 * @return {Promise.<Array.<Object>>} Resolves to the same entities which have been provided. Rejects if loading the session keys failed.
 */
tutao.entity.EntityHelper.loadSessionKeys = function(entities) {
    // always load sequentially (each) instead of in parallel (map), many server requests may be done in parallel if the key is not yet cached
    return Promise.each(entities, function(entity) {
        return entity._entityHelper.loadSessionKey();
    });
};
