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
	return string.indexOf(substring) === 0;
}

/**
 * Checks if a string ends with another string.
 * @param string The string to test.
 * @param substring If the other string ends with this one, we return true.
 * @return True if string ends with substring, false otherwise.
 */
export function endsWith(string: string, substring: string): boolean {
	var pos = string.lastIndexOf(substring);
	return (pos !== -1 && pos === (string.length - substring.length));
}
