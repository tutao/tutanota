import "core-js/es6/symbol.js"
import "core-js/es6/array.js"
import "core-js/es6/object.js"
import "core-js/es6/string.js"
import "core-js/es6/map.js"

// is used by helpers/update-libs.js to generate lib/polyfill.js

const noOp = () => {}

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