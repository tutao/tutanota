"use strict";

goog.provide('tutao.util.StringUtils');

/**
 * Returns a string which contains the given number padded with 0s.
 * @param {number} num The number to pad.
 * @param {number} size The number of resulting digits.
 * @return {string} The padded number as string.
 */
tutao.util.StringUtils.pad = function(num, size) {
	var s = num + "";
	while (s.length < size)
		s = "0" + s;
	return s;
};

/**
 * Checks if a string starts with another string.
 * @param {string} string The string to test.
 * @param {string} substring If the other string begins with this one, we return true.
 * @return {boolean} True if string begins with substring, false otherwise.
 */
tutao.util.StringUtils.startsWith = function(string, substring) {
    return string.indexOf(substring) == 0;
};

/**
 * Checks if a string ends with another string.
 * @param {string} string The string to test.
 * @param {string} substring If the other string ends with this one, we return true.
 * @return {boolean} True if string ends with substring, false otherwise.
 */
tutao.util.StringUtils.endsWith = function(string, substring) {
	var pos = string.lastIndexOf(substring);
    return (pos != -1 && pos == (string.length - substring.length));
};
