"use strict";

goog.provide('tutao.rest.EntityRestCache');

/**
 * This implementation of the EntityRestInterface provides a caching mechanism to the entity rest chain.
 * It forwards requests to another EntityRestInterface implementation, so it can be put in front of a
 * EntityRestClient. In front of a EntityRestDummy it can serve as a stub for unit tests.
 * The cache works as follows:
 * If a write to the target fails, the cache is also not written and the request fails.
 * If a read from the target fails, the request fails.
 * If a write to the target is successful, the cache is also written.
 * If a read from the target is successful, the cache is written and the element returned.
 * The cache initially loads the complete range of LETS from target and puts it into the cache. Further
 * range requests are served by the cache.
 *
 * This behavior allows using a EntityRestDummy as target and still serve all requests from the cache, even though
 * the dummy would not return any elements for read requests.
 *
 * @constructor
 * @implements tutao.rest.EntityRestInterface
 */
tutao.rest.EntityRestCache = function() {
	/**
	 * stores all contents that would be stored on the server, otherwise
	 * @protected
	 */
    // @type {Object.<string,Object.<string, Array.<string>>>}
	this._db = {};
//	var dbstructure = {         // only for documentation
//		'path': { 		// element type
//			"0": {
//				'element1Id': 'element1',
//				'element2Id': 'element2'
//				// and so on
//			}
//		},
//		'path': { 		// list element type
//			'listId': {
//				allRange: ['listElement1Id', 'listElement2Id'],
//				'listElement1Id': 'listElement1',
//				'listElement2Id': 'listElement2'
//				// and so on
//			}
//		}
//	};

	/**
	 * requests are forwarded to this entity rest instance
	 */
    // @type {tutao.rest.EntityRestInterface}
	this._target = undefined;

    // TODO (story push events) remove after update notifications are in place
    this._ignoredPaths = [tutao.entity.sys.GroupInfo.PATH];
};

/**
 * Set an instance that implements EntityRestInterface to which requests are forwarded.
 * This function must be called before any other request functions to instances of this class.
 * @param {tutao.rest.EntityRestInterface} entityRestTarget The target.
 */
tutao.rest.EntityRestCache.prototype.setTarget = function(entityRestTarget) {
	this._target = entityRestTarget;
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.getElement = function(type, path, id, listId, parameters, headers) {
    var self = this;
    var cacheListId = (listId) ? listId : "0";
    var versionRequest = (parameters && parameters.version) ? true : false;
    if (versionRequest || !this._db[path] || !this._db[path][cacheListId] || !this._db[path][cacheListId][id] || tutao.util.ArrayUtils.contains(this._ignoredPaths, path)) {
        // the element is not in the cache, so get it from target
        return this._target.getElement(type, path, id, listId, parameters, headers).then(function(element) {
            // cache the received element
            if (!versionRequest) {
                self._addToCache(path, element);
                self._tryAddToRange(path, element);
            }
            return element;
        });
    } else {
        return Promise.resolve(self._db[path][cacheListId][id]);
    }
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.getService = function(type, path, data, parameters, headers) {
	return this._target.getService(type, path, data, parameters, headers);
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.getElements = function(type, path, ids, parameters, headers) {
	var elements = [];
	var fromDbIds = [];
	var cacheListId = "0"; // currently only for ETs
	for ( var i = 0; i < ids.length; i++) {
		var id = ids[i];
		if (!this._db[path] || !this._db[path][cacheListId] || !this._db[path][cacheListId][id]) {
			// the element is not in the cache, so get it from target
			fromDbIds.push(id);
		} else {
			// read from cache
			elements.push(this._db[path][cacheListId][id]);
		}
	}
	if (fromDbIds.length > 0) {
		var self = this;
		return this._target.getElements(type, path, fromDbIds, parameters, headers).then(function(serverElements) {
			for ( var i = 0; i < serverElements.length; i++) {
				// cache the received elements
				self._addToCache(path, serverElements[i]);
				self._tryAddToRange(path, serverElements[i]);
				
				// merge with cached elements
				elements.push(serverElements[i]);
			}			
			return elements;
		});
	} else {
		return Promise.resolve(elements);
	}
};

/**
 * Adds the element id to the range if it is an LET and the range is loaded
 * @param {string} path The name of the type of the given element.
 * @param {Object} element The element to add.
 * @protected
 */
tutao.rest.EntityRestCache.prototype._tryAddToRange = function(path, element) {
	if (element.__id instanceof Array) {
		var listId = element.__id[0];
		var id = element.__id[1];
		if (this._db[path][listId]['allRange']) {
			if (this._db[path][listId]['allRange'].length == 0 ||
			tutao.rest.EntityRestInterface.firstBiggerThanSecond(id, tutao.util.ArrayUtils.last(this._db[path][listId]['allRange']))) {
				this._db[path][listId]['allRange'].push(id);
			}
		}
	}
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.postElement = function(path, element, listId, parameters, headers) {
	var self = this;
	return this._target.postElement(path, element, listId, parameters, headers).then(function(returnEntity) {
        var cacheListId = undefined;
        var id = undefined;
        if (element.__id instanceof Array) {
            cacheListId = element.__id[0];
            id = element.__id[1];
        } else {
            cacheListId = "0";
            id = element.__id;
        }
        if (self._db[path] && self._db[path][cacheListId] && self._db[path][cacheListId][id]) {
            // this should not happen
            console.log("cache out of sync for post: " + path);
        }

        self._addToCache(path, element);
        self._tryAddToRange(path, element);
		return returnEntity;
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.postService = function(path, element, parameters, headers, returnType) {
	return this._target.postService(path, element, parameters, headers, returnType);
};

/**
 * Puts the given element into the cache.
 * @param {string} path The name of the type of the given element.
 * @param {Object} element The element to add.
 * @protected
 */
tutao.rest.EntityRestCache.prototype._addToCache = function(path, element) {
	var cacheListId = undefined;
	var id = undefined;
	if (element.__id instanceof Array) { // LET
		cacheListId = element.__id[0];
		id = element.__id[1];
	} else { // ET
		cacheListId = "0";
		id = element.__id;
	}
	this._db[path] = this._db[path] || {};
	this._db[path][cacheListId] = this._db[path][cacheListId] || {};

	this._db[path][cacheListId][id] = element;
};


/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.putElement = function(path, element, parameters, headers) {
	var self = this;
	return this._target.putElement(path, element, parameters, headers).then(function() {
        var cacheListId = undefined;
        var id = undefined;
        if (element.__id instanceof Array) {
            cacheListId = element.__id[0];
            id = element.__id[1];
        } else {
            cacheListId = "0";
            id = element.__id;
        }
        if (!self._db[path] || !self._db[path][cacheListId] || !self._db[path][cacheListId][id]) {
            // this should not happen. it means that the target and this cache are out of sync.
            // put on the target worked fine, so the element was existing on the target.
            // it must habe been received from the target or posted first, otherwise it would not have been possible to put it.
            // we somehow must have missed receiving the element and putting it into the cache.
            console.log("cache out of sync for " + path);
        }

        self._addToCache(path, element);
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.putService = function(path, element, parameters, headers, returnType) {
    return this._target.putService(path, element, parameters, headers, returnType);
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.postList = function(path, parameters, headers) {
	return this._target.postList(path, parameters, headers);
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.getElementRange = function(type, path, listId, start, count, reverse, parameters, headers) {
    tutao.util.Assert.assert(typeof start == "string", "expected start to be a string, but was: " + start + " -> " + (typeof start)); // element id

	var self = this;
	this._db[path] = this._db[path] || {};
	this._db[path][listId] = this._db[path][listId] || {};

	if (path.indexOf("/rest/monitor/") != -1 || !type.GENERATED_ID) { // customIds shall not be cached because new instances might be inserted into already retrieved ranges
		return this._target.getElementRange(type, path, listId, start, count, reverse, parameters, headers);
	} else if (!this._db[path][listId]['allRange']) {
		// there was no range loaded up to now. we can not load the range earlier than now (or in getElement) because
		// we need the type argument to create the elements. Any posts that my have come earlier still need to go into the
		// cache because the target does not return them if it is a dummy. So add all elements to the range that are
		// already in the cache
		// load all elements (i.e. up to 1000000)
		// TODO (story Partial loading of email list) only cache what is requested.
		return this._target.getElementRange(type, path, listId, "", tutao.rest.EntityRestInterface.MAX_RANGE_COUNT, false, parameters, headers).then(function(elements) {
			self._db[path][listId].allRange = [];
			for (var i = 0; i < elements.length; i++) {
				self._addToCache(path, elements[i]);
			}
			// add all elements to the range that were posted already. they need to be added in ascending order
			var elementsToAdd = [];
			for (var member in self._db[path][listId]) {
				if (member != 'allRange') {
					elementsToAdd.push(self._db[path][listId][member]);
				}
			}
			// add the elements to the range
			for (var b = 0; b < elementsToAdd.length; b++) {
				self._tryAddToRange(path, elementsToAdd[b]);
			}
			return self._provideFromCache(path, listId, start, count, reverse);
		});
	} else {
		if (reverse) {
			// only request a range from target if the start id is bigger than the last id in allRange
			if (this._db[path][listId]['allRange'].length == 0 || tutao.rest.EntityRestInterface.firstBiggerThanSecond(start, tutao.util.ArrayUtils.last(this._db[path][listId]['allRange']))) {
				return this._target.getElementRange(type, path, listId, start, count, true, parameters, headers).then(function(elements) {
					for (var i = elements.length - 1; i >= 0; i--) {
						self._addToCache(path, elements[i]);
						self._tryAddToRange(path, elements[i]);
					}
					return self._provideFromCache(path, listId, start, count, reverse);
				});
			} else {
				return Promise.resolve(self._provideFromCache(path, listId, start, count, reverse));
			}			
		} else {
			return Promise.resolve(self._provideFromCache(path, listId, start, count, reverse));
		}
	}
};

/**
 * Provides the elements from the cache.
 * @param {string} path The path including prefix, app name and type name.
 * @param {string} listId The id of the list that contains the elements.
 * @param {string} start The id from where to start to get elements.
 * @param {number} count The maximum number of elements to load.
 * @param {boolean} reverse If true, the elements are loaded from the start backwards in the list, forwards otherwise.
 */
tutao.rest.EntityRestCache.prototype._provideFromCache = function(path, listId, start, count, reverse) {
	var range = this._db[path][listId]['allRange'];
	var ids = undefined;
	if (reverse) {
		for (var i = range.length - 1; i >= 0; i--) {
			if (tutao.rest.EntityRestInterface.firstBiggerThanSecond(start, range[i])) {
				break;
			}
		}
		if (i >= 0) {
			var startIndex = i + 1 - count;
			if (count < 0) {
				count = 0;
			}
			ids = range.slice(startIndex, i + 1);
			ids.reverse();
		} else {
			ids = [];
		}
	} else {
		for (var i = 0; i < range.length; i++) {
			if (tutao.rest.EntityRestInterface.firstBiggerThanSecond(range[i], start)) {
				break;
			}
		}
		ids = range.slice(i, i + count);
	}
	var result = [];
	for (var a = 0; a < ids.length; a++) {
		result.push(this._db[path][listId][ids[a]]);
	}
	return result;
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.deleteElement = function(path, id, listId, parameters, headers) {
	var self = this;
	return this._target.deleteElement(path, id, listId, parameters, headers).then(function(data) {
        if (!listId) {
            listId = "0";
        }
        if (!self._db[path] || !self._db[path][listId]) {
            // this may happen when the elements where not yet cached, but the id was
            // taken from another loaded element. This is not an error.
            return data;
        }
        if (self._db[path][listId][id]) {
            delete self._db[path][listId][id];
        }
        if (self._db[path][listId]['allRange']) {
            // if the id exists in the range, then delete it
            tutao.util.ArrayUtils.remove(self._db[path][listId]['allRange'], id);
        }
		return data;
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.deleteService = function(path, element, parameters, headers, returnType) {
    return this._target.deleteService(path, element, parameters, headers, returnType);
};
