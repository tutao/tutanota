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
    if (this._entity.getOwnerEncSessionKey && this._entity.getOwnerEncSessionKey()) {
        var ownerGroupKey = tutao.locator.userController.getGroupKey(this._entity.getOwnerGroup());
        if (ownerGroupKey != null) {
            try {
                this.setSessionKey(tutao.locator.aesCrypter.decryptKey(ownerGroupKey, this._entity.getOwnerEncSessionKey()));
                return Promise.resolve(self._entity);
            } catch (e) {
                if (e instanceof tutao.crypto.CryptoError) {
                    console.log("could not load session key", e);
                    return Promise.resolve(self._entity);
                } else {
                    return Promise.reject(e);
                }
            }
        }
    }
    if (!this._entity.getOwnerGroup() && !this._entity.getOwnerEncSessionKey() && this._entity.getListEncSessionKey && this._entity.getListEncSessionKey()) {
        // legacy for GroupInfo and check that it is a list element type and that the list key is set
		return tutao.entity.EntityHelper._getListKey(this._entity.getId()[0], tutao.rest.EntityRestInterface.GENERATED_MIN_ID).then(function(listKey) {
            self.setSessionKey(tutao.locator.aesCrypter.decryptKey(listKey, self._entity.getListEncSessionKey()));
            return self._entity;
		}).caught(function(e) {
            if (e instanceof tutao.crypto.CryptoError) {
                console.log("could not load session key", e);
                return self._entity;
            } else {
                throw e;
            }
        });
	} else {
		return this._loadSessionKeyOfSinglePermission().caught(function(e) {
            if (e instanceof tutao.crypto.CryptoError) {
                console.log("could not load session key", e);
                return self._entity;
            } else {
                throw e;
            }
        });
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
    return tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.Permission, this._entity.__permissions).then(function(permissions) {
        if (tutao.locator.userController.isInternalUserLoggedIn()) {
            self.setSessionKey(tutao.entity.EntityHelper._tryGetPermissionOwnerEncSessionKey(permissions));
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
            self.setSessionKey(tutao.entity.EntityHelper._tryGetPermissionOwnerEncSessionKey(permissions));
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
 * @param {string} startId This function loads one permission after the other. Start with this id, usually tutao.rest.EntityRestInterface.GENERATED_MIN_ID.
 * @return {Promise.<Object>} Resolves to the listKey or an exception if the loading failed.
 */
tutao.entity.EntityHelper._getListKey = function(listId, startId) {
    var self = this;
    return tutao.entity.sys.Permission.loadRange(listId, startId, 1, false).then(function(permissions) {
        if (permissions.length == 0) {
            throw new tutao.NotAuthorizedError("no list permission found");
        }
        var user = tutao.locator.userController.getLoggedInUser();
        if (permissions[0].getType() == "1" || permissions[0].getType() == "2") {
            var permissionGroupKey = tutao.locator.userController.getGroupKey(permissions[0].getGroup());
            if (permissionGroupKey != null) {
                return tutao.locator.aesCrypter.decryptKey(permissionGroupKey, permissions[0].getSymEncSessionKey());
            }
        }
        if (permissions.length > 0) {
            return self._getListKey(listId, permissions[permissions.length -1].getId()[1]);
        } else {
            throw new tutao.NotAuthorizedError("no list permission found");
        }
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
 * Makes sure that the session key is invalid. This indicates that an error occurred during decryption.
 */
tutao.entity.EntityHelper.prototype.invalidateSessionKey = function() {
    this._sessionKey = null;
    console.log("invalidating session key");
};

/**
 * Provides the session key via an externally encrypted session key.
 * @param {Array.<tutao.entity.sys.Permission>} permissions The permissions of the user on this entity.
 * @return {Promise.<Object>} Resolves to null if no permission was found and the session key otherwise. Rejects, if decrypting the session key failed.
 */
tutao.entity.EntityHelper.prototype._tryGetExternalSessionKey = function(permissions) {
    var self = this;
	if (permissions.length == 0) {
		return Promise.reject(new tutao.NotAuthorizedError("no permission found"));
	}
	// there should be only one permission
	var permission = permissions[0];
	if (permission.getType() != "5") {
		return Promise.reject(new tutao.NotAuthorizedError("no external permission type: " + permission.getType()));
	}
	return this._loadBucketPermissions(permission.getBucket().getBucketPermissions()).then(function(bucketPermissions) {
		// find the bucket permission with the same group as the permission and external type
		var bucketPermission = null;
		for (var i = 0; i < bucketPermissions.length; i++) {
			if (bucketPermissions[i].getType() == "3" && permission.getOwnerGroup() == bucketPermissions[i].getOwnerGroup()) {
				bucketPermission = bucketPermissions[i];
				break;
			}
		}
		if (bucketPermission == null) {
			throw new tutao.NotAuthorizedError("no corresponding bucket permission found");
		}

		var bucketPermissionOwnerGroupKey = tutao.locator.userController.getGroupKey(bucketPermission.getOwnerGroup());
        var bucketPermissionGroupKey = tutao.locator.userController.getGroupKey(bucketPermission.getGroup());
        var bucketKey;
        if (bucketPermission.getOwnerEncBucketKey()) {
            bucketKey = tutao.locator.aesCrypter.decryptKey(bucketPermissionOwnerGroupKey, bucketPermission.getOwnerEncBucketKey());
        } else {
            bucketKey = tutao.locator.aesCrypter.decryptKey(tutao.locator.userController.getUserGroupKey(), bucketPermission.getSymEncBucketKey());
        }
        var sessionKey = tutao.locator.aesCrypter.decryptKey(bucketKey, permission.getBucketEncSessionKey());
        // finish _updateWithSymPermissionKey() before returning the session key to avoid that parallel updates result in BadRequestExceptions
        return self._updateWithSymPermissionKey(permission, bucketPermission, bucketPermissionOwnerGroupKey, bucketPermissionGroupKey, sessionKey).then(function() {
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
tutao.entity.EntityHelper._tryGetPermissionOwnerEncSessionKey = function(permissions) {
	var user = tutao.locator.userController.getLoggedInUser();
	for (var i = 0; i < permissions.length; i++) {
		if (permissions[i].getType() == "1" || permissions[i].getType() == "2") {
            var permissionOwnerGroupKey = tutao.locator.userController.getGroupKey(permissions[i].getOwnerGroup());
            if (permissionOwnerGroupKey != null) {
                return tutao.locator.aesCrypter.decryptKey(permissionOwnerGroupKey, permissions[i].getOwnerEncSessionKey());
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
		if (permissions[i].getType() == "0") {
            var permissionOwnerGroupKey = tutao.locator.userController.getGroupKey(permissions[i].getOwnerGroup());
            if (permissionOwnerGroupKey != null) {
                return self._loadPublicBucketPermissionSessionKey(permissions[i], permissionOwnerGroupKey);
            }
		}
	}
	return Promise.resolve(null);
};

/**
 * Updates the given public permission with the given symmetric key for faster access.
 * @param {tutao.entity.sys.Permission} permission The permission.
 * @param {tutao.entity.sys.BucketPermission} bucketPermission The bucket permission.
 * @param {Object} permissionOwnerGroupKey The symmetric group key for the owner group on the permission.
 * @param {Object} permissionGroupKey The symmetric group key of the group in the permission.
 * @param {Object} sessionKey The symmetric session key.
 * @return {Promise} When finished.
 */
tutao.entity.EntityHelper.prototype._updateWithSymPermissionKey = function(permission, bucketPermission, permissionOwnerGroupKey, permissionGroupKey, sessionKey) {
	var self = this;
	if (!this._entity.getOwnerEncSessionKey() && permission.getOwnerGroup() == self._entity.getOwnerGroup()) {
            self._entity.setOwnerEncSessionKey(tutao.locator.aesCrypter.encryptKey(permissionOwnerGroupKey, sessionKey));
            return self._entity.updateOwnerEncSessionKey();
	} else {
		var updateService = new tutao.entity.sys.UpdatePermissionKeyData();
		updateService.setPermission(permission.getId());
		updateService.setBucketPermission(bucketPermission.getId());
		updateService.setOwnerEncSessionKey(tutao.locator.aesCrypter.encryptKey(permissionOwnerGroupKey, sessionKey));
        updateService.setSymEncSessionKey(tutao.locator.aesCrypter.encryptKey(permissionGroupKey, sessionKey));
		return updateService.setup({}, tutao.entity.EntityHelper.createAuthHeaders());
	}
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
 * @param {Object} permissionOwnerGroupKey The symmetric group key of the owner group of the permission.
 * @return {Promise.<Object>} Resolves to the session key. Rejects if decrypting the session key failed or the group could not be loaded.
 */
tutao.entity.EntityHelper.prototype._loadPublicBucketPermissionSessionKey = function(permission, permissionOwnerGroupKey) {
	var self = this;
	return this._loadBucketPermissions(permission.getBucket().getBucketPermissions()).then(function(bucketPermissions) {
		// find the bucket permission with the same group as the permission and public type
		var bucketPermission = null;
		for (var i = 0; i < bucketPermissions.length; i++) {
			if (bucketPermissions[i].getType() == "2" && permission.getOwnerGroup() == bucketPermissions[i].getOwnerGroup()) {
				bucketPermission = bucketPermissions[i];
				break;
			}
		}
		if (bucketPermission == null) {
			throw new tutao.NotAuthorizedError("no corresponding bucket permission found");
		}

        var keyPairGroupId;
        var keyPairGroupKey;
        if (tutao.locator.userController.getGroupId(tutao.entity.tutanota.TutanotaConstants.GROUP_TYPE_MAIL) == permission.getOwnerGroup() ||
            tutao.locator.userController.getGroupId(tutao.entity.tutanota.TutanotaConstants.GROUP_TYPE_CONTACT) == permission.getOwnerGroup() ||
            tutao.locator.userController.getGroupId(tutao.entity.tutanota.TutanotaConstants.GROUP_TYPE_FILE) == permission.getOwnerGroup()) {
            // as long as the key pair is located on the user group, load it from there
            keyPairGroupId = tutao.locator.userController.getUserGroupId();
            keyPairGroupKey = tutao.locator.userController.getUserGroupKey();
        } else {
            keyPairGroupId = permission.getOwnerGroup();
            keyPairGroupKey = permissionOwnerGroupKey;
        }

		return tutao.entity.sys.Group.load(keyPairGroupId).then(function(keyPairGroup) {
			var privateKey = self._getPrivateKey(keyPairGroup, Number(bucketPermission.getPubKeyVersion()), keyPairGroupKey);
            return tutao.locator.crypto.rsaDecrypt(privateKey, tutao.util.EncodingConverter.base64ToUint8Array(bucketPermission.getPubEncBucketKey())).then(function(bucketKeyBytes) {
                var bucketKey = sjcl.codec.bytes.toBits(bucketKeyBytes);
                var sessionKey = tutao.locator.aesCrypter.decryptKey(bucketKey, permission.getBucketEncSessionKey());
                // finish _updateWithSymPermissionKey() before returning the session key to avoid that parallel updates result in BadRequestExceptions
                var permissionGroupKey = tutao.locator.userController.getGroupKey(permission.getGroup());
                return self._updateWithSymPermissionKey(permission, bucketPermission, permissionOwnerGroupKey, permissionGroupKey, sessionKey).then(function() {
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
 * Returns a map which contains the permission data for creating a list.
 * @param {string} groupId The group for which the list is created.
 * @return {Object.<string, string>} The map.
 */
tutao.entity.EntityHelper.createPostListPermissionMap = function(groupId) {
	var map = {};
	map[tutao.rest.ResourceConstants.GROUP_ID] = groupId;
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
	return tutao.util.EncodingConverter.base64ToBase64Url(tutao.util.EncodingConverter.uint8ArrayToBase64(tutao.locator.randomizer.generateRandomData(4)));
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
