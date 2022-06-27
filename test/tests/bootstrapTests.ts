// @ts-nocheck
globalThis.isBrowser = typeof window !== "undefined"
globalThis.mocks = {}

;(async function () {
	if (globalThis.isBrowser) {
		await setupBrowser()
	} else {
		await setupNode()
	}

	window.tutao = {
		appState: {
			prefixWithoutFile: "./"
		}
	}

	import('../tests/Suite.js')

})()

const noOp = () => {
}

function setupBrowser() {
	/**
	 * runs this test exclusively on browsers (not nodec)
	 */
	window.browser = (func) => func

	/**
	 * runs this test exclusively on node (not browsers)
	 */
	window.node = () => noOp
}

async function setupNode() {
	/**
	 * runs this test exclusively on browsers (not node)
	 */
	globalThis.browser = () => noOp

	/**
	 * runs this test exclusively on node (not browsers)
	 */
	globalThis.node = (func) => func

	const {JSDOM} = await import("jsdom")
	var dom = new JSDOM("", {
		// So we can get `requestAnimationFrame`
		pretendToBeVisual: true,
	})

	globalThis.requestAnimationFrame = dom.window.requestAnimationFrame
	globalThis.window = dom.window
	dom.reconfigure({"url": "http://tutanota.com"})
	globalThis.window.getElementsByTagName = function () {
	} // for styles.js
	globalThis.window.document.addEventListener = function () {
	}
	globalThis.document = globalThis.window.document
	globalThis.navigator = globalThis.window.navigator
	const local = {}
	globalThis.localStorage = {
		getItem: key => local[key],
		setItem: (key, value) => local[key] = value
	}
	globalThis.requestAnimationFrame = globalThis.requestAnimationFrame || (callback => setTimeout(callback, 10))

	globalThis.btoa = str => Buffer.from(str, 'binary').toString('base64')
	globalThis.atob = b64Encoded => Buffer.from(b64Encoded, 'base64').toString('binary')
	globalThis.WebSocket = noOp

	const nowOffset = Date.now();
	globalThis.performance = {
		now: function () {
			return Date.now() - nowOffset;
		}
	}
	globalThis.performance = {
		now: Date.now,
		mark: noOp,
		measure: noOp,
	}
	const crypto = await import("crypto")
	globalThis.crypto = {
		getRandomValues: function (bytes) {
			let randomBytes = crypto.randomBytes(bytes.length)
			bytes.set(randomBytes)
		}
	}
	globalThis.XMLHttpRequest = (await import("xhr2")).default
	process.on("unhandledRejection", function (e) {
		console.log("Uncaught (in promise) " + e.stack)
	})
	globalThis.electronMock = {
		app: {}
	}

	globalThis.XMLHttpRequest = (await import("xhr2")).default
	globalThis.express = (await import("express")).default
	globalThis.bodyParser = (await import("body-parser")).default
}