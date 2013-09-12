"use strict";

goog.provide('tutao.util.FunctionUtils');

/**
 * Rebinds all methods defined on a prototype to this. This is useful for methods that
 * are invoked from another context (e.g. event handlers).
 * @param {Object} instance The instance whose methods are bound to this.
 * @see http://groups.google.com/group/knockoutjs/browse_thread/thread/7181e2fc6a4e2dab
 */
tutao.util.FunctionUtils.bindPrototypeMethodsToThis = function(instance) {
	for (var method in Object.getPrototypeOf(instance)) {
		instance[method] = instance[method].bind(instance);
	}
};

/**
 * Executes a given function for each element in the given array sequentially.
 * The given callback is called when either all elements are executed or an
 * exception occurs.
 *
 * @param {Array}
 *            array An array of any type of elements.
 * @param {function(*,function(Error=))}
 *            executor A function receiving the element from the array to
 *            execute as well as a finish function. The finish function must be
 *            called when executing the element was finished. If an error
 *            occurred an exception can be passed to the finish function. In
 *            this case the overall execution is stopped and the callback is
 *            called passing the exception.
 * @param {function(Error=)}
 *            callback Called when either an error occurred or all elements from
 *            the array are executed.
 */
tutao.util.FunctionUtils.executeSequentially = function(array, executor, callback) {
	var executeRemaining = function(nextIndex) {
		if (nextIndex == array.length) {
			callback();
			return;
		}
		executor(array[nextIndex], function(exception) {
			if (exception) {
				callback(exception);
			} else {
				executeRemaining(nextIndex + 1);
			}
		});
	};
	executeRemaining(0);
};

/**
 * Executes a given function for each element in the given array sequentially.
 * The given callback is called when either all elements are executed or an
 * exception occurs.
 *
 * @param {Array} array An array of any type of elements.
 * @param {function(*,function(Object, Error=))} executor A function receiving the element from the array to
 *            execute as well as a finish function. The finish function must be
 *            called with the return value when executing the element was finished. 
 *            If an error occurred an exception can be passed to the finish function. In
 *            this case the overall execution is stopped and the callback is
 *            called passing the exception.
 * @param {function(Array.<Object>, Error=)} callback Called when either an error occurred or all elements from
 *            the array are executed. The first parameter are the return values.
 */
tutao.util.FunctionUtils.executeSequentiallyAndReturn = function(array, executor, callback) {
	var resultArray = [];
	var executeRemaining = function(nextIndex) {
		if (nextIndex == array.length) {
			callback(resultArray);
			return;
		}
		executor(array[nextIndex], function(result, exception) {
			if (exception) {
				callback(null, exception);
			} else {
				resultArray.push(result);
				executeRemaining(nextIndex + 1);
			}
		});
	};
	executeRemaining(0);
};
