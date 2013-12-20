"use strict";

goog.provide('tutao.rest.EntityRestInterface');
//TODO (before release) add putService or use only one function for both

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
 * The maximum allowed number of elements that can be requested via getElementRange() in list element entities
 * @const
 */
tutao.rest.EntityRestInterface.MAX_RANGE_COUNT = 1000;

/**
 * Gets an element from the server.
 * @param {function(new:Object, Object)} type Type of the elements to load, i.e. the constructor.
 * @param {string} path The path including prefix, app name and type name.
 * @param {string} id The id of the element to get.
 * @param {?string} listId The list id of the element. May be null for ETs.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {function(?Object, tutao.rest.EntityRestException=)} callback Called when finished with the loaded element or an exception.
 */
tutao.rest.EntityRestInterface.prototype.getElement = function(type, path, id, listId, parameters, headers, callback) { };

/**
 * Executes a get request to a service.
 * @param {Object} type Type of the data to load, i.e. the constructor.
 * @param {string} path The path including prefix, app name and type name.
 * @param {?Object} data The entity to send with the request (DataTransferType).
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {function(?Object, tutao.rest.EntityRestException=)} callback Called when finished with the loaded element or an exception.
 */
tutao.rest.EntityRestInterface.prototype.getService = function(type, path, data, parameters, headers, callback) { };

/**
 * Gets multiple elements from the server. If any of the elements are not found, they are not returned, but no
 * error is thrown.
 * @param {function(new:Object, Object)} type Type of the elements to load, i.e. the constructor.
 * @param {string} path The path including prefix, app name and type name.
 * @param {Array.<string>|Array.<Array.<string>>} ids The id of the elements to get.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {function(?Array.<Object>, tutao.rest.EntityRestException=)} callback Called when finished with the loaded elements or an exception.
 */
tutao.rest.EntityRestInterface.prototype.getElements = function(type, path, ids, parameters, headers, callback) { };

/**
 * Stores a new element on the server.
 * @param {string} path The path including prefix, app name and type name.
 * @param {Object} element the object to store.
 * @param {?string} listId The id of the list that shall contain the element.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {function(tutao.entity.base.PersistenceResourcePostReturn, tutao.rest.EntityRestException=)} callback Called with the return entity when finished, with an exception if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.postElement = function(path, element, listId, parameters, headers, callback) { };

/**
 * Posts to a service. The difference to postElement is that the given element is not regarded as entity.
 * @param {string} path The path including prefix, app name and type name.
 * @param {Object} element the object to store.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {?Object} returnType Type of the data that is returned.
 * @param {function(?Object, tutao.rest.EntityRestException=)} callback Provides the response entity from the server or an exception if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.postService = function(path, element, parameters, headers, returnType, callback) { };

/**
 * Updates an element on the server.
 * @param {string} path The path including prefix, app name and type name.
 * @param {Object} element the object to store.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {function(tutao.rest.EntityRestException=)} callback Called when finished, with an exception if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.putElement = function(path, element, parameters, headers, callback) { };

/**
 * Creates a new list on the server and provides its id.
 * @param {string} path The path including prefix, app name and type name.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {function(?string, tutao.rest.RestException=)} callback Provides the id of the newly created list or an exception if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.postList = function(path, parameters, headers, callback) { };

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
 * @param {function(?Array.<Object>, tutao.rest.RestException=)} callback Called when finished with the loaded elements or an exception.
 */
tutao.rest.EntityRestInterface.prototype.getElementRange = function(type, path, listId, start, count, reverse, parameters, headers, callback) { };

//TODO (before beta) delete a single element

/**
 * Deletes elements by id.
 * @param {string} path The path including prefix, app name and type name.
 * @param {string} id The id.
 * @param {?string} listId An optional list id. Use it to pass the list id of LETs.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {function(tutao.rest.EntityRestException=)} callback Called when finished, with an exception if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.deleteElement = function(path, id, listId, parameters, headers, callback) { };

/**
 * Invokes delete on a service. Just like postService besides that the used HTTP method is DELETE
 * @param {string} path The path including prefix, app name and type name.
 * @param {Object} element the object to transmit.
 * @param {?Object} parameters The parameters to send with this request.
 * @param {?Object.<string, string>} headers A map with header key/value pairs to send with the request.
 * @param {?Object} returnType Type of the data that is returned.
 * @param {function(?Object, tutao.rest.EntityRestException=)} callback Provides the response entity from the server or an exception if the rest call failed.
 */
tutao.rest.EntityRestInterface.prototype.deleteService = function(path, element, parameters, headers, returnType, callback) { };

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
	return tutao.util.EncodingConverter.base64ToBase64Url(tutao.util.EncodingConverter.hexToBase64(tutao.util.EncodingConverter.utf8ToHex(string)));
};

/**
 * Converts a custom id to a string. Attention: the custom id must be intended to be derived from a string.
 * @param {string} customId The custom id.
 */
tutao.rest.EntityRestInterface.customIdToString = function(customId) {
	return tutao.util.EncodingConverter.hexToUtf8(tutao.util.EncodingConverter.base64ToHex(tutao.util.EncodingConverter.base64UrlToBase64(customId)));
};
