/**
 * Copies all currently used libraries from node_modules into libs.
 *
 * We do this to be able to audit changes in the libraries and not rely on npm for checksums.
 */
import fs from "node:fs/promises"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { rollup } from "rollup"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import child_process from "node:child_process"
import { promisify } from "node:util"
import alias from "@rollup/plugin-alias"

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function updateLibs() {
	await copyToLibs(clientDependencies)
}

/**
 * Should correspond to {@link import("./RollupConfig").dependencyMap}
 *
 * @typedef {"rollupWeb" | "rollupTF" | "rollupDesktop" | "copy"} BundlingStrategy
 * @typedef {{src: string, target: string, bundling: BundlingStrategy, banner?: string, patch?: string}} DependencyDescription
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
	{ src: "../node_modules/@fingerprintjs/botd/dist/botd.esm.js", target: "botd.mjs", bundling: "rollupWeb", patch: "./libs/botd.patch" },
	{ src: "../src/mail-app/workerUtils/spamClassification/tensorflow-custom.js", target: "tensorflow.js", bundling: "rollupTF" },
]

/** Run special patches after bundling */
async function applyCustomPatches() {
	await patchUndici()
	await patchTensorflow()
}

async function patchUndici() {
	// Patch undici by looking for every export into the undici namespace and re-adding it as a named export.
	// This should probably be done via a rollup plugin (in `transform`) instead.
	console.log("updateLibs: applying a patch to undici")
	const undiciPath = path.join(__dirname, "../libs/undici.mjs")
	let replaced = await fs.readFile(undiciPath, { encoding: "utf-8" })
	replaced += `
//
// TUTAO PATCH: esm exports
//
`
	const exports = [...replaced.matchAll(/\s+module\.exports\.([a-zA-Z]+)\s+=/g)].map(([_, exportName]) => {
		return `const __export_${exportName} = undici.exports.${exportName};
export { __export_${exportName} as ${exportName} }`
	})

	replaced += exports.join("\n")
	await fs.writeFile(undiciPath, replaced, { encoding: "utf-8" })
}

async function patchTensorflow() {
	// strip comments
	let str = await fs.readFile("libs/tensorflow.js", { encoding: "utf-8" })
	str = str.replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*/g, "")
	await fs.writeFile("libs/tensorflow-stripped.js", str)
}

/**
 * applies a git patch file that was created as such:
 * 1. get the unpatched version of whatever library you want to add / change
 * 2. make a commit with the changes that you want to make
 * 3. format the patch by running:
 *    git format-patch -k --stdout HEAD~1..HEAD > ./libs/changes.patch
 * 4. revert the commit by running:
 *    git reset --hard HEAD~1
 * 5. commit the generated ./libs.changes file
 */
async function applyGitPatch(patchFile) {
	if (process.platform === "win32") return
	const exec = promisify(child_process.exec)
	console.log(`updateLibs: applying a patch to ${patchFile}`)
	await exec(`git apply ${patchFile}`)
}

/**
 * @param dependencies {Array<DependencyDescription>}>}
 * @return {Promise<void>}
 */
async function copyToLibs(dependencies) {
	for (let { bundling, src, target, banner, patch } of dependencies) {
		switch (bundling) {
			case "copy":
				await fs.copyFile(path.join(__dirname, src), path.join(__dirname, "../libs/", target))
				break
			case "rollupWeb":
				await rollWebDep(src, target, banner)
				break
			case "rollupTF":
				await rollupTensorFlow(src, target, banner)
				break
			case "rollupDesktop":
				await rollDesktopDep(src, target, banner)
				break
			default:
				throw new Error(`Unknown bundling strategy: ${bundling}`)
		}

		if (patch != null) {
			await applyGitPatch(patch)
		}
	}
	await applyCustomPatches()
}

/**
 * Will bundle web app dependencies starting at {@param src} into a single file at {@param target}.
 * @type RollupFn
 */
async function rollWebDep(src, target, banner) {
	const bundle = await rollup({ input: path.join(__dirname, src), plugins: [nodeResolve()] })
	await bundle.write({ file: path.join(__dirname, "../libs", target), banner })
}

const logResolvePlugin = {
	name: "log-resolve",
	resolveId(source, importer) {
		console.log(`Resolving: source='${source}', importer='${importer}'`)
		return null
	},
}

async function rollupTensorFlow(src, target, banner) {
	const bundle = await rollup({
		input: path.join(__dirname, src),
		treeshake: {
			moduleSideEffects: false,
			preset: "smallest",
		},
		plugins: [
			alias({
				entries: [
					{
						find: /\.\/http/,
						replacement: path.resolve(__dirname, "../libs/tensorflow-http-stub.js"),
					},
					{
						find: /\.\/platforms\/.*/,
						replacement: path.resolve(__dirname, "../libs/tensorflow-platform-stub.js"),
					},
				],
			}),
			// logResolvePlugin,
			nodeResolve(),
			commonjs(),
		],
		output: {
			format: "esm",
		},
	})
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
		banner,
	})
}
