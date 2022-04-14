import fs from "fs-extra"
import {default as path} from "path"
import {fileURLToPath} from "url"
import * as LaunchHtml from "./LaunchHtml.js"
import * as env from "./env.js"
import {rollupDebugPlugins} from "./RollupDebugConfig.js"
import nodeResolve from "@rollup/plugin-node-resolve"
import hmr from "nollup/lib/plugin-hmr.js"
import os from "os"
import {bundleDependencyCheckPlugin} from "./RollupConfig.js"
import {nativeDepWorkaroundPlugin, pluginNativeLoader} from "./RollupPlugins.js"
import {keytarNativePlugin, sqliteNativeBannerPlugin} from "./nativeLibraryRollupPlugin.js"
import {writeNollupBundle} from "./RollupUtils.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname.split(path.sep).slice(0, -1).join(path.sep)

async function createBootstrap(env) {
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
if (env.staticUrl == null && window.tutaoDefaultApiUrl) {
    // overriden by js dev server
    window.env.staticUrl = window.tutaoDefaultApiUrl
}
import('./app.js')`
	await _writeFile(`./build/${jsFileName}`, template)
	const html = await LaunchHtml.renderHtml(imports, env)
	await _writeFile(`./build/${htmlFileName}`, html)
}

function _writeFile(targetFile, content) {
	return fs.mkdirs(path.dirname(targetFile)).then(() => fs.writeFile(targetFile, content, 'utf-8'))
}

function getStaticUrl(stage, mode, host) {
	if (stage === "local" && mode === "Browser") {
		// We would like to use web app build for both JS server and actual server. For that we should avoid hardcoding URL as server
		// might be running as one of testing HTTPS domains. So instead we override URL when the app is served from JS server
		// (see DevServer).
		// This is only relevant for browser environment.
		return null
	} else if (stage === 'test') {
		return 'https://test.tutanota.com'
	} else if (stage === 'prod') {
		return 'https://mail.tutanota.com'
	} else if (stage === 'local') {
		return "http://" + os.hostname() + ":9000"
	} else { // host
		return host
	}
}

async function prepareAssets(stage, host, version) {
	await Promise.all([
		await fs.emptyDir(path.join(root, "build/images")),
		fs.copy(path.join(root, '/resources/favicon'), path.join(root, '/build/images')),
		fs.copy(path.join(root, '/resources/images/'), path.join(root, '/build/images')),
		fs.copy(path.join(root, '/resources/desktop-icons'), path.join(root, '/build/icons')),
		fs.copy(path.join(root, '/src/braintree.html'), path.join(root, 'build/braintree.html'))
	])

	// write empty file
	await fs.writeFile("build/polyfill.js", "")

	for (const mode of ["Browser", "App", "Desktop"]) {
		await createBootstrap(env.create({staticUrl: getStaticUrl(stage, mode, host), version, mode, dist: false}))
	}
}

export async function preBuild({}, {}, log) {
}

export async function postBuild({}, {}, log) {
}

async function bundleWeb(nollup, devServerPort, log, start) {
	const bundle = await nollup({
		input: ["src/app.ts", "src/api/worker/worker.ts"],
		plugins: [
			...rollupDebugPlugins(path.resolve("."), {outDir: "build"}),
			devServerPort ? hmr({bundleId: '', hmrHost: `localhost:${devServerPort}`, verbose: true}) : false,
			bundleDependencyCheckPlugin(),
			nodeResolve({preferBuiltins: true})
		]
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
	return {bundle, generate: generateBundle}
}

export async function build({desktop, stage, host}, {devServerPort, watchFolders}, log) {
	log("Building app")

	const {version} = JSON.parse(await fs.readFile("package.json", "utf8"))
	await prepareAssets(stage, host, version)
	const start = Date.now()
	const nollup = (await import('nollup')).default

	log("Bundling...")
	const webBundleWrapper = await bundleWeb(nollup, devServerPort, log, start)

	let desktopBundles
	if (desktop) {
		desktopBundles = await bundleDesktop(log, version)
	} else {
		desktopBundles = []
	}
	return [
		webBundleWrapper,
		...desktopBundles
	]
}

async function bundleDesktop(log, version) {
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
		input: path.join(root, "src/desktop/DesktopMain.ts"),
		plugins: [
			...rollupDebugPlugins(path.resolve("."), {outDir: "build/desktop"}),
			nativeDepWorkaroundPlugin(),
			env.preludeEnvPlugin(env.create({staticUrl: null, version, mode: "Desktop", dist: false})),
			sqliteNativeBannerPlugin(
				{
					environment: "electron",
					rootDir: root,
					dstPath: path.join(root, "build/native/better_sqlite3.node"),
					platform: process.platform,
				},
				log
			),
			keytarNativePlugin(
				{
					rootDir: root,
					platform: process.platform,
				},
				log,
			),
			nodeResolve({preferBuiltins: true}),
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
	 * the preload script is such a weird environment that trying to pipe it through typescript, nollup
	 * without anything breaking is not worth it for the 3 lines of code it contains,
	 * so it's just written in normal commonJS and copied over to be executed directly
	 */
	log("copying preload script")
	await fs.mkdir("build/desktop", {recursive: true})
	await fs.copyFile("src/desktop/preload.js", "build/desktop/preload.js")
	await fs.copyFile("src/desktop/preload-webdialog.js", "build/desktop/preload-webdialog.js")

	log("Bundled desktop client")
	return [nodeBundleWrapper]
}