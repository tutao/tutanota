// @flow

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
