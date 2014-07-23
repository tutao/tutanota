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
//              entities: {
//				    'element1Id': 'element1',
//				    'element2Id': 'element2'
//			    	// and so on
//              }
//			}
//		},
//		'path': { 		// list element type
//			'listId': {
//				allRange: ['listElement1Id', 'listElement2Id'],
//              lowerRangeId: listElement1Id,
//              upperRangeId: GENERATED_MAX_ID,
//              entities: {
//				    'listElement1Id': 'listElement1',
//				    'listElement2Id': 'listElement2',
//    				// and so on
//              }
//			}
//		}
//	};

	/**
	 * requests are forwarded to this entity rest instance
	 */
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
tutao.rest.EntityRestCache.prototype.getElement = function(type, path, id, listId, parameters, headers, callback) {
	var self = this;
	var cacheListId = (listId) ? listId : "0";
	var versionRequest = (parameters && parameters.version) ? true : false;
	if (versionRequest || !this._db[path] || !this._db[path][cacheListId] || !this._db[path][cacheListId]['entities'][id] || tutao.util.ArrayUtils.contains(this._ignoredPaths, path)) {
		// the element is not in the cache, so get it from target
		this._target.getElement(type, path, id, listId, parameters, headers, function(element, exception) {
			if (exception) {
				callback(null, exception);
				return;
			}
			// cache the received element
			if (!versionRequest) {
				self._addToCache(path, element);
			}
			callback(element);
		});
	} else {
		callback(this._db[path][cacheListId]['entities'][id]);
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
	var elements = [];
	var fromDbIds = [];
	var cacheListId = "0"; // currently only for ETs
	for ( var i = 0; i < ids.length; i++) {
		var id = ids[i];
		if (!this._db[path] || !this._db[path][cacheListId] || !this._db[path][cacheListId]['entities'][id]) {
			// the element is not in the cache, so get it from target
			fromDbIds.push(id);
		} else {
			// read from cache
			elements.push(this._db[path][cacheListId]['entities'][id]);
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
        var listId = tutao.rest.EntityRestInterface.getListId(element);
        var elementId = tutao.rest.EntityRestInterface.getElementId(element);
        var allRange = this._db[path][listId]['allRange'];

		if (allRange) {
            for(var i=0; i<allRange.length; i++){
                var rangeElement = allRange[i];
                if ( tutao.rest.EntityRestInterface.firstBiggerThanSecond(rangeElement, elementId)){
                    allRange.splice(i, 0, elementId);
                    return;
                }
                if ( rangeElement === elementId){
                    allRange.splice(i, 1, elementId);
                    return;
                }
            }
            allRange.push(elementId);
		}
	}
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.postElement = function(path, element, listId, parameters, headers, callback) {
	var self = this;
	this._target.postElement(path, element, listId, parameters, headers, function(returnEntity, exception) {
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
			if (self._db[path] && self._db[path][cacheListId] && self._db[path][cacheListId]['entities'][id]) {
				// this should not happen
				console.log("cache out of sync for post: " + path);
			}
			self._addToCache(path, element);
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
	var cacheListId = tutao.rest.EntityRestInterface.getListId(element);
	var id = tutao.rest.EntityRestInterface.getElementId(element);
	this._getListData(path, cacheListId)['entities'][id] = element;
};


/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.putElement = function(path, element, parameters, headers, callback) {
	var self = this;
	this._target.putElement(path, element, parameters, headers, function(exception) {
		if (!exception) {
            var cacheListId = tutao.rest.EntityRestInterface.getListId(element);
            var id = tutao.rest.EntityRestInterface.getElementId(element);
			if (!self._db[path] || !self._db[path][cacheListId] || !self._db[path][cacheListId]['entities'][id]) {
				// this should not happen. it means that the target and this cache are out of sync.
				// put on the target worked fine, so the element was existing on the target.
				// it must habe been received from the target or posted first, otherwise it would not have been possible to put it.
				// we somehow must have missed receiving the element and putting it into the cache.
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
tutao.rest.EntityRestCache.prototype.putService = function(path, element, parameters, headers, returnType, callback) {
    this._target.putService(path, element, parameters, headers, returnType, callback);
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
    var listData = this._getListData(path, listId);

	if (path.indexOf("/rest/monitor/") != -1 || !type.GENERATED_ID) { // customIds shall not be cached because new instances might be inserted into already retrieved ranges
		this._target.getElementRange(type, path, listId, start, count, reverse, parameters, headers, function(elements, exception) {
			if (exception) {
				callback(null, exception);
				return;
			}
			callback(elements);
		});
	} else if (!listData['allRange']) {
		// there was no range loaded up to now. we can not load the range earlier than now (or in getElement) because
		// we need the type argument to create the elements. Any posts that my have come earlier still need to go into the
		// cache because the target does not return them if it is a dummy. So add all elements to the range that are
		// already in the cache
		// load all elements (i.e. up to 1000000)
		this._target.getElementRange(type, path, listId, start, count, reverse, parameters, headers, function(elements, exception) {
			if (exception) {
				callback(null, exception);
				return;
			}
            listData.allRange = [];
            listData.lowerRangeId = start;
            listData.upperRangeId = start;
            self._handleElementRangeResult( path, listId, start, count, reverse, elements, callback);
		});
	} else if (this._isStartInRange(path, listId, start)){ // check if the requested start element is located in range
       // count the numbers of elements that are already in allRange to determine the number of elements to read
        this._getNumberOfElementsToRead( path, listId, start, count, reverse, function (values, exception) {
            if (exception) {
               callback(null, exception);
               return;
            }
            var newStart = values[0];
            var newCount = values[1];
            if ( newCount > 0 ){
                self._target.getElementRange(type, path, listId, newStart, newCount, reverse, parameters, headers, function(elements, exception) {
                if (exception) {
                    callback(null, exception);
                    return;
                }
                self._handleElementRangeResult(path, listId, start, count, reverse, elements, callback);
            });
            }else{
                // all elements are located in cache.
                callback(self._provideFromCache(path, listId, start, count, reverse));
            }
       });
    } else {
        var msg = "invalid range request. start:" + start + " count: " + count + " reverse:" + reverse;
        callback( null, new tutao.entity.InvalidDataException(msg) );
	}
};


tutao.rest.EntityRestCache.prototype._handleElementRangeResult = function( path, listId, start, count, reverse, elements, callback) {
    var listData = this._getListData(path, listId);
    var elementsToAdd = elements;

    // Ensure that elements are cached in ascending (not reverse) order
    if (reverse){
        elementsToAdd = elements.reverse();
        // After reversing the list the first element in the list is the lower range limit
        if ( elements.length > 0 ){
            listData.lowerRangeId = elements[0].__id[1];
        }
    } else{
        // Last element in the list is the upper range limit
        if (elements.length > 0 ){
            listData.upperRangeId = elements[elements.length -1].__id[1];
        }
    }

    for (var i = 0; i < elementsToAdd.length; i++) {
        // add the elements to cache
        this._addToCache(path, elementsToAdd[i]);
        // add the elements to the range
        this._tryAddToRange(path, elementsToAdd[i]);
    }
    callback(this._provideFromCache(path, listId, start, count, reverse));
};




tutao.rest.EntityRestCache.prototype._isStartInRange = function(path, listId, start) {
    var listCache = tutao.locator.entityRestClient._db[path][listId];
    if ( tutao.util.ArrayUtils.contains( listCache["allRange"], start) ){
        return true;
    }
    return listCache["lowerRangeId"] == start || listCache["upperRangeId"] == start;
};



/**
 * Calculates the new start value for the getElementRange request and the number of elements to read in
 * order to read no duplicate values.
 * @param {string} path The path including prefix, app name and type name.
 * @param {string} listId The id of the list that contains the elements.
 * @param {string} start The id from where to start to get elements.
 * @param {number} count The maximum number of elements to load.
 * @param {boolean} reverse If true, the elements are loaded from the start backwards in the list, forwards otherwise.
 * @param {function(?Array.<Object>, tutao.entity.InvalidDataException=)} callback Called when finished first element in the array holds the start value second value the new count value.
 */
tutao.rest.EntityRestCache.prototype._getNumberOfElementsToRead = function(path, listId, start, count, reverse, callback) {
    var listCache = tutao.locator.entityRestClient._db[path][listId];
    var allRangeList = listCache['allRange'];
    var elementsToRead = count;
    var startElement = start;

    var indexOfStart = allRangeList.indexOf(start);
    if ( allRangeList.length == 0){ // Element range is empty read all elements
        elementsToRead = count;
    } else if ( indexOfStart != -1 ){ // Start element is located in allRange read only elements that are not in allRange.
        if (reverse ){
            elementsToRead = count - indexOfStart;
            startElement = allRangeList[0]; // use the lowest id in allRange as start element
        } else {
            elementsToRead = count - (allRangeList.length -1 - indexOfStart);
            startElement = allRangeList[allRangeList.length-1]; // use the  highest id in allRange as start element
        }
    } else if (listCache["lowerRangeId"] == start) { // Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MIN_ID
        if ( !reverse ){ // if not reverse read only elements that are not in allRange
            startElement = allRangeList[allRangeList.length-1]; // use the  highest id in allRange as start element
            elementsToRead = count - allRangeList.length
        }
        // if reverse read all elements
    } else if (listCache["upperRangeId"] == start) { // Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MAX_ID
        if ( reverse ){ // if not reverse read only elements that are not in allRange
            startElement = allRangeList[0]; // use the  highest id in allRange as start element
            elementsToRead = count - allRangeList.length
        }
        // if not reverse read all elements
    } else {
        // not allowed.
        var msg = "invalid range request. start:" + start + " count: " + count + " reverse:" + reverse;
        callback( null, new tutao.entity.InvalidDataException(msg) );

    }
    callback([startElement, elementsToRead])
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
            if ( startIndex < 0){ // start index may be negative if more elements have been requested than available when getting elements reverse.
                startIndex = 0;
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
		result.push(this._db[path][listId]['entities'][ids[a]]);
	}
	return result;
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.deleteElement = function(path, id, listId, parameters, headers, callback) {
	var self = this;
	this._target.deleteElement(path, id, listId, parameters, headers, function(data, exception) {
		if (!exception) {
			if (!listId) {
				listId = "0";
			}
			if (!self._db[path] || !self._db[path][listId]) {
				// this may happen when the elements where not yet cached, but the id was
				// taken from another loaded element. This is not an error.
				callback(data);
				return;
			}
            if (self._db[path][listId]['entities'][id]) {
                delete self._db[path][listId]['entities'][id];
            }
            if (self._db[path][listId]['allRange']) {
                // if the id exists in the range, then delete it
                tutao.util.ArrayUtils.remove(self._db[path][listId]['allRange'], id);
            }
		}
		callback(data, exception);
	});
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.deleteService = function(path, element, parameters, headers, returnType, callback) {
    this._target.deleteService(path, element, parameters, headers, returnType, callback);
};

tutao.rest.EntityRestCache.prototype._getListData = function(path, listId){
    this._db[path] = this._db[path] || {};
    this._db[path][listId] = this._db[path][listId] || {};
    this._db[path][listId]['entities'] = this._db[path][listId]['entities'] || {};
    return this._db[path][listId];
};

