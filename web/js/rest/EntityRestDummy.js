"use strict";

tutao.provide('tutao.rest.EntityRestDummy');

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

    // @type {Object.<string,Object.<string, Array.<Object>>>}
    this._db = {};
//	var dbstructure = {         // only for documentation
//		'path': { 		// element type
//			"0": [element1, element2]
//		},
//		'path': { 		// list element type
//			'listId': [element1, element2]
//		}
//	};

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
tutao.rest.EntityRestDummy.prototype.getElement = function(type, path, id, listId, parameters, headers) {
    return Promise.reject(new tutao.NotFoundError());
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.getService = function(type, path, data, parameters, headers) {
    return Promise.reject(new tutao.NotFoundError());
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.getElements = function(type, path, ids, parameters, headers) {
    return Promise.resolve([]);
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.postElement = function(path, element, listId, parameters, headers) {
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

    this._addToCache(path, element);

	return Promise.resolve(returnEntity);
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.postService = function(path, element, parameters, headers, returnType) {
    return Promise.reject(new tutao.NotFoundError());
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.putElement = function(path, element, parameters, headers) {
    return Promise.resolve();
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.putService = function(path, element, parameters, headers, returnType) {
    return Promise.reject(new tutao.NotFoundError());
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.postList = function(path, parameters, headers) {
    return Promise.resolve(new tutao.entity.base.PersistenceResourcePostReturn({generatedId: this._getNextId(), permissionListId: this._getNextId()}));
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.getElementRange = function(type, path, listId, start, count, reverse, parameters, headers, callback) {
	return Promise.resolve(this._provideFromCache(path, listId, start, count, reverse));
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.deleteElement = function(path, id, listId, parameters, headers) {
    return Promise.resolve();
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestDummy.prototype.deleteService = function(path, element, parameters, headers, returnType) {
    return Promise.reject(new tutao.NotFoundError());
};

/**
 * Posts the given element into the cache.
 * @param {string} path The name of the type of the given element.
 * @param {Object} element The element to add.
 * @protected
 */
tutao.rest.EntityRestDummy.prototype._addToCache = function(path, element) {
    var listId = tutao.rest.EntityRestDummy.getListId(element);
    var elementId = tutao.rest.EntityRestInterface.getElementId(element);
    var listData = this._getListData(path,listId);
    for(var i=0; i<listData.length; i++){
        var listElement = listData[i];
        if (tutao.rest.EntityRestInterface.firstBiggerThanSecond(tutao.rest.EntityRestInterface.getElementId(listElement),elementId)) {
            listData.splice(i, 0, element);
            return;
        }
        if (elementId == tutao.rest.EntityRestInterface.getElementId(listElement)) {
            listData.splice(i, 1, element);
            return;
        }
    }
    listData.push(element);
};


/**
 * Provides the elements from the cache.
 * @param {string} path The path including prefix, app name and type name.
 * @param {string} listId The id of the list that contains the elements.
 * @param {string} start The id from where to start to get elements.
 * @param {number} count The maximum number of elements to load.
 * @param {boolean} reverse If true, the elements are loaded from the start backwards in the list, forwards otherwise.
 */
tutao.rest.EntityRestDummy.prototype._provideFromCache = function(path, listId, start, count, reverse) {
	tutao.util.Assert.assert(count >= 0, "count is negative");
    var listData = this._getListData(path, listId);
    var result = [];
    if (reverse) {
        for (var i = listData.length - 1; i >= 0; i--) {
            if (tutao.rest.EntityRestInterface.firstBiggerThanSecond(start, tutao.rest.EntityRestInterface.getElementId(listData[i]))) {
                var startIndex = i + 1 - count;
                if(startIndex < 0){
                    startIndex = 0;
                }
                result = listData.slice(startIndex, i + 1);
                result.reverse();
                break;
            }
        }
    } else {
        for (var i = 0; i < listData.length; i++) {
            if (tutao.rest.EntityRestInterface.firstBiggerThanSecond(tutao.rest.EntityRestInterface.getElementId(listData[i]), start)) {
                result = listData.slice(i, i + count);
                break;
            }
        }
    }
    return result;
};


tutao.rest.EntityRestDummy.prototype._getListData = function(path, listId){
    this._db[path] = this._db[path] || {};
    this._db[path][listId] = this._db[path][listId] || [];
    return this._db[path][listId];
};


/**
 * Returns the list id of the specified element if it is a LET otherwise "0" returns.
 * @param {Object} element The element
 * @returns {string} The list id
 */
tutao.rest.EntityRestDummy.getListId = function(element) {
    if (element.__id instanceof Array) {
        return element.__id[0];
    } else {
        return "0";
    }
};
