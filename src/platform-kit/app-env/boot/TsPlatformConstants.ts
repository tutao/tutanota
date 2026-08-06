/// This file will not be transpiled, so it's ok to ignore transpile-related eslint
/* eslint-disable  no-restricted-syntax */

import { BrowserType } from "./ClientConstants"

export let _isWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope
export let _isNode = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node !== "undefined"

export const _expectedBuiltInsArePresent =
	typeof Set !== "undefined" &&
	typeof Map !== "undefined" &&
	typeof Array.prototype.includes === "function" &&
	typeof Object.entries === "function" &&
	typeof Object.values === "function" &&
	typeof Object.fromEntries === "function" &&
	typeof Symbol !== "undefined" &&
	typeof Uint8Array !== "undefined" &&
	typeof Proxy !== "undefined" &&
	typeof Reflect !== "undefined" &&
	typeof Promise.prototype.finally !== "undefined" &&
	typeof String.prototype.replaceAll === "function" &&
	typeof BigInt !== "undefined" &&
	typeof structuredClone === "function"

export function _cssQuerySelectorIsSupported() {
	try {
		document.querySelector("blockquote:not(blockquote blockquote)")
		document.querySelectorAll(":where(.mouse-nav)")
		return true
	} catch (e) {
		return false
	}
}

/**
 * This function uses syntax constructs which we want to make sure are supported. If they are not then this file cannot be imported.
 */
export function _expectedJsSyntaxes(): boolean {
	// By default rollup disables tree-shaking inside the try-catch.
	try {
		const arrowFunction = () => {
			return 1
		}

		let aLet = 2

		function* testGenerator() {}

		async function testAsync() {}

		function testDefaultArgs(_a = 2) {}

		testGenerator()
		testAsync()
		testDefaultArgs()
		const anArray = [1, 2, 3]
		const spreadArray = [...anArray]
		const dynamicString = ""
		const impossibleCondition = arrowFunction() === aLet

		if (impossibleCondition) {
			import(dynamicString)
		}

		const objectSyntax = {
			[dynamicString]: true,

			testFn() {},

			get accessor() {
				return null
			},

			set accessor(newValue) {},
		}
		const templateString = `test ${dynamicString}`
		const x = 1
		const y = 2
		const propertyShorthand = {
			x,
			y,
		}
		const { x: x2, y: y2 } = propertyShorthand
		const [a1, a2, ...arest] = anArray

		class WithStatisMember {
			static aFuncton() {}
		}

		for (const item of testGenerator()) {
			/* empty */
		}

		return true
	} catch (e) {
		/* empty */
		return false
	}
}

/**
 * @see https://github.com/Modernizr/Modernizr/blob/5e3f359bfc9aa511543ece60bd8a6ea8aa7defd3/feature-detects/websockets.js
 */
export function _haveWebsocket() {
	return "WebSocket" in window && window.WebSocket.CLOSING === 2
}

export function _isSupportedBrowserVersion(browser: BrowserType, browserVersion: number): boolean {
	return notOldFirefox(browser, browserVersion) && notOldChrome(browser, browserVersion)
}

function notOldFirefox(browser: BrowserType, browserVersion: number): boolean {
	// issue only occurs for old Firefox browsers
	// Object.hasOwn() is only supported starting in 92
	return browser !== BrowserType.FIREFOX || browserVersion > 92
}

function notOldChrome(browser: BrowserType, browserVersion: number): boolean {
	// Object.hasOwn() is only supported starting in 93
	return browser !== BrowserType.CHROME || browserVersion > 93
}
