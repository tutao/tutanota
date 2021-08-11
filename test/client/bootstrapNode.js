global.env = require('../../buildSrc/env.js').create(null, "http://localhost:9000", require('../../../package.json').version, "Test")

global.isBrowser = false

Promise.longStackTraces()

/* Alternative to using Mithrils DOM mock (below).
 import jsdom from 'jsdom';
 global.document = jsdom.jsdom('<!doctype html><html><body></body></html>');
 global.window = document.defaultView;
 global.navigator = global.window.navigator;
 */

global.window = require("mithril/test-utils/browserMock")()
global.window.getElementsByTagName = function () {
} // for styles.js
global.window.location = {hostname: "https://tutanota.com"}
global.window.document.addEventListener = function () {
}
global.document = global.window.document
global.navigator = global.window.navigator
let local = {}
global.localStorage = {
	getItem: key => local[key],
	setItem: (key, value) => local[key] = value
}


// node environment: mock a few browser functions

global.btoa = function (str) {
	return Buffer.from(str, 'binary').toString('base64')
}
global.atob = function (b64Encoded) {
	return Buffer.from(b64Encoded, 'base64').toString('binary')
}

let crypto = require('crypto')

global.crypto = {
	getRandomValues(bytes) {
		crypto.randomFillSync(bytes)
		return bytes
	}
}
global.window.crypto = global.crypto

global.XMLHttpRequest = require('xhr2')

const path = require('path')
global.System = {
	'import': function (modulePath) {
		let systemBaseDir = path.resolve(__dirname, "../../")
		let absolutePath = path.resolve(systemBaseDir, modulePath)
		return Promise.resolve(require(absolutePath))
	}
}

// provide the mapping of the @hot module (maps in system js to @empty; an empty module)
const Module = require('module').Module;
Module._cache['@hot'] = {exports: {module: undefined}}
const resolveFilenameNode = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain) {
	if (request === '@hot') return request
	return resolveFilenameNode(request, parent, isMain)
}

/**
 * runs this test exclusively on browsers (not nodec)
 */
global.browser = function (func: Function) {
	return function () {
	}
}

/**
 * runs this test exclusively on node (not browsers)
 */
global.node = function (func: Function) {
	return func
}

global.requestAnimationFrame = global.requestAnimationFrame || (callback => setTimeout(callback, 10))

process.on("unhandledRejection", function (e) {
	console.log("Uncaught (in promise) " + e.stack)
})

window.tutao = {}

require("../../src/api/common/Env").bootFinished()

require('./Suite.js')
