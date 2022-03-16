// @ts-nocheck
// import env from "@tutanota/env"
import * as env from "../../buildSrc/env.js"
import {promises as fs} from "fs"
import path, {dirname} from "path"
import {fileURLToPath} from "url"

const testRoot = dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(path.join(testRoot, ".."))
const pjPath = path.join(projectRoot, "package.json")

const {version} = JSON.parse(await fs.readFile(pjPath, "utf8"))

globalThis.env = env.create({staticUrl: "http://localhost:9000", version, mode: "Test", dist: false})
globalThis.buildOptions = {sqliteNativePath: "./native-cache/node/better-sqlite3-7.5.0-linux.node"}

globalThis.isBrowser = typeof window !== "undefined"

;(async function () {
	const noOp = () => {
	}

	if (isBrowser) {
		/**
		 * runs this test exclusively on browsers (not nodec)
		 */
		window.browser = (func) => func

		/**
		 * runs this test exclusively on node (not browsers)
		 */
		window.node = () => noOp
	} else {

		/**
		 * runs this test exclusively on browsers (not node)
		 */
		globalThis.browser = () => noOp

		/**
		 * runs this test exclusively on node (not browsers)
		 */
		globalThis.node = (func) => func

		const browserMock = await import("mithril/test-utils/browserMock")
		globalThis.window = browserMock.default()
		globalThis.window.getElementsByTagName = function () {
		} // for styles.js
		globalThis.window.location = {hostname: "https://tutanota.com"}
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

		window.tutao = {
			appState: {
				prefixWithoutFile: "./"
			}
		}

		globalThis.XMLHttpRequest = (await import("xhr2")).default
		globalThis.express = (await import("express")).default
		globalThis.bodyParser = (await import("body-parser")).default
	}

	const Env = await import("../../src/api/common/Env")
	Env.bootFinished()
	import('./Suite.js')
})()

