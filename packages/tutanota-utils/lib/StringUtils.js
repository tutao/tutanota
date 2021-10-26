// @flow

import type {lazy} from "./Utils.js"

/**
 * Returns a string which contains the given number padded with 0s.
 * @param num The number to pad.
 * @param size The number of resulting digits.
 * @return The padded number as string.
 */
export function pad(num: number, size: number): string {
	var s = num + "";
	while (s.length < size)
		s = "0" + s;
	return s;
}

/**
 * Checks if a string starts with another string.
 * @param string The string to test.
 * @param substring If the other string begins with this one, we return true.
 * @return True if string begins with substring, false otherwise.
 */
export function startsWith(string: string, substring: string): boolean {
	return string.startsWith(substring)
}

/**
 * uppercase the first letter of a string, lowercase the rest
 * @param str string to transform
 * @returns {string} str in lowercase with first letter Capitalized
 */
export function capitalizeFirstLetter(str: string): string {
	return str[0].toUpperCase() + str.toLowerCase().slice(1);
}

/**
 * Checks if a string ends with another string.
 * @param string The string to test.
 * @param substring If the other string ends with this one, we return true.
 * @return True if string ends with substring, false otherwise.
 */
export function endsWith(string: string, substring: string): boolean {
	return string.endsWith(substring)
}


export function lazyStringValue(valueOrLazy: string | lazy<string>): string {
	return typeof valueOrLazy === "function"
		? valueOrLazy()
		: valueOrLazy
}

export function repeat(value: string, length: number): string {
	let result = ""
	for (let i = 0; i < length; i++) {
		result += value;
	}
	return result
}

export function cleanMatch(s1: string, s2: string): boolean {
	return s1.toLowerCase().trim() === s2.toLowerCase().trim()
}

/**
 * Non-breaking space character
 */
export const NBSP = "\u00A0";

/**
 * split a string at a given index
 * @param str
 * @param index
 */
export function splitAt(str: string, index: number): [string, string] {
	return [str.substring(0, index), str.substring(index)]
}

/**
 * Wrapper around String.prototype.toLowerCase, nice for calls to Array.prototype.map
 * @param str
 */
export function toLowerCase(str: string): string {
	return str.toLowerCase()
}

/**
 * Wrapper around String.prototype.localeCompare, for passing to Array.prototype.sort
 * @param a
 * @param b
 * @returns {number}
 */
export function localeCompare(a: string, b: string): number {
	return a.localeCompare(b)
}

export function byteLength(str: ?string): number {
	if (str == null) return 0
	// returns the byte length of an utf8 string
	var s = str.length;
	for (var i = str.length - 1; i >= 0; i--) {
		var code = str.charCodeAt(i);
		if (code > 0x7f && code <= 0x7ff) {
			s++;
		} else if (code > 0x7ff && code <= 0xffff) s += 2;
		if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
	}
	return s;
}

/**
 * replace all instances of substr in str with replacement
 */
export function replaceAll(str: string, substr: string, replacement: string): string {
	const regex = escapedStringRegExp(substr, 'g')
	return str.replace(regex, replacement)
}

/**
 * Create a regex to exactly match a given string, by escaping any special regex characters
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 * */
function escapedStringRegExp(str: string, flags: string): RegExp {
	return new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
}