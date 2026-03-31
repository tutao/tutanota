const globalContext = typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : self

// deliberately named differently than noOp because typescript gets very confused otherwise
const noOpFn = function () {}

if (typeof performance === "undefined") {
	self.performance = {
		offset: Date.now(),
		now: function now() {
			// @ts-ignore
			return Date.now() - this.offset
		},
	}
}

if (typeof performance.mark !== "function") {
	performance.mark = noOpFn
}

if (typeof performance.measure !== "function") {
	performance.measure = noOpFn
}

// We need BigInt stub for cborg
if (typeof BigInt === "undefined") {
	console.log("No BigInt support in browser, stubbing...")

	function BigInt(arg) {
		return arg
	}

	BigInt.polyfilled = true
	globalContext.BigInt = BigInt
}
