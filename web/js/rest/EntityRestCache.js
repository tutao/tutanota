"use strict";

tutao.provide('tutao.rest.EntityRestCache');

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
 * @implements {tutao.event.EventBusListener}
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
    /* @type {tutao.rest.EntityRestInterface} */
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
    if (tutao.locator.eventBus) { // there may be no eventBus instance if Tutanota is not supported
        tutao.locator.eventBus.addListener(this);
    }
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.getElement = function(type, path, id, listId, parameters, headers) {
	var self = this;
	var cacheListId = (listId) ? listId : "0";
	var versionRequest = (parameters && parameters.version) ? true : false;
	if (versionRequest || !this._db[path] || !this._db[path][cacheListId] || !this._db[path][cacheListId]['entities'][id] || tutao.util.ArrayUtils.contains(this._ignoredPaths, path)) {
		// the element is not in the cache, so get it from target
		return this._getElementFromTarget(type, path, id, listId, parameters, headers);
	} else {
		return Promise.resolve(self._getElementFromCache(path, id, cacheListId));
	}
};


tutao.rest.EntityRestCache.prototype._getElementFromTarget = function(type, path, id, listId, parameters, headers) {
    var self = this;
    var versionRequest = (parameters && parameters.version) ? true : false;
    return this._target.getElement(type, path, id, listId, parameters, headers).then(function(element) {
        // cache the received element
        if (!versionRequest) {
            self._addToCache(path, element);
            self._tryAddToRange(path, element);
        }
        return element;
    });
};



tutao.rest.EntityRestCache.prototype._getElementFromCache = function(path, id, listId) {
    var cacheListId = (listId) ? listId : "0";
    if (this._db[path] && this._db[path][cacheListId] && this._db[path][cacheListId]['entities'][id] ) {
        return this._db[path][cacheListId]['entities'][id];
    } else {
        return null;
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
        var listId = tutao.rest.EntityRestCache.getListId(element);
        var elementId = tutao.rest.EntityRestInterface.getElementId(element);
        var allRange = this._db[path][listId]['allRange'];

		if (allRange) {
            // If element id does not fit into range do not add it.
            if( tutao.rest.EntityRestInterface.firstBiggerThanSecond (elementId, this._db[path][listId].upperRangeId) || tutao.rest.EntityRestInterface.firstBiggerThanSecond (this._db[path][listId].lowerRangeId, elementId)){
                return;
            }

            for(var i=0; i<allRange.length; i++){
                var rangeElement = allRange[i];
                if (tutao.rest.EntityRestInterface.firstBiggerThanSecond(rangeElement, elementId)){
                    allRange.splice(i, 0, elementId);
                    return;
                }
                if (rangeElement === elementId){
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
		if (self._db[path] && self._db[path][cacheListId] && self._db[path][cacheListId]['entities'][id]) {
			// this should not happen
			console.log("cache out of sync for post: " + path);
		}
		self._addToCache(path, element);
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
	var cacheListId = tutao.rest.EntityRestCache.getListId(element);
	var id = tutao.rest.EntityRestInterface.getElementId(element);
	// do not overwrite existing elements to avoid multiple instances of the same element, update the content instead
    if (this._getListData(path, cacheListId)['entities'][id]) {
        this._getListData(path, cacheListId)['entities'][id].updateData(element.toJsonData());
        this._getListData(path, cacheListId)['entities'][id]._entityHelper.notifyObservers();
    } else {
        this._getListData(path, cacheListId)['entities'][id] = element;
    }
};


/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.putElement = function(path, element, parameters, headers) {
	var self = this;
	return this._target.putElement(path, element, parameters, headers).then(function() {
        var cacheListId = tutao.rest.EntityRestCache.getListId(element);
        var id = tutao.rest.EntityRestInterface.getElementId(element);
		if (!self._db[path] || !self._db[path][cacheListId] || !self._db[path][cacheListId]['entities'][id]) {
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
    var listData = this._getListData(path, listId);

	if (path.indexOf("/rest/monitor/") != -1 || !type.GENERATED_ID) { // customIds shall not be cached because new instances might be inserted into already retrieved ranges
		return this._target.getElementRange(type, path, listId, start, count, reverse, parameters, headers);
	} else if (!listData['allRange'] || (start == tutao.rest.EntityRestInterface.GENERATED_MAX_ID && reverse && listData.upperRangeId != tutao.rest.EntityRestInterface.GENERATED_MAX_ID)) {
        // if our upper range id is not MAX_ID and we now read the range starting with MAX_ID we just replace the complete existing range with the new one because we do not want to handle multiple ranges
		return this._target.getElementRange(type, path, listId, start, count, reverse, parameters, headers).then(function(elements) {
            if (elements.length > 0) {
                listData.allRange = [];
                listData.lowerRangeId = start;
                listData.upperRangeId = start;
                return self._handleElementRangeResult(path, listId, start, count, reverse, elements, count);
            }
            return [];
		});
	} else if (this._isStartInRange(path, listId, start)){ // check if the requested start element is located in range
       // count the numbers of elements that are already in allRange to determine the number of elements to read
        var result = this._getNumberOfElementsToRead(path, listId, start, count, reverse);
        if ( result.newCount > 0 ){
            return self._target.getElementRange(type, path, listId, result.newStart, result.newCount, reverse, parameters, headers).then(function(elements) {
                return self._handleElementRangeResult(path, listId, start, count, reverse, elements, result.newCount);
            });
        } else {
            // all elements are located in cache.
            return Promise.resolve(self._provideFromCache(path, listId, start, count, reverse));
        }
    } else {
        var msg = "invalid range request. start:" + start + " count: " + count + " reverse:" + reverse;
        return Promise.reject(new tutao.InvalidDataError(msg));
	}
};


tutao.rest.EntityRestCache.prototype._handleElementRangeResult = function( path, listId, start, count, reverse, elements, targetCount) {
    var listData = this._getListData(path, listId);
    var elementsToAdd = elements;
	if (elements.length > 0) {
		// Ensure that elements are cached in ascending (not reverse) order
		if (reverse) {
            elementsToAdd = elements.reverse();
            if (elements.length < targetCount) {
                listData.lowerRangeId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
            } else {
                // After reversing the list the first element in the list is the lower range limit
                listData.lowerRangeId = elements[0].__id[1];
            }
		} else {
		    // Last element in the list is the upper range limit
            if (elements.length < targetCount) {
                // all elements have been loaded, so the upper range must be set to MAX_ID
                listData.upperRangeId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
            } else {
	            listData.upperRangeId = elements[elements.length -1].__id[1];
            }
		}

		for (var i = 0; i < elementsToAdd.length; i++) {
		    // add the elements to cache
		    this._addToCache(path, elementsToAdd[i]);
		    // add the elements to the range
		    this._tryAddToRange(path, elementsToAdd[i]);
		}
	} else {
        // all elements have been loaded, so the range must be set to MAX_ID / MIN_ID
        if (reverse) {
            listData.lowerRangeId = tutao.rest.EntityRestInterface.GENERATED_MIN_ID;
        } else {
            listData.upperRangeId = tutao.rest.EntityRestInterface.GENERATED_MAX_ID;
        }
    }
	return this._provideFromCache(path, listId, start, count, reverse);
};




tutao.rest.EntityRestCache.prototype._isStartInRange = function(path, listId, start) {
    var listCache = tutao.locator.entityRestClient._db[path][listId];
    var allRangeList = listCache['allRange'];

    var indexOfStart = allRangeList.indexOf(start);
    if ( allRangeList.length == 0){ // Element range is empty read all elements
        return true;
    } else if ( indexOfStart != -1 ) { // Start element is located in allRange read only elements that are not in allRange.
        return true;
    } else if (listCache["lowerRangeId"] == start || (tutao.rest.EntityRestInterface.firstBiggerThanSecond(start, listCache["lowerRangeId"]) && (tutao.rest.EntityRestInterface.firstBiggerThanSecond(allRangeList[0], start)))) {
        return true;
    } else if (listCache["upperRangeId"] == start || (tutao.rest.EntityRestInterface.firstBiggerThanSecond(start, allRangeList[allRangeList.length - 1]) && (tutao.rest.EntityRestInterface.firstBiggerThanSecond(listCache["upperRangeId"], start)))) {
        return true;
    } else {
        return false;
    }
};



/**
 * Calculates the new start value for the getElementRange request and the number of elements to read in
 * order to read no duplicate values.
 * @param {string} path The path including prefix, app name and type name.
 * @param {string} listId The id of the list that contains the elements.
 * @param {string} start The id from where to start to get elements.
 * @param {number} count The maximum number of elements to load.
 * @param {boolean} reverse If true, the elements are loaded from the start backwards in the list, forwards otherwise.
 * @return {{newStart:string, newCount:number}} returns the new start and count value.
 */
tutao.rest.EntityRestCache.prototype._getNumberOfElementsToRead = function(path, listId, start, count, reverse) {
    var listCache = tutao.locator.entityRestClient._db[path][listId];
    var allRangeList = listCache['allRange'];
    var elementsToRead = count;
    var startElementId = start;

    var indexOfStart = allRangeList.indexOf(start);
    if ( allRangeList.length == 0){ // Element range is empty read all elements
        elementsToRead = count;
    } else if ( indexOfStart != -1 ){ // Start element is located in allRange read only elements that are not in allRange.
        if (reverse ){
            elementsToRead = count - indexOfStart;
            startElementId = allRangeList[0]; // use the lowest id in allRange as start element
        } else {
            elementsToRead = count - (allRangeList.length -1 - indexOfStart);
            startElementId = allRangeList[allRangeList.length-1]; // use the  highest id in allRange as start element
        }
    } else if (listCache["lowerRangeId"] == start || (tutao.rest.EntityRestInterface.firstBiggerThanSecond(start, listCache["lowerRangeId"]) && (tutao.rest.EntityRestInterface.firstBiggerThanSecond(allRangeList[0], start)))) { // Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MIN_ID, or start is between lower range id and lowest element in range
        if ( !reverse ){ // if not reverse read only elements that are not in allRange
            startElementId = allRangeList[allRangeList.length-1]; // use the  highest id in allRange as start element
            elementsToRead = count - allRangeList.length
        }
        // if reverse read all elements
    } else if (listCache["upperRangeId"] == start || (tutao.rest.EntityRestInterface.firstBiggerThanSecond(start, allRangeList[allRangeList.length - 1]) && (tutao.rest.EntityRestInterface.firstBiggerThanSecond(listCache["upperRangeId"], start)))) { // Start element is not in allRange but has been used has start element for a range request, eg. EntityRestInterface.GENERATED_MAX_ID, or start is between upper range id and highest element in range
        if ( reverse ){ // if not reverse read only elements that are not in allRange
            startElementId = allRangeList[0]; // use the  highest id in allRange as start element
            elementsToRead = count - allRangeList.length
        }
        // if not reverse read all elements
    } 
    return { newStart:startElementId, newCount:elementsToRead };
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
            if (startIndex < 0){ // start index may be negative if more elements have been requested than available when getting elements reverse.
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
tutao.rest.EntityRestCache.prototype.deleteElement = function(path, id, listId, parameters, headers) {
	var self = this;
	return this._target.deleteElement(path, id, listId, parameters, headers).then(function(data) {
        self._deleteFromCache(path, id, listId);
		return data;
	});
};

tutao.rest.EntityRestCache.prototype._deleteFromCache = function(path, id, listId) {
    if (!listId) {
        listId = "0";
    }
    if (!this._db[path] || !this._db[path][listId]) {
        // this may happen when the elements where not yet cached, but the id was
        // taken from another loaded element. Or the element was deleted with a normal rest call. This is not an error.
        return;
    }
    if (this._db[path][listId]['entities'][id]) {
        delete this._db[path][listId]['entities'][id];
    }
    if (this._db[path][listId]['allRange']) {
        // if the id exists in the range, then delete it
        tutao.util.ArrayUtils.remove(this._db[path][listId]['allRange'], id);
    }
};

/**
 * @inheritDoc
 */
tutao.rest.EntityRestCache.prototype.deleteService = function(path, element, parameters, headers, returnType) {
    return this._target.deleteService(path, element, parameters, headers, returnType);
};

tutao.rest.EntityRestCache.prototype._getListData = function(path, listId){
    this._db[path] = this._db[path] || {};
    this._db[path][listId] = this._db[path][listId] || {};
    this._db[path][listId]['entities'] = this._db[path][listId]['entities'] || {};
    return this._db[path][listId];
};


/**
 * Returns the list id of the specified element if it is a LET otherwise "0" returns.
 * @param {Object} element The element
 * @returns {string} The list id
 */
tutao.rest.EntityRestCache.getListId = function(element) {
    if (element.__id instanceof Array) {
        return element.__id[0];
    } else {
        return "0";
    }
};

/**
 * Notifies the listener that new data has been received.
 * @param {tutao.entity.sys.EntityUpdate} data The update notification.
 */
tutao.rest.EntityRestCache.prototype.notifyNewDataReceived = function(data) {
    var path = "/rest/" + data.getApplication().toLowerCase() + "/" + data.getType().toLocaleLowerCase();
    if (data.getOperation() === tutao.entity.tutanota.TutanotaConstants.OPERATION_TYPE_DELETE) {
        this._deleteFromCache(path, data.getInstanceId(), data.getInstanceListId());
    }else if (data.getOperation() === tutao.entity.tutanota.TutanotaConstants.OPERATION_TYPE_UPDATE) {
        var element = this._getElementFromCache(path,data.getInstanceId(), data.getInstanceListId());
        if (element){
            var elementTypeModelVersion = tutao.entity[data.getApplication().toLowerCase()][data.getType()].MODEL_VERSION;
            this._getElementFromTarget(element.constructor, path, data.getInstanceId(), data.getInstanceListId(), {"v": elementTypeModelVersion}, tutao.entity.EntityHelper.createAuthHeaders());
        }
    }
};


/**
 * Notifies a listener about the reconnect event,
 */
tutao.rest.EntityRestCache.prototype.notifyReconnected = function() {
    // nothing to do
};
