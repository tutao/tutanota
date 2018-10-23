import {bootFinished} from "../../src/api/Env"

window.isBrowser = true

Promise.config({
	longStackTraces: false,
	warnings: false
})

/**
 * runs this test exclusively on browsers (not nodec)
 */
window.browser = function (func: Function) {
	return func
}

/**
 * runs this test exclusively on node (not browsers)
 */
window.node = function (func: Function) {
	return function () {
	}
}

window.tutao = {}

bootFinished()
System.import('test/api/Suite.js')