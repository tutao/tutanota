"use strict";

goog.provide('tutao.rest.EntityRestDummy');

/**
 * The EntityRestDummy is an implementation of the EntityRestInterface that does nothing. It does neither return
 * any entities nor forward requests to other implementations.
 * @constructor
 * @implements tutao.rest.EntityRestInterface
 */
tutao.rest.EntityRestDummy = function() {
	// start with a 14 digit number to make it fit to the base64ext format
	this._nextId = 10000000;
	this._prefix = "----";
};

/**
 * @protected
 * Provides the next id.
 * @return {string} The next id.
 */
tutao.rest.EntityRestDummy.prototype._getNextId = function() {
	var id = this._prefix + this._nextId;
	this._nextId++;
	return id;
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.getElement = function(type, path, id, listId, parameters, headers, callback) {
	callback(null, new tutao.rest.EntityRestException(new tutao.rest.RestException(404)));
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.getService = function(type, path, data, parameters, headers, callback) {
	callback(null, new tutao.rest.EntityRestException(new tutao.rest.RestException(404)));
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.getElements = function(type, path, ids, parameters, headers, callback) {
	callback([]);
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.postElement = function(path, element, listId, parameters, headers, callback) {
	var returnEntity = new tutao.entity.base.PersistenceResourcePostReturn();
	// only generated ids must be set, so check if it is missing (custom ids are set by client before the post call)
	if (!element.__id) {		
		if (listId) {
			element.__id = [listId, this._getNextId()];
			returnEntity.setGeneratedId(element.__id[1]);  
		} else {
			element.__id = this._getNextId();
			returnEntity.setGeneratedId(element.__id);  
		}
	}
	element.__permissions = this._getNextId();
	returnEntity.setPermissionListId(element.__permissions);
	callback(returnEntity);
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.postService = function(path, element, parameters, headers, returnType, callback) {
	callback(null, new tutao.rest.EntityRestException(new tutao.rest.RestException(404)));
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.putElement = function(path, element, parameters, headers, callback) {
	callback();
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.putService = function(path, element, parameters, headers, returnType, callback) {
    callback(null, new tutao.rest.EntityRestException(new tutao.rest.RestException(404)));
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.postList = function(path, parameters, headers, callback) {
	callback(new tutao.entity.base.PersistenceResourcePostReturn({generatedId: this._getNextId(), permissionListId: this._getNextId()}));
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.getElementRange = function(type, path, listId, start, count, reverse, parameters, headers, callback) {
	callback([]);
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.deleteElement = function(path, id, listId, parameters, headers, callback) {
	callback();
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.deleteService = function(path, element, parameters, headers, returnType, callback) {
    callback(null, new tutao.rest.EntityRestException(new tutao.rest.RestException(404)));
};