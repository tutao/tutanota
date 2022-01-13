import "systemjs"

const globalContext = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : self

const noOp = function () {
}

if (typeof performance === "undefined") {
	// @ts-ignore
	self.performance = {
		// @ts-ignore
		offset: Date.now(),
		now: function now() {
			// @ts-ignore
			return Date.now() - this.offset
		},
	}
}

if (typeof performance.mark !== "function") {
	// @ts-ignore
	performance.mark = noOp
}

if (typeof performance.measure !== "function") {
	// @ts-ignore
	performance.measure = noOp
}

if (typeof Uint8Array.prototype.slice === "undefined") {
	Uint8Array.prototype.slice = function (from, to) {
		if (!to) {
			to = this.byteLength
		}

		return new Uint8Array(this.subarray(from, to))
	}
}