"use strict";

goog.provide('tutao.rest.EntityRestDummy');
//import('tutao.rest.EntityRestInterface');

/**
 * The EntityRestDummy is an implementation of the EntityRestInterface that does nothing. It does neither return
 * any entities nor forward requests to other implementations.
 * @constructor
 * @implements tutao.rest.EntityRestInterface
 */
tutao.rest.EntityRestDummy = function() {
	// start with a 14 digit number to make it fit to the base64ext format
	this._nextId = 10000000;
	this._prefix = "------";
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
tutao.rest.EntityRestDummy.prototype.postElement = function(path, element, listId, parameters, headers, returnType, callback) {
	var returnData = new returnType(); // this isPersistenceResourcePostReturn
	// only generated ids must be set, so check if it is missing (custom ids are set by client before the post call)
	if (!element.__id) {			
		returnData.setGeneratedId(this._getNextId());  
	}
	returnData.setPermissionListId(this._getNextId());
	callback(returnData);
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
tutao.rest.EntityRestDummy.prototype.postList = function(path, parameters, headers, callback) {
	callback(this._getNextId());
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
tutao.rest.EntityRestDummy.prototype.deleteElements = function(path, ids, listId, parameters, headers, callback) {
	callback();
};
