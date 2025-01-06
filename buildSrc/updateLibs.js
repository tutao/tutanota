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

// make require() work inside esm module
const requireInteropBanner = `import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);`

export async function updateLibs() {
	await copyToLibs(clientDependencies)
}

/**
 * @typedef {"rollupWeb" | "rollupDesktop" | "copy"} BundlingStrategy
 * @typedef {{src: string, target: string, bundling: BundlingStrategy, banner?: string}} DependencyDescription
 * @type Array<DependencyDescription>
 */
const clientDependencies = [
	// mithril is patched manually to remove some unused parts
	// "../node_modules/mithril/mithril.js",
	{ src: "../node_modules/mithril/stream/stream.js", target: "stream.js", bundling: "copy" },
	// squire is patched manually to fix issuesr
	// "../node_modules/squire-rte/dist/squire-raw.mjs",
	{ src: "../node_modules/dompurify/dist/purify.js", target: "purify.js", bundling: "copy" },
	{ src: "../node_modules/linkifyjs/dist/linkify.es.js", target: "linkify.js", bundling: "copy" },
	{ src: "../node_modules/linkify-html/dist/linkify-html.es.js", target: "linkify-html.js", bundling: "copy" },
	{ src: "../node_modules/luxon/build/es6/luxon.js", target: "luxon.js", bundling: "copy" },
	{ src: "../node_modules/jszip/dist/jszip.js", target: "jszip.js", bundling: "rollupWeb" },
	{ src: "../node_modules/cborg/cborg.js", target: "cborg.js", bundling: "rollupWeb" },
	{ src: "../node_modules/qrcode-svg/lib/qrcode.js", target: "qrcode.js", bundling: "rollupWeb" },
	{ src: "../node_modules/electron-updater/out/main.js", target: "electron-updater.mjs", bundling: "rollupDesktop" },
	{ src: "../node_modules/better-sqlite3/lib/index.js", target: "better-sqlite3.mjs", bundling: "rollupDesktop", banner: requireInteropBanner },
	{ src: "../node_modules/winreg/lib/registry.js", target: "winreg.mjs", bundling: "rollupDesktop" },
	{ src: "../node_modules/undici/index.js", target: "undici.mjs", bundling: "rollupDesktop" },
]

/**
 * @param dependencies {Array<DependencyDescription>}>}
 * @return {Promise<void>}
 */
async function copyToLibs(dependencies) {
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
		],
		plugins: [
			nodeResolve({ preferBuiltins: true }),
			commonjs({
				// better-sqlite3 uses dynamic require to load the binary.
				// if there is ever another dependency that uses dynamic require
				// to load any javascript, we should revisit this and make sure
				// it's still correct.
				ignoreDynamicRequires: true,
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
