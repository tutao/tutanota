import fs from "fs-extra"
import {default as path, dirname} from "path"
import {fileURLToPath} from "url"
import * as LaunchHtml from "./LaunchHtml.js"
import * as env from "./env.js"
import {rollupDebugPlugins, writeNollupBundle} from "./RollupDebugConfig.js"
import nodeResolve from "@rollup/plugin-node-resolve"
import hmr from "nollup/lib/plugin-hmr.js"
import os from "os"
import {babelDesktopPlugins, bundleDependencyCheckPlugin} from "./RollupConfig.js"
import {nativeDepWorkaroundPlugin, pluginNativeLoader} from "./RollupPlugins.js"
import {spawn} from "child_process"
import flow_bin from "flow-bin"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.dirname(__dirname)

async function createHtml(env) {
	let jsFileName
	let htmlFileName
	switch (env.mode) {
		case "App":
			jsFileName = "index-app.js"
			htmlFileName = "index-app.html"
			break
		case "Browser":
			jsFileName = "index.js"
			htmlFileName = "index.html"
			break
		case "Desktop":
			jsFileName = "index-desktop.js"
			htmlFileName = "index-desktop.html"
	}
	const imports = [{src: 'polyfill.js'}, {src: jsFileName}]

	const template = `window.whitelabelCustomizations = null
window.env = ${JSON.stringify(env, null, 2)}
import('./app.js')`
	await _writeFile(`./build/${jsFileName}`, template)
	const html = await LaunchHtml.renderHtml(imports, env)
	await _writeFile(`./build/${htmlFileName}`, html)
}

function _writeFile(targetFile, content) {
	return fs.mkdirs(path.dirname(targetFile)).then(() => fs.writeFile(targetFile, content, 'utf-8'))
}

async function prepareAssets(stage, host, version) {
	let restUrl
	await Promise.all([
		await fs.emptyDir("build/images"),
		fs.copy(path.join(root, '/resources/favicon'), path.join(root, '/build/images')),
		fs.copy(path.join(root, '/resources/images/'), path.join(root, '/build/images')),
		fs.copy(path.join(root, '/resources/desktop-icons'), path.join(root, '/build/icons')),
		fs.copy(path.join(root, '/src/braintree.html'), path.join(root, 'build/braintree.html'))
	])
	if (stage === 'test') {
		restUrl = 'https://test.tutanota.com'
	} else if (stage === 'prod') {
		restUrl = 'https://mail.tutanota.com'
	} else if (stage === 'local') {
		restUrl = "http://" + os.hostname() + ":9000"
	} else { // host
		restUrl = host
	}

	// write empty file
	await fs.writeFile("build/polyfill.js", "")

	return Promise.all([
		createHtml(env.create(restUrl, version, "Browser")),
		createHtml(env.create(restUrl, version, "App")),
		createHtml(env.create(restUrl, version, "Desktop"))
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

export async function preBuild(log) {
	await runFlowChecks(log)
}

export async function postBuild(log) {

}

export async function build({desktop, stage, host}, {devServerPort, watchFolders}, log) {
	log("Building app")

	const {version} = JSON.parse(await fs.readFile("package.json", "utf8"))
	await prepareAssets(stage, host, version)
	const start = Date.now()
	const nollup = (await import('nollup')).default

	log("Bundling...")

	const bundle = await nollup({
		input: ["src/app.js", "src/api/worker/worker.js"],
		plugins: rollupDebugPlugins(path.resolve("."))
			.concat(devServerPort ? hmr({bundleId: '', hmrHost: `localhost:${devServerPort}`, verbose: true}) : [])
			.concat(debugModels())
			.concat(bundleDependencyCheckPlugin())
	})
	const generateBundle = async () => {
		log("Generating")
		const generateStart = Date.now()
		const result = await bundle.generate({
			format: "es", sourceMap: true, dir: "./build", chunkFileNames: "[name].js"
		})

		// Here we include polyfill first and then import worker
		// as output is esm simply importing file is enough to execute it
		await fs.promises.writeFile("build/worker-bootstrap.js", `importScripts("./polyfill.js")
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

	const desktopIconsPath = path.join(root, "/resources/desktop-icons")
	const packageJSON = (await import('./electron-package-json-template.js')).default({
		nameSuffix: "-debug",
		version,
		updateUrl: "http://localhost:9000/client/build",
		iconPath: path.join(desktopIconsPath, "logo-solo-red.png"),
		sign: false
	})
	await fs.copy(desktopIconsPath, "./build/desktop/resources/icons", {overwrite: true})
	const content = JSON.stringify(packageJSON, null, 2)

	await fs.createFile(path.join(root, "./build/package.json"))
	await fs.writeFile(path.join(root, "./build/package.json"), content, 'utf-8')

	const nollup = (await import('nollup')).default
	log("desktop main bundle")
	const nodePreBundle = await nollup({
		input: path.join(root, "src/desktop/DesktopMain.js"),
		plugins: [
			...rollupDebugPlugins(path.resolve("."), babelDesktopPlugins),
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

	/**
	 * the preload script is such a weird environment that trying to pipe it through flow, babel, rollup
	 * without anything breaking is not worth it for the 3 lines of code it contains,
	 * so it's just written in normal commonJS and copied over to be executed directly
	 */
	log("copying preload script")
	await fs.mkdir("build/desktop", {recursive: true})
	await fs.copyFile("src/desktop/preload.js", "build/desktop/preload.js")

	log("Bundled desktop client")
	return [nodeBundleWrapper]
}

function runFlowChecks(log) {
	log("Running flow checks")
	return new Promise((resolve, reject) => {
		const childProcess = spawn(flow_bin, ["--quiet"], {stdio: "pipe"})
			.on("exit", (code) => {
				if (code === 0) {
					log("Flow checks ok")
					resolve()
				} else {
					reject(new Error("Flow detected errors"))
				}
			})
		childProcess.on("error", reject)
		// capture any output from the flow process and forward it to the log() function
		childProcess.stdout.on("data", (data) => log(data))
		childProcess.stderr.on("data", (data) => log(data))
	})
}