"use strict";

tutao.provide('tutao.rest.EntityRestInterface');

/**
 * The EntityRestInterface provides a convenient interface for invoking server side REST services.
 * @interface
 */
tutao.rest.EntityRestInterface = function() {};

/**
 * the maximum ID for elements stored on the server (number with the length of 10 bytes) => 2^80 - 1
 * @const
 */
tutao.rest.EntityRestInterface.GENERATED_MAX_ID = "Uzzzzzzzzzzz";
/**
 * The minimum ID for elements with generated id stored on the server
 * @const
 */
tutao.rest.EntityRestInterface.GENERATED_MIN_ID = "------------";

/**
 * The minimum ID for elements with custom id stored on the server
 * @const
 */
tutao.rest.EntityRestInterface.CUSTOM_MIN_ID = "";


/**
 * Gets an element from the server.
 * @param {function(new:Object, Object)} type Type of the elements to load, i.e. the constructor.
 * @param {string} path The path including prefix, app name and type name.
 * @param {string} id The id of the element to get.
 * @param {?string} listId The list id of the element. May be null for ETs.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @return {Promise.<Object>} Resolves to loaded element when finished, rejected if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.getElement = function(type, path, id, listId, parameters, headers) { };

/**
 * Executes a get request to a service.
 * @param {Object} type Type of the data to load, i.e. the constructor.
 * @param {string} path The path including prefix, app name and type name.
 * @param {?Object} data The entity to send with the request (DataTransferType).
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @return {Promise.<Object>} Resolves to loaded element when finished, rejected if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.getService = function(type, path, data, parameters, headers) { };

/**
 * Gets multiple elements from the server. If any of the elements are not found, they are not returned, but no
 * error is thrown.
 * @param {function(new:Object, Object)} type Type of the elements to load, i.e. the constructor.
 * @param {string} path The path including prefix, app name and type name.
 * @param {Array.<string>|Array.<Array.<string>>} ids The id of the elements to get.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @return {Promise.<Array.<Object>>} Resolves to the list of elements when finished, rejected if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.getElements = function(type, path, ids, parameters, headers) { };

/**
 * Stores a new element on the server.
 * @param {string} path The path including prefix, app name and type name.
 * @param {Object} element the object to store.
 * @param {?string} listId The id of the list that shall contain the element.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @return {Promise.<tutao.entity.base.PersistenceResourcePostReturn>} Resolves to return entity from the server when finished, rejected if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.postElement = function(path, element, listId, parameters, headers) { };

/**
 * Posts to a service. The difference to postElement is that the given element is not regarded as entity.
 * @param {string} path The path including prefix, app name and type name.
 * @param {Object} element the object to store.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {?Object} returnType Type of the data that is returned.
 * @return {Promise.<Object>} Resolves to response entity from the server when finished, rejected if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.postService = function(path, element, parameters, headers, returnType) { };

/**
 * Updates an element on the server.
 * @param {string} path The path including prefix, app name and type name.
 * @param {Object} element the object to store.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @return {Promise.<>} Resolved when finished, rejected if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.putElement = function(path, element, parameters, headers) { };

/**
 * TODO (timely) put service did not work: When accessing the inputstream on the server, a timeout occurs (no data can be read)
 * Puts to a service.
 * @param {string} path The path including prefix, app name and type name.
 * @param {Object} element the object to store.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {?Object} returnType Type of the data that is returned.
 * @return {Promise.<Object>} Resolves to response entity from the server when finished, rejected if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.putService = function(path, element, parameters, headers, returnType) { };

/**
 * Creates a new list on the server and provides its id.
 * @param {string} path The path including prefix, app name and type name.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @return {Promise.<string>} Resolves to the id of the newly created list when finished, rejected if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.postList = function(path, parameters, headers) { };

/**
 * Provides a list of elements.
 * @param {function(new:Object, Object)} type The type of the elements (constructor).
 * @param {string} path The path including prefix, app name and type name.
 * @param {string} listId The id of the list that contains the elements.
 * @param {string} start The id from where to start to get elements.
 * @param {number} count The maximum number of elements to load.
 * @param {boolean} reverse If true, the elements are loaded from the start backwards in the list, forwards otherwise.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @return {Promise.<Array.<Object>>} Resolves to the the loaded elements when finished, rejected if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.getElementRange = function(type, path, listId, start, count, reverse, parameters, headers) { };

/**
 * Deletes elements by id.
 * @param {string} path The path including prefix, app name and type name.
 * @param {string} id The id.
 * @param {?string} listId An optional list id. Use it to pass the list id of LETs.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @return {Promise.<>} Resolved when finished, rejected if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.deleteElement = function(path, id, listId, parameters, headers) { };

/**
 * Invokes delete on a service. Just like postService besides that the used HTTP method is DELETE
 * @param {string} path The path including prefix, app name and type name.
 * @param {Object} element the object to transmit.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {?Object} returnType Type of the data that is returned.
 * @return {Promise.<Object>} Resolves to response entity from the server when finished, rejected if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.deleteService = function(path, element, parameters, headers, returnType) { };

/**
 * Tests if one id is bigger than another.
 * @param {string} firstId The id that is tested if it is bigger.
 * @param {string} secondId The id that is tested against.
 * @return {boolean} True if firstId is bigger than secondId, false otherwise.
 */
tutao.rest.EntityRestInterface.firstBiggerThanSecond = function(firstId, secondId) {
	// if the number of digits is bigger, then the id is bigger, otherwise we can use the lexicographical comparison
	if (firstId.length > secondId.length) {
		return true;
	} else if (secondId.length > firstId.length) {
		return false;
	} else {
		return firstId > secondId;
	}
};

/**
 * Converts a string to a custom id. Attention: the custom id must be intended to be derived from a string.
 * @param {string} string The string.
 */
tutao.rest.EntityRestInterface.stringToCustomId = function(string) {
	return tutao.util.EncodingConverter.base64ToBase64Url(tutao.util.EncodingConverter.uint8ArrayToBase64(tutao.util.EncodingConverter.stringToUtf8Uint8Array(string)));
};

/**
 * Converts a custom id to a string. Attention: the custom id must be intended to be derived from a string.
 * @param {string} customId The custom id.
 */
tutao.rest.EntityRestInterface.customIdToString = function(customId) {
	return tutao.util.EncodingConverter.utf8Uint8ArrayToString(tutao.util.EncodingConverter.base64ToUint8Array(tutao.util.EncodingConverter.base64UrlToBase64(customId)));
};

/**
 * Returns the element id from the specified element
 * @param {object} element The element
 * @returns {string} The element id
 */
tutao.rest.EntityRestInterface.getElementId = function(element) {
    if (element.__id instanceof Array) {
        return element.__id[1];
    } else {
        return element.__id;
    }
};

/**
 * Checks if the given list element ids are equal.
 * @param {Array<string>} id1 An id.
 * @param {Array<string>} id2 Another id.
 * @return {boolean} True if the ids are the same.
 */
tutao.rest.EntityRestInterface.sameListElementIds = function(id1, id2) {
    return (id1[0] == id2[0] && id1[1] == id2[1]);
};

/**
 * Checks if one of the given elements has the given id.
 * @param {Array<string|Array<string>>} ids An array of ids (element type or list element type).
 * @param {string|Array<string>} id The id to look for.
 * @return {boolean} True if the id is contained, false otherwise.
 */
tutao.rest.EntityRestInterface.containsId = function(ids, id) {
    for (var i=0; i<ids.length; i++) {
        if (ids[i] instanceof Array && id instanceof Array) {
            if (tutao.rest.EntityRestInterface.sameListElementIds(ids[i], id)) {
                return true;
            }
        } else {
            if (ids[i] == id) {
                return true;
            }
        }
    }
    return false;
};

/**
 * Loads all elements of the given list.
 * @param {Object} type The constructor of the type to load.
 * @param listId The list id.
 * @param {string=} startId The id to start from. if not set, min id is used
 * @returns {Promise.<Array.<Object>>} The loaded entities in forward order.
 */
tutao.rest.EntityRestInterface.loadAll = function(type, listId, startId) {
    var resultList = [];
    return tutao.rest.EntityRestInterface._loadAll(type, listId, (startId) ? startId : tutao.rest.EntityRestInterface.GENERATED_MIN_ID, resultList).then(function() {
        return resultList;
    });
};

tutao.rest.EntityRestInterface._loadAll = function(type, listId, startId, resultList) {
    var SINGLE_CALL_COUNT = 100;
    return type.loadRange(listId, startId, SINGLE_CALL_COUNT, false).then(function(elements) {
        tutao.util.ArrayUtils.addAll(resultList, elements);
        if (elements.length == SINGLE_CALL_COUNT) {
            return tutao.rest.EntityRestInterface._loadAll(type, listId, tutao.rest.EntityRestInterface.getElementId(elements[elements.length - 1]), resultList);
        } else {
            return Promise.resolve();
        }
    });
};

/**
 * Loads all elements of the given list in reverse order.
 * @param {Object} type The constructor of the type to load.
 * @param listId The list id.
 * @param {string=} startId The id to start from. if not set, min id is used
 * @returns {Promise.<Array.<Object>>} The loaded entities in reverse order.
 */
tutao.rest.EntityRestInterface.loadAllReverse = function(type, listId, startId) {
    var resultList = [];
    return tutao.rest.EntityRestInterface._loadAllReverse(type, listId, (startId) ? startId : tutao.rest.EntityRestInterface.GENERATED_MAX_ID, resultList).then(function() {
        return resultList;
    });
};

tutao.rest.EntityRestInterface._loadAllReverse = function(type, listId, startId, resultList) {
    var SINGLE_CALL_COUNT = 100;
    return type.loadRange(listId, startId, SINGLE_CALL_COUNT, true).then(function(elements) {
        tutao.util.ArrayUtils.prependAll(resultList, elements);
        if (elements.length == SINGLE_CALL_COUNT) {
            return tutao.rest.EntityRestInterface._loadAllReverse(type, listId, tutao.rest.EntityRestInterface.getElementId(elements[elements.length - 1]), resultList);
        } else {
            return Promise.resolve();
        }
    });
};