"use strict";

tutao.provide('tutao.db.DbInterface');
/**
 * The interface to the DB
 * @interface
 */
tutao.db.DbInterface = function() {};

/**
 * A status code that indicates that the operation was successful.
 */
tutao.db.DbInterface.STATUS_SUCCESS = "success";

/**
 * A status code that indicates that the operation did not succeed because there was no memory available any more.
 */
tutao.db.DbInterface.STATUS_NO_MEM = "no_mem";

/**
 * Indicates if the database is supported. This function may (and should) be called before init();
 * @return {boolean} True if this database implementation is supported by the browser, false otherwise.
 */
tutao.db.DbInterface.prototype.isSupported = function() {};

/**
 * Initializes the database. This must be called before any calls to other functions are allowed, except isSupported().
 * @param {string} name A name to distinguish it from other databases stored by the browser. This name should contain some user identification to
 * keep a separate database for each user.
 * @param {function(string)|undefined} callback This optional function is called as soon as the execution is finished with the status code STATUS_SUCCESS.
 */
tutao.db.DbInterface.prototype.init = function(name, callback) {};

/**
 * Deletes all tables in the database.
 * @param {function(string)|undefined} callback This optional function is called as soon as the execution is finished with the status code STATUS_SUCCESS.
 */
tutao.db.DbInterface.prototype.clear = function(callback) {};

/**
 * Stores the information that all searchable attributes of the element have been indexed. As elements should be indexed by age,
 * we assume that this element is now the youngest element that was indexed. A corresponding subsequent call to getLastIndexed() will return elementId.
 * Calls the callback function when finished.
 * @param {number} typeId The id of the type of the element.
 * @param {string} elementId The id of the element (no list id in case of LET instance).
 * @param {function(string)|undefined} callback This optional function is called as soon as the execution is finished with one of
 * the status code STATUS_SUCCESS or STATUS_NO_MEM.
 */
tutao.db.DbInterface.prototype.setIndexed = function(typeId, elementId, callback) {};

/**
 * Provides the id of the youngest element (by element id) that is indexed.
 * @param {number} typeId The id of the type of the element.
 * @param {function(string,?string)} callback This function is called as soon as the execution is finished with the status code STATUS_SUCCESS.
 * As second argument the id of the last indexed element is passed to the callback function. If none was indexed, null is passed.
 */
tutao.db.DbInterface.prototype.getLastIndexed = function(typeId, callback) {};

/**
 * Stores the index entries for an elements attribute. The element is of type ET or LET, but the attribute may be one of the
 * aggregated types. Calls the callback function when finished.
 * @param {number} typeId The id of the type of the element. The type may be an ET or LET.
 * @param {Array.<number>} attributeIds The ids leading to the searchable attribute of the type.
 * This id chain must start with an attribute of the type (ET or LET) and may go down to AggregatedType's attributes.
 * @param {string} elementId The id of the element (no list id in case of LET instance).
 * @param {Array.<string>} values The values that shall reference the element.
 * @param {function(string)|undefined} callback This optional function is called as soon as the execution is finished with one of
 * the status code STATUS_SUCCESS or STATUS_NO_MEM.
 */
tutao.db.DbInterface.prototype.addIndexEntries = function(typeId, attributeIds, elementId, values, callback) {};

/**
 * Retrieves the ids of all elements that contain the given value. The element is of type ET or LET,
 * but the attribute may be one of the aggregated types.
 * @param {number} typeId The id of the type of the element. The type may be an ET or LET.
 * @param {Array.<number>} attributeIds The ids leading to the searchable attribute of the type.
 * This id chain must start with an attribute of the type (ET or LET) and may go down to AggregatedType's attributes.
 * @param {string} value The value that the returned elements shall contain.
 * @param {function(string,Array.<string>)} callback This function is called as soon as the execution is finished with the status code STATUS_SUCCESS.
 * As second argument an array of string ids of the matching elements (only element ids, no list ids) is passed to the callback function.
 */
tutao.db.DbInterface.prototype.getElementsByValue = function(typeId, attributeIds, value, callback) {};

/**
 * Removes all index entries for the given element id for the given attribute ids lists.
 * @param {number} typeId The id of the type of the element. The type may be an ET or LET.
 * @param {Array.<Array.<number>>} attributeIdsList An array of arrays with ids leading to the searchable attribute of the type.
 * This id chain must start with an attribute of the type (ET or LET) and may go down to AggregatedType's attributes.
 * @param {string} elementId The id of the element (no list id in case of LET instance).
 * @param {function(string)} callback This function is called as soon as the execution is finished with the status code STATUS_SUCCESS.
 */
tutao.db.DbInterface.prototype.removeIndexEntries = function(typeId, attributeIdsList, elementId, callback) {};
