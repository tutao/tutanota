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
