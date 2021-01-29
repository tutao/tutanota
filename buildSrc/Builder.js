import fs from "fs-extra"
import {default as path, dirname} from "path"
import {fileURLToPath} from "url"
import * as LaunchHtml from "./LaunchHtml.js"
import * as env from "./env.js"
import {rollupDebugPlugins, writeNollupBundle} from "./RollupDebugConfig.js"
import nodeResolve from "@rollup/plugin-node-resolve"
import hmr from "nollup/lib/plugin-hmr.js"
import os from "os"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.dirname(__dirname)

async function createHtml(env, watch) {
	let jsFileName
	let htmlFileName
	switch (env.mode) {
		case "App":
			jsFileName = "bootstrap-app.js"
			htmlFileName = "index-app.html"
			break
		case "Browser":
			jsFileName = "bootstrap.js"
			htmlFileName = "index.html"
			break
		case "Desktop":
			jsFileName = "bootstrap-desktop.js"
			htmlFileName = "index-desktop.html"
	}
	const imports = [{src: 'polyfill.js'}, {src: jsFileName}]
	const template = `window.whitelabelCustomizations = null
window.env = ${JSON.stringify(env, null, 2)}
Promise.config({
    longStackTraces: false,
    warnings: false
})
import('./app.js')
	`
	await _writeFile(`./build/${jsFileName}`, template)
	const html = await LaunchHtml.renderHtml(imports, env)
	await _writeFile(`./build/${htmlFileName}`, html)
}

function _writeFile(targetFile, content) {
	return fs.mkdirs(path.dirname(targetFile)).then(() => fs.writeFile(targetFile, content, 'utf-8'))
}

async function prepareAssets(watch, stage, host, version) {
	let restUrl
	await Promise.all([
		await fs.emptyDir("build/images"),
		fs.copy(path.join(root, '/resources/favicon'), path.join(root, '/build/images')),
		fs.copy(path.join(root, '/resources/images/'), path.join(root, '/build/images')),
		fs.copy(path.join(root, '/src/braintree.html'), path.join(root, 'build/braintree.html'))
	])
	if (stage === 'test') {
		restUrl = 'https://test.tutanota.com'
	} else if (stage === 'prod') {
		restUrl = 'https://mail.tutanota.com'
	} else if (stage === 'local') {
		restUrl = "http://" + os.hostname().split(".")[0] + ":9000"
	} else { // host
		restUrl = host
	}

	await fs.copyFile("libs/bluebird.js", "build/polyfill.js")


	return Promise.all([
		createHtml(env.create((stage === 'local') ? null : restUrl, version, "Browser"), watch),
		createHtml(env.create(restUrl, version, "App"), watch),
		createHtml(env.create(restUrl, version, "Desktop"), watch)
	])
}

/**
 * Use model map with all the TypeModels inlined so that worker doesn't have to async import them
 * which doesn't work in non-Blink browsers at the moment.
 * This is not ideal as nollup puts them into every chunk which uses modelMap but it'll do for now.
 */
function debugModels() {
	return {
		name: "debug-models",
		resolveId(id) {
			const imports = {
				"../entities/base/baseModelMap": "src/api/entities/base/baseModelMapDebug.js",
				"../entities/sys/sysModelMap": "src/api/entities/sys/sysModelMapDebug.js",
				"../entities/tutanota/tutanotaModelMap": "src/api/entities/tutanota/tutanotaModelMapDebug.js",
				"../entities/monitor/monitorModelMap": "src/api/entities/monitor/monitorModelMapDebug.js",
				"../entities/accounting/accountingModelMap": "src/api/entities/accounting/accountingModelMapDebug.js",
			}
			return imports[id]
		}
	}
}

export async function build({watch, desktop, stage, host}, log) {
	const {version} = JSON.parse(await fs.readFile("package.json", "utf8"))
	await prepareAssets(watch, stage, host, version)
	const start = Date.now()
	const nollup = (await import('nollup')).default

	log("Bundling...")

	const bundle = await nollup({
		input: ["src/app.js", "src/api/worker/worker.js"],
		plugins: rollupDebugPlugins(path.resolve("."))
			.concat(watch ? hmr({bundleId: '', hmrHost: "localhost:9001", verbose: true}) : [])
			.concat(debugModels())
	})
	const generateBundle = async () => {
		log("Generating")
		const generateStart = Date.now()
		const result = await bundle.generate({
			format: "es", sourceMap: true, dir: "./build", chunkFileNames: "[name].js"
		})

		// Here we include polyfill first, then configure promise (so that rest is not slow) and then import worker
		// as output is esm simply importing file is enough to execute it
		await fs.promises.writeFile("build/worker-bootstrap.js", `importScripts("./polyfill.js")
self.Promise = Promise.config({
\tlongStackTraces: false,
\twarnings: false
})
importScripts("./worker.js")
`)

		log("Generated in", Date.now() - generateStart)
		// result.stats && log("Generated in", result.stats.time, result.stats)

		log("Writing")
		const writeStart = Date.now()
		await writeNollupBundle(result, log)
		log("Wrote in", Date.now() - writeStart)
		return result
	}

	log("Bundled in", Date.now() - start)

	let desktopBundles
	if (desktop) {
		desktopBundles = await buildAndStartDesktop(log, version)
	} else {
		desktopBundles = []
	}
	return [{bundle, generate: generateBundle}, ...desktopBundles]
}

async function buildAndStartDesktop(log, version) {
	log("Building desktop client...")

	const packageJSON = (await import('./electron-package-json-template.js')).default({
		nameSuffix: "-debug",
		version,
		updateUrl: "http://localhost:9000",
		iconPath: path.join(root, "/resources/desktop-icons/logo-solo-red.png"),
		sign: false
	})
	const content = JSON.stringify(packageJSON, null, 2)

	await fs.createFile(path.join(root, "./build/package.json"))
	await fs.writeFile(path.join(root, "./build/package.json"), content, 'utf-8')

	const nollup = (await import('nollup')).default
	log("desktop main bundle")
	const nodePreBundle = await nollup({
		// Preload is technically separate but it doesn't import anything from the desktop anyway so we can bundle it together.
		input: path.join(root, "src/desktop/DesktopMain.js"),
		plugins: [
			...rollupDebugPlugins(path.resolve(".")),
			nativeDepWorkaroundPlugin(),
			pluginNativeLoader(),
			nodeResolve({preferBuiltins: true}),
			env.preludeEnvPlugin(env.create(null, version, "Desktop", false))
		],
	})
	const nodeBundleWrapper = {
		bundle: nodePreBundle,
		async generate() {
			log("generating main desktop bundle")
			// Electron uses commonjs imports. We could wrap it in our own commonjs module which dynamically imports the rest with import() but
			// it's not supported inside node 12 without --experimental-node-modules.
			const nodeBundle = await nodePreBundle.generate({
				format: "cjs",
				sourceMap: true,
				dir: "./build/desktop",
				chunkFileNames: "[name].js"
			})
			await writeNollupBundle(nodeBundle, log, "build/desktop")
		}
	}

	log("desktop preload bundle")
	const preloadPreBundle = await nollup({
		// Preload is technically separate but it doesn't import anything from the desktop anyway so we can bundle it together.
		input: path.join(root, "src/desktop/preload.js"),
		plugins: [
			...rollupDebugPlugins(path.resolve(".")),
			{
				name: "dynamicRequire",
				banner() {
					// see preload.js for explanation
					return "const dynamicRequire = require"
				},
			}
		],
	})
	const preloadBundleWrapper = {
		bundle: preloadPreBundle,
		async generate() {
			log("generating preload bundle")
			// Electron uses commonjs imports. We could wrap it in our own commonjs module which dynamically imports the rest with import() but
			// it's not supported inside node 12 without --experimental-node-modules.
			const preloadBundle = await preloadPreBundle.generate({
				format: "iife",
				sourceMap: true,
				dir: "./build/desktop",
				chunkFileNames: "[name].js",
			})
			await writeNollupBundle(preloadBundle, log, "build/desktop")
		}
	}

	log("Bundled desktop client")
	return [nodeBundleWrapper, preloadBundleWrapper]
}

export function nativeDepWorkaroundPlugin() {
	return {
		name: "native-dep-workaround",
		resolveId(id) {
			// It's included in the build by electron builder, consider it external
			if (id === "electron") {
				return false
			}
			// There are issues with packaging it so we include it as unprocessed cjs. It doesn't tree-shake well anyway.
			if (id === "electron-updater") {
				return false
			}
			// We currently have an import in Rsa.js which we don't want in Desktop as it pulls the whole worker with it
			if (id.endsWith("RsaApp")) {
				return false
			}
		}
	}
}

/**
 * This plugin loads native node module (.node extension).
 * This is not general enough yet, it only works in commonjs and it doesn't use ROLLUP_ASSET_URL.
 * This will also not work with async imports.
 *
 * Important! Make sure that requireReturnsDefault for commonjs plugin is set to `true` or `"preferred"` if .node module is part of
 * commonjs code.
 */
export function pluginNativeLoader() {
	return {
		name: "native-loader",
		async load(id) {
			if (id.endsWith(".node")) {
				const name = path.basename(id)
				const content = await fs.promises.readFile(id)
				this.emitFile({
					type: 'asset',
					name,
					fileName: name,
					source: content,
				})
				return `
				const nativeModule = require('./${name}')
				export default nativeModule`
			}
		},
	}
}