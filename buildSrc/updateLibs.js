/**
 * Copies all currently used libraries from node_modules into libs.
 *
 * We do this to be able to audit changes in the libraries and not rely on npm for checksums.
 */
import fs from "fs-extra"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { rollup } from "rollup"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function updateLibs() {
	await copyToLibs(clientDependencies)
}

/**
 * Should correspond to {@link import("./RollupConfig").dependencyMap}
 *
 * @typedef {"rollupWeb" | "rollupDesktop" | "copy"} BundlingStrategy
 * @typedef {{src: string, target: string, bundling: BundlingStrategy, banner?: string}} DependencyDescription
 * @type Array<DependencyDescription>
 *
 */
const clientDependencies = [
	// mithril is patched manually to remove some unused parts
	// "../node_modules/mithril/mithril.js",
	{ src: "../node_modules/mithril/stream/stream.js", target: "stream.js", bundling: "copy" },
	// squire is patched manually to fix issues
	// "../node_modules/squire-rte/dist/squire-raw.mjs",
	{ src: "../node_modules/dompurify/dist/purify.es.mjs", target: "purify.js", bundling: "copy" },
	{ src: "../node_modules/linkifyjs/dist/linkify.mjs", target: "linkify.js", bundling: "copy" },
	{ src: "../node_modules/linkify-html/dist/linkify-html.mjs", target: "linkify-html.js", bundling: "copy" },
	{ src: "../node_modules/luxon/build/es6/luxon.js", target: "luxon.js", bundling: "copy" },
	{ src: "../node_modules/jsqr/dist/jsQR.js", target: "jsQR.js", bundling: "copy" },
	{ src: "../node_modules/jszip/dist/jszip.js", target: "jszip.js", bundling: "rollupWeb" },
	{ src: "../node_modules/cborg/cborg.js", target: "cborg.js", bundling: "rollupWeb" },
	{ src: "../node_modules/qrcode-svg/lib/qrcode.js", target: "qrcode.js", bundling: "rollupWeb" },
	{ src: "../node_modules/electron-updater/out/main.js", target: "electron-updater.mjs", bundling: "rollupDesktop" },
	{ src: "../node_modules/@signalapp/sqlcipher/dist/index.mjs", target: "node-sqlcipher.mjs", bundling: "copy" },
	{ src: "../node_modules/undici/index.js", target: "undici.mjs", bundling: "rollupDesktop" },
]

async function applyPatch() {
	// rolldown gets confused when module.exports are used in an expression and wraps everything into a default export
	// remove the problematic parts
	console.log("applying a patch to undici")
	const undiciPath = path.join(__dirname, "../node_modules/undici/index.js")
	const contents = await fs.readFile(undiciPath, { encoding: "utf-8" })
	const replaced = contents
		.replace(
			`const SqliteCacheStore = require('./lib/cache/sqlite-cache-store')
module.exports.cacheStores.SqliteCacheStore = SqliteCacheStore`,
			"",
		)
		.replace(
			`function install () {
  globalThis.fetch = module.exports.fetch
  globalThis.Headers = module.exports.Headers
  globalThis.Response = module.exports.Response
  globalThis.Request = module.exports.Request
  globalThis.FormData = module.exports.FormData
  globalThis.WebSocket = module.exports.WebSocket
  globalThis.CloseEvent = module.exports.CloseEvent
  globalThis.ErrorEvent = module.exports.ErrorEvent
  globalThis.MessageEvent = module.exports.MessageEvent
  globalThis.EventSource = module.exports.EventSource
}

module.exports.install = install`,
			"",
		)
	await fs.writeFile(undiciPath, replaced, { encoding: "utf-8" })
}

/**
 * @param dependencies {Array<DependencyDescription>}>}
 * @return {Promise<void>}
 */
async function copyToLibs(dependencies) {
	await applyPatch()

	for (let { bundling, src, target, banner } of dependencies) {
		switch (bundling) {
			case "copy":
				await fs.copy(path.join(__dirname, src), path.join(__dirname, "../libs/", target))
				break
			case "rollupWeb":
				await rollWebDep(src, target, banner)
				break
			case "rollupDesktop":
				await rollDesktopDep(src, target, banner)
				break
			default:
				throw new Error(`Unknown bundling strategy: ${bundling}`)
		}
	}
}

/**
 * Will bundle web app dependencies starting at {@param src} into a single file at {@param target}.
 * @type RollupFn
 */
async function rollWebDep(src, target, banner) {
	const bundle = await rollup({ input: path.join(__dirname, src) })
	await bundle.write({ file: path.join(__dirname, "../libs", target), banner })
}

/**
 * @typedef {(src: string, target: string, banner: string | undefined) => Promise<void>} RollupFn
 * rollup desktop dependencies with their dependencies into a single esm file
 *
 * specifically, electron-updater is importing some electron internals directly, so we made a comprehensive list of
 * exclusions to not roll up.
 *
 * @type RollupFn
 */
async function rollDesktopDep(src, target, banner) {
	const bundle = await rollup({
		input: path.join(__dirname, src),
		makeAbsoluteExternalsRelative: true,
		external: [
			// we handle .node imports ourselves
			/\.node$/,
			"assert",
			"child_process",
			"constants",
			"crypto",
			"electron",
			"events",
			"fs",
			"http",
			"https",
			"os",
			"path",
			"stream",
			"string_decoder",
			"tty",
			"url",
			"util",
			"zlib",
			/.*sqlite-cache-store$/,
		],
		plugins: [
			nodeResolve({ preferBuiltins: true }),
			commonjs({
				ignore: ["node:sqlite"],
			}),
		],
		onwarn: (warning, defaultHandler) => {
			if (warning.code === "CIRCULAR_DEPENDENCY") {
				return // Ignore circular dependency warnings
			}
			defaultHandler(warning)
		},
	})
	await bundle.write({
		file: path.join(__dirname, "../libs", target),
		format: "es",
		// another ugly hack for better-sqlite
		banner,
	})
}
