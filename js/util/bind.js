"use strict";

/**
 * Overrides the bind method if it does not exist (which is currently only the case for safari.
 */
if (!Function.prototype.bind) {

/**
 * Implements bind on the function prototype.
 * @param {Object} oThis The object to bind.
 * @return {function()} The bound function.
 */
  Function.prototype.bind = function(oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        /**
         * @constructor
         */
        fNOP = function() {},
        fBound = function() {
          return fToBind.apply(this instanceof fNOP ? this : oThis || window, aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}
