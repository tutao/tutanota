// some things should be defined before we import the tests

// @ts-nocheck
globalThis.isBrowser = false

const noOp = () => {}

/**
 * runs this test exclusively on browsers (not node)
 */
globalThis.browser = () => noOp

/**
 * runs this test exclusively on node (not browsers)
 */
globalThis.node = (func) => func

const { JSDOM } = await import("jsdom")
var dom = new JSDOM("", {
	// So we can get `requestAnimationFrame`
	pretendToBeVisual: true,
})

globalThis.requestAnimationFrame = dom.window.requestAnimationFrame
globalThis.window = dom.window
dom.reconfigure({ url: "http://tutanota.com" })
globalThis.window.getElementsByTagName = function () {} // for styles.js
globalThis.window.document.addEventListener = function () {}
globalThis.document = globalThis.window.document
// globalThis.navigator = globalThis.window.navigator
const local = {}
globalThis.localStorage = {
	getItem: (key) => local[key],
	setItem: (key, value) => (local[key] = value),
}
globalThis.requestAnimationFrame = globalThis.requestAnimationFrame || ((callback) => setTimeout(callback, 10))

globalThis.btoa = (str) => Buffer.from(str, "binary").toString("base64")
globalThis.atob = (b64Encoded) => Buffer.from(b64Encoded, "base64").toString("binary")
globalThis.WebSocket = noOp
globalThis.window.CompressionStream = CompressionStream

const nowOffset = Date.now()
globalThis.performance = {
	now: function () {
		return Date.now() - nowOffset
	},
}
globalThis.performance = {
	now: Date.now,
	mark: noOp,
	measure: noOp,
}
// modern node *does* have it set globally but it sometimes doesn't work
const crypto = await import("node:crypto")
Object.defineProperty(globalThis, "crypto", {
	value: {
		getRandomValues: function (bytes) {
			let randomBytes = crypto.randomBytes(bytes.length)
			bytes.set(randomBytes)
			return bytes
		},
	},
})

globalThis.XMLHttpRequest = (await import("xhr2")).default
process.on("unhandledRejection", function (e) {
	console.log("Uncaught (in promise) " + e.stack)
})
globalThis.electronMock = {
	app: {},
}

window.tutao = {
	appState: {
		prefixWithoutFile: "./",
	},
}

export const run = (await import("./Suite.js")).run
