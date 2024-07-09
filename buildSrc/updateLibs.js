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

/*
 * Each entry is one of:
 *  - string: will be copied from specified to libs preserving the file name
 *  - object with:
 *     - src: path to file
 *     - target: resulting file name
 *     - rollup: if truthy will use src as input for rollup, otherwise just copy
 */
const clientDependencies = [
	"../node_modules/systemjs/dist/s.js",
	// mithril is patched manually to remove some unused parts
	// "../node_modules/mithril/mithril.js",
	"../node_modules/mithril/stream/stream.js",
	// squire is patched manually to fix issuesr
	// "../node_modules/squire-rte/dist/squire-raw.mjs",
	"../node_modules/dompurify/dist/purify.js",
	{ src: "../node_modules/linkifyjs/dist/linkify.es.js", target: "linkify.js" },
	{ src: "../node_modules/linkify-html/dist/linkify-html.es.js", target: "linkify-html.js" },
	"../node_modules/luxon/build/es6/luxon.js",
	{ src: "../node_modules/cborg/cborg.js", target: "cborg.js", rollup: true },
	{ src: "../node_modules/qrcode-svg/lib/qrcode.js", target: "qrcode.js", rollup: true },
	{ src: "../node_modules/jszip/dist/jszip.js", target: "jszip.js", rollup: true },
	{ src: "../node_modules/electron-updater/out/main.js", target: "electron-updater.mjs", rollup: rollDesktopDep },
	{ src: "../node_modules/better-sqlite3/lib/index.js", target: "better-sqlite3.mjs", rollup: rollDesktopDep },
	{ src: "../node_modules/winreg/lib/registry.js", target: "winreg.mjs", rollup: rollDesktopDep },
	{ src: "../node_modules/undici/index.js", target: "undici.mjs", rollup: rollDesktopDep },
]

async function copyToLibs(files) {
	for (let srcFile of files) {
		let targetName = ""
		if (srcFile instanceof Object) {
			if (srcFile.rollup === true) {
				await rollWebDep(srcFile.src, srcFile.target)
				continue
			} else if (typeof srcFile.rollup === "function") {
				await srcFile.rollup(srcFile.src, srcFile.target)
				continue
			} else {
				targetName = srcFile.target
				srcFile = srcFile.src
			}
		} else {
			targetName = path.basename(srcFile)
		}
		await fs.copy(path.join(__dirname, srcFile), path.join(__dirname, "../libs/", targetName))
	}
}

/** Will bundle web app dependencies starting at {@param src} into a single file at {@param target}. */
async function rollWebDep(src, target) {
	const bundle = await rollup({ input: path.join(__dirname, src) })
	await bundle.write({ file: path.join(__dirname, "../libs", target) })
}

/**
 * rollup desktop dependencies with their dependencies into a single esm file
 *
 * specifically, electron-updater is importing some electron internals directly, so we made a comprehensive list of
 * exclusions to not roll up.
 */
async function rollDesktopDep(src, target) {
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
		],
		plugins: [
			nodeResolve({ preferBuiltins: true }),
			// @ts-ignore it's a weird default import/export issue
			commonjs({
				// better-sqlite3 uses dynamic require to load the binary.
				// if there is ever another dependency that uses dynamic require
				// to load any javascript, we should revisit this and make sure
				// it's still correct.
				ignoreDynamicRequires: true,
			}),
		],
	})
	await bundle.write({ file: path.join(__dirname, "../libs", target), format: "es" })
}
