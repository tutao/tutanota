"use strict";

goog.provide('tutao.util.ArrayUtils');

/**
 * Provides an array containing all elements that are in all of the provided arrays. duplicates and empty elements are removed.
 * @param {Array.<Array>} arrays The arrays that shall be combined.
 * @return {Array} The combined array.
 */
tutao.util.ArrayUtils.getUniqueAndArray = function(arrays) {
	if (arrays.length == 0) {
		return [];
	}

	var targetObject = [];
	var currentObject = tutao.util.ArrayUtils._arrayToObject(arrays[0]);
	for (var a = 1; a < arrays.length; a++) {
		var array = arrays[a];
		for (var i = 0; i < array.length; i++) {
			if (array[i] != "" && currentObject[array[i]]) {
				targetObject[array[i]] = array[i];
			}
		}
		currentObject = targetObject;
		targetObject = {};
	}
	return tutao.util.ArrayUtils._objectToArray(currentObject);
};

/**
 * Provides an array containing all elements that are in any of the provided arrays. duplicates and empty elements are removed.
 * @param {Array.<Array>} arrays The arrays that shall be combined.
 * @return {Array} The combined array.
 */
tutao.util.ArrayUtils.getUniqueOrArray = function(arrays) {
	var object = {};

    for (var a = 0; a < arrays.length; a++) {
    	var array = arrays[a];
	    for (var i = 0; i < array.length; i++) {
	    	if (array[i] != "") {
	    		object[array[i]] = array[i];
	    	}
	    }
    }
    return tutao.util.ArrayUtils._objectToArray(object);
};

/**
 * Provides an array containing all unique elements from the given array.
 * @param {Array} array The array.
 * @return {Array} An array with unique elements from array.
 */
tutao.util.ArrayUtils.getUniqueArray = function(array) {
	return tutao.util.ArrayUtils._objectToArray(tutao.util.ArrayUtils._arrayToObject(array));
};

/**
 * Provides an object containing all elements from the given array mapping to the element itself. Empty elements are discarded.
 * @param {Array} array The array.
 * @return {Object} The object.
 */
tutao.util.ArrayUtils._arrayToObject = function(array) {
	var object = {};
	for (var i = 0; i < array.length; i++) {
    	if (array[i] != "") {
    		object[array[i]] = array[i];
    	}
    }
	return object;
};

/**
 * Provides an array containing all values from the given object.
 * @param {Object} object The object.
 * @return {Array} array The array.
 */
tutao.util.ArrayUtils._objectToArray = function(object) {
	var array = [];
	for (var element in object) {
		array.push(object[element]);
    }
	return array;
};

/**
 * Remove the element from theArray if it is contained in the array.
 * @param {Array} theArray The array to remove the element from.
 * @param {*} elementToRemove The element to remove from the array.
 */
tutao.util.ArrayUtils.remove = function(theArray, elementToRemove) {
    var i = theArray.indexOf(elementToRemove);
    if (i != -1) {
        theArray.splice(i, 1);
    }
};

/**
 * Provides the last element of the given array.
 * @param {Array} theArray The array.
 * @return {*} The last element of the array.
 */
tutao.util.ArrayUtils.last = function(theArray) {
    return theArray[theArray.length - 1];
};

/**
 * Compares two arrays on equality.
 * @param {Array} a1 The first array.
 * @param {Array} a2 The second array.
 * @return {boolean} True if the arrays are equal, false otherwise.
 */
tutao.util.ArrayUtils.arrayEquals = function(a1, a2) {
	if (a1.length === a2.length) {
		for (var i = 0; i < a1.length; i++) {
			if (a1[i] !== a2[i]) {
				return false;
			}
		}
		return true;
	}
	return false;
};

/**
 * Checks if an array contains a given value.
 * @param {Array} array The array to test.
 * @param {*} value The value that is checked to be contained in the array.
 * @return {boolean} True if the array contains the value, false otherwise.
 */
tutao.util.ArrayUtils.contains = function(array, value) {
	return array.indexOf(value) != -1;
};

/**
 * Adds all elements from an array to another array.
 * @param {Array} array The array to add elements to.
 * @param {Array} elements The array with the elements to be added.
 */
tutao.util.ArrayUtils.addAll = function(array, elements) {
    array.push.apply(array, elements);
};

/**
 * Adds all elements from an array to the beginning of another array.
 * @param {Array} array The array to prepend elements to.
 * @param {Array} elements The array with the elements to be prepended.
 */
tutao.util.ArrayUtils.prependAll = function(array, elements) {
    array.splice.apply(array, [0, 0].concat(elements));
};
