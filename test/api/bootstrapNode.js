global.env = require('../../buildSrc/env.js').create(null, "Local", "http://localhost:9000", require('../../../package.json').version)

// node environment: mock a few browser functions
global.Promise = require("bluebird")
Promise.config({
	longStackTraces: true
})

global.isBrowser = false

global.btoa = function (str) {
	return new Buffer(str, 'binary').toString('base64')
}
global.atob = function (b64Encoded) {
	return new Buffer(b64Encoded, 'base64').toString('binary')
}

let crypto = require('crypto')

global.crypto = {
	getRandomValues: function (bytes) {
		let randomBytes = crypto.randomBytes(bytes.length)
		bytes.set(randomBytes)
	}
}

global.XMLHttpRequest = require('xhr2')
global.express = require('express')
global.enableDestroy = require('server-destroy')
global.bodyParser = require('body-parser')

global.WebSocket = function () {
}

const caller = require('caller')
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

require('./Suite.js')