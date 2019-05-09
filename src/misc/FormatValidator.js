// @flow
import {startsWith} from "../api/common/utils/StringUtils"


/**
 * Checks if the given string is a valid email address format.
 * @param string The string to check.
 * @param strictUserName If true checks that the part before the @ is not longer than 64 characters and does not contain special characters.
 * @return If the string is an email address.
 */
export function isMailAddress(string: string, strictUserName: boolean): boolean {
	/* KEEP IN SYNC WITH JAVA VERSION IN PhoneNumberUtils.js (except uppercase) */
	// check trailing whitespaces because they are not covered by the following regexp
	// allow uppercase addresses in input check, convert them before sending to server.
	if (string == null || string !== string.trim()) {
		return false
	}
	if (string.indexOf("-") === 0) {
		return false
	}
	if (string.indexOf(",") !== -1 ||
		string.indexOf("(") !== -1 ||
		string.indexOf(")") !== -1 ||
		string.indexOf(":") !== -1 ||
		string.indexOf(";") !== -1 ||
		string.indexOf("<") !== -1 ||
		string.indexOf(">") !== -1 ||
		string.indexOf("[") !== -1 ||
		string.indexOf("]") !== -1 ||
		string.indexOf("\\") !== -1) {
		return false;
	}
	// check lengths (see https://tools.ietf.org/html/rfc5321#section-4.5.3)
	if (string.length > 254) { // 256 minus "<" and ">" of the path
		return false
	}
	if (strictUserName) {
		if (string.indexOf("@") > 64) {
			return false
		}
		// see https://web.archive.org/web/20180813043723/http://ntt.cc/2008/05/10/over-10-useful-javascript-regular-expression-functions-to-improve-your-web-applications-efficiency.html
		return /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/.test(string)
	} else {
		// see https://web.archive.org/web/20180813043723/http://ntt.cc/2008/05/10/over-10-useful-javascript-regular-expression-functions-to-improve-your-web-applications-efficiency.html
		return /^[^\s\@]+\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/.test(string)
	}
}


/**
 * Checks if the given string is a valid domain name.
 * @param {string} domainName The string to check.
 * @return {boolean} If the string is a domain name.
 */
export function isDomainName(domainName: string): boolean {
	if (domainName == null || domainName !== domainName.trim()) {
		return false
	}
	if (startsWith(domainName, "-")) {
		return false
	}
	return /^[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/.test(domainName)
}

export function isRegularExpression(value: string) {
	return /^\/.*\/$/.test(value)
}
