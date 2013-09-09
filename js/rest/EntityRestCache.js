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
	this._target = undefined;
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
tutao.rest.EntityRestCache.prototype.getElement = function(type, path, id, listId, parameters, headers, callback) {
	var self = this;
	var cacheListId = (listId) ? listId : "0";
	var versionRequest = (parameters && parameters.version) ? true : false;
	if (versionRequest || !this._db[path] || !this._db[path][cacheListId] || !this._db[path][cacheListId][id]) {
		// the element is not in the cache, so get it from target
		this._target.getElement(type, path, id, listId, parameters, headers, function(element, exception) {
			if (exception) {
				callback(null, exception);
				return;
			}
			// cache the received element
			if (!versionRequest) {
				self._addToCache(path, element);
				self._tryAddToRange(path, element);
			}
			callback(element);		
		});
	} else {
		callback(this._db[path][cacheListId][id]);
	}
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.getService = function(type, path, data, parameters, headers, callback) {
	return this._target.getService(type, path, data, parameters, headers, callback);
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.getElements = function(type, path, ids, parameters, headers, callback) {
	// TODO does currently not work for listElements (add listId to signature)
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
		this._target.getElements(type, path, fromDbIds, parameters, headers, function(serverElements, exception) {
			if (exception) {
				callback(null, exception);
				return;
			}
			for ( var i = 0; i < serverElements.length; i++) {
				// cache the received elements
				self._addToCache(path, serverElements[i]);
				self._tryAddToRange(path, serverElements[i]);
				
				// merge with cached elements
				elements.push(serverElements[i]);
			}			
			callback(elements);		
		});
	} else {
		callback(elements);
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
		if (this._db[path][listId].allRange) {
			if (this._db[path][listId].allRange.length == 0 ||
			tutao.rest.EntityRestInterface.firstBiggerThanSecond(id, tutao.util.ArrayUtils.last(this._db[path][listId].allRange))) {
				this._db[path][listId].allRange.push(id);
			}
		}
	}
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.postElement = function(path, element, listId, parameters, headers, returnType, callback) {
	var self = this;
	this._target.postElement(path, element, listId, parameters, headers, returnType, function(returnEntity, exception) {
		if (!exception) {
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
				//TODO implement
				console.log("cache out of sync for post: " + path);
			}
			
			self._addToCache(path, element);
			self._tryAddToRange(path, element);
		}
		callback(returnEntity, exception);
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.postService = function(path, element, parameters, headers, returnType, callback) {
	this._target.postService(path, element, parameters, headers, returnType, callback);
};

/**
 * Posts the given element into the cache.
 * @param {string} path The name of the type of the given element.
 * @param {Object} element The element to add.
 * @protected
 */
tutao.rest.EntityRestCache.prototype._addToCache = function(path, element) {
	var cacheListId = undefined;
	var id = undefined;
	if (element.__id instanceof Array) {
		cacheListId = element.__id[0];
		id = element.__id[1];
	} else {
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
tutao.rest.EntityRestCache.prototype.putElement = function(path, element, parameters, headers, callback) {
	var self = this;
	this._target.putElement(path, element, parameters, headers, function(exception) {
		if (!exception) {
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
				//TODO implement
				console.log("cache out of sync for " + path);
			}
			
			self._addToCache(path, element);
		}
		callback(exception);
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.postList = function(path, parameters, headers, callback) {
	this._target.postList(path, parameters, headers, callback);
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.getElementRange = function(type, path, listId, start, count, reverse, parameters, headers, callback) {
	var self = this;
	this._db[path] = this._db[path] || {};
	this._db[path][listId] = this._db[path][listId] || {};

	if (path.indexOf("/rest/monitor/") != -1) {
		this._target.getElementRange(type, path, listId, start, count, reverse, parameters, headers, function(elements, exception) {
			if (exception) {
				callback(null, exception);
				return;
			}
			callback(elements);
		});
	} else if (!this._db[path][listId].allRange) {
		// there was no range loaded up to now. we can not load the range earlier than now (or in getElement) because
		// we need the type argument to create the elements. Any posts that my have come earlier still need to go into the
		// cache because the target does not return them if it is a dummy. So add all elements to the range that are
		// already in the cache
		// load all elements (i.e. up to 1000000)
		// TODO only up to 1000 allowed. how to load all?
		this._target.getElementRange(type, path, listId, "", tutao.rest.EntityRestInterface.MAX_RANGE_COUNT, false, parameters, headers, function(elements, exception) {
			if (exception) {
				callback(null, exception);
				return;
			}
			self._db[path][listId].allRange = [];
			for (var i = 0; i < elements.length; i++) {
				self._addToCache(path, elements[i]);
				self._db[path][listId].allRange.push(elements[i].__id[1]);
			}
			// add all elements to the range that were posted already. they need to be added inascending order
			var elementsToAdd = [];
			for (var member in self._db[path][listId]) {
				if (member != 'allRange') {
					elementsToAdd.push(self._db[path][listId][member]);
				}
			}
			// sort the array to make it ascending
			elementsToAdd.sort(function(a, b) {
				return (tutao.rest.EntityRestInterface.firstBiggerThanSecond(a.getId()[1], b.getId()[1])) ? 1 : -1;
			});
			// add the elements to the range
			for (var b = 0; b < elementsToAdd.length; b++) {
				self._tryAddToRange(path, elementsToAdd[b]);
			}
			callback(self._provideFromCache(path, listId, start, count, reverse));
		});
	} else {
		// only request a range from target if the start id is not bigger than the last id in allRange
		if (this._db[path][listId].allRange.length == 0 ||
		!tutao.rest.EntityRestInterface.firstBiggerThanSecond(tutao.util.ArrayUtils.last(this._db[path][listId].allRange), start)) {
			this._target.getElementRange(type, path, listId, start, count, false, parameters, headers, function(elements, exception) {
				if (exception) {
					callback(null, exception);
					return;
				}
				for (var i = 0; i < elements.length; i++) {
					self._addToCache(path, elements[i]);
					self._db[path][listId].allRange.push(elements[i].__id[1]);
				}
				callback(self._provideFromCache(path, listId, start, count, reverse));
			});
		} else {
			callback(self._provideFromCache(path, listId, start, count, reverse));
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
	var range = this._db[path][listId].allRange;
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
tutao.rest.EntityRestCache.prototype.deleteElements = function(path, ids, listId, parameters, headers, callback) {
	var self = this;
	this._target.deleteElements(path, ids, listId, parameters, headers, function(exception) {
		if (!exception) {
			if (!listId) {
				listId = "0";
			}
			if (!self._db[path] || !self._db[path][listId]) {
				// this may happen when the elements where not yet cached, but the ids where
				// taken from another loaded element. This is not an error.
				callback();
				return;
			}
			for (var i = 0; i < ids.length; i++) {
				if (self._db[path][listId][ids[i]]) {
					delete self._db[path][listId][ids[i]];
				}
				if (self._db[path][listId].allRange) {
					// if the id exists in the range, then delete it
					tutao.util.ArrayUtils.remove(self._db[path][listId].allRange, ids[i]);
				}
			}
		}
		callback(exception);
	});
};
