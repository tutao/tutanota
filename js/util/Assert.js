"use strict";

goog.provide('tutao.util.Assert');

/**
 * Throws an exception if the given object is null or undefined;
 * @param {?*} object The object that is tested to be not null and not undefined.
 * @param {string=} text An optional text that is thrown if the assertion fails.
 */
tutao.util.Assert.assertObject = function(object, text) {
	if (object === null) {
//		undefined['assertionFailedBecauseObjectIsNull'] = 0;
		throw new Error((text) ? text : "object is null");
	}
	if (object === undefined) {
//		undefined['assertionFailedBecauseObjectIsUndefined'] = 0;
		throw new Error((text) ? text : "object is undefined");
	}
};

/**
 * Throws an exception if the given object is not undefined;
 * @param {?*} object The object that is tested to be undefined.
 * @param {string=} text An optional text that is thrown if the assertion fails.
 */
tutao.util.Assert.assertUndefined = function(object, text) {
	if (object !== undefined) {
//		undefined['assertionFailedBecauseObjectIsNotUndefined'] = 0;
		throw new Error((text) ? text : "object is not undefined");
	}
};

/**
 * Throws an exception if the expression does not evaluate to true.
 * @param {boolean} exp The expression that is tested to be true.
 * @param {string=} text An optional text that is thrown if the assertion fails.
 */
tutao.util.Assert.assert = function(exp, text) {
	if (!exp) {
		throw new Error((text) ? text : "Assertion failed");
	}
};

/**
 * Throws an exception.
 * @param {string=} text An optional text that is thrown if the assertion fails.
 */
tutao.util.Assert.fail = function(text) {
//	undefined['assertionFailed'] = 0;
	throw new Error((text) ? text : "assertion fail");
};
