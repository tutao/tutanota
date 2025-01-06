const globalContext = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : self

const noOp = function () {}

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

// We need BigInt stub for cborg
if (typeof BigInt === "undefined") {
	console.log("No BigInt support in browser, stubbing...")

	function BigInt(arg: any) {
		return arg
	}

	BigInt.polyfilled = true
	// @ts-ignore
	globalContext.BigInt = BigInt
}
