import "core-js/es6/symbol.js"
import "core-js/es6/array.js"
import "core-js/modules/es7.array.includes.js"
import "core-js/es6/object.js"
import "core-js/es6/string.js"
import "core-js/es6/map.js"
import "core-js/es6/set.js"
import "core-js/modules/es7.object.values"
import "core-js/modules/es7.object.entries"

import "systemjs"
import BluebirdPromise from "bluebird"

const globalContext = (typeof window !== "undefined")
	? window
	: (typeof global !== "undefined")
		? global
		: self

// bluebird does not replace globals inside IIFE becaues it's UMD
globalContext.Promise = BluebirdPromise
Promise.config({
	longStackTraces: false,
	warnings: false
})

const noOp = function () {}

if (typeof performance === 'undefined') {
	self.performance = {
		offset: Date.now(),
		now: function now() {
			return Date.now() - this.offset;
		}
	}
}


if (typeof performance.mark !== "function") {
	performance.mark = noOp
}

if (typeof performance.measure !== "function") {
	performance.measure = noOp
}

if (typeof Uint8Array.prototype.slice === 'undefined') {
	Uint8Array.prototype.slice = function (from, to) {
		if (!to) {
			to = this.byteLength
		}
		return new Uint8Array(this.subarray(from, to))
	}
}
