/**
 * Script to build and publish release versions of the app.
 *
 * <h2>Bundling</h2>
 *
 * Bundling is manual. Rollup makes no attempt to optimize chunk sizes anymore and we can do it much better manually anyway because we
 * know what is needed together.
 *
 * Unfortunately manual bundling is "infectious" in a sense that if you manually put module in a chunk all its dependencies will also be
 * put in that chunk unless they are sorted into another manual chunk. Ideally this would be semi-automatic with directory-based chunks.
 */
import options from "commander"
import fs from "fs-extra"
import * as env from "./buildSrc/env.js"
import {renderHtml} from "./buildSrc/LaunchHtml.js"
import {spawn, spawnSync} from "child_process"
import path, {dirname} from "path"
import {fetchDictionaries} from './buildSrc/DictionaryFetcher.js'
import os from "os"
import {rollup} from "rollup"
import {babelPlugins, bundleDependencyCheckPlugin, getChunkName, resolveLibs} from "./buildSrc/RollupConfig.js"
import {terser} from "rollup-plugin-terser"
import pluginBabel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import {fileURLToPath} from "url"
import nodeResolve from "@rollup/plugin-node-resolve"
import {visualizer} from "rollup-plugin-visualizer"
import glob from "glob"

const {babel} = pluginBabel
let start = Date.now()

const __dirname = dirname(fileURLToPath(import.meta.url))

// We use terser for minimifaction but we don't use nameCache because it does not work.
// It does not work because there's no top-level code besides invocations of System.register and non-top-level code is not put into cache
// which looks like a problem e.g. for accessing fields.

options
	.usage('[options] [test|prod|local|release|host <url>], "release" is default')
	.description(`main build tool for distributable tutanota artifacts

the following environment variables are useful when developing:
DEBUG_SIGN\t\tpath to a folder containing a self-signed certificate for signing the desktop client. More Info in Wiki -> Desktop Updater Test & Development
`)
	.arguments('[stage] [host]')
	.option('-e, --existing', 'Use existing prebuilt Webapp files in /build/dist/')
	.option('-w --win', 'Build desktop client for windows')
	.option('-l --linux', 'Build desktop client for linux')
	.option('-m --mac', 'Build desktop client for mac')
	.option('-d, --deb', 'Build .deb package. Requires -wlm to be set or installers to be present')
	.option('-p, --publish', 'Git tag and upload package, only allowed in release stage. Implies -d.')
	.option('--custom-desktop-release', "use if manually building desktop client from source. doesn't install auto updates, but may still notify about new releases.")
	.option('--disable-minify', "disable minification")
	.option('--unpacked', "don't pack the app into an installer")
	.option('--get-dicts', "download the current spellcheck dictionaries from github to the build dir.")
	.option('--out-dir <outDir>', "where to copy the client",)
	.action((stage, host) => {
		if (!["test", "prod", "local", "host", "release", undefined].includes(stage)
			|| (stage !== "host" && host)
			|| (stage === "host" && !host)
			|| stage !== "release" && options.publish) {
			options.outputHelp()
			process.exit(1)
		}
		options.stage = stage || "release"
		options.host = host
		options.deb = options.deb || options.publish
		options.desktop = {
			win32: options.win ? [] : undefined,
			linux: options.linux ? [] : undefined,
			darwin: options.mac ? [] : undefined
		}

		if (!Object.values(options.desktop).some(Boolean)) {
			if (!!options.customDesktopRelease) {
				// no platform flags given, but build desktop for
				// current platform if customDesktopBuild flag is set.
				options.desktop = {
					win32: process.platform === "win32" ? [] : undefined,
					linux: process.platform === "linux" ? [] : undefined,
					darwin: process.platform === "darwin" ? [] : undefined
				}
			} else {
				options.desktop = undefined
			}
		}
	})
	.parse(process.argv)

function doSignDesktopClients() {
	return options.deb || options.publish || process.env.DEBUG_SIGN
}

if (process.env.DEBUG_SIGN && !fs.existsSync(path.join(process.env.DEBUG_SIGN, "test.p12"))) {
	options.outputHelp(a => "ERROR:\nPlease make sure your DEBUG_SIGN test certificate authority is set up properly!\n\n" + a)
	process.exit(1)
}

const MINIFY = options.disableMinify !== true
if (!MINIFY) {
	console.warn("Minification is disabled")
}

doBuild().catch(e => {
	console.error(e)
	process.exit(1)
})

async function doBuild() {
	try {
		const flow = (await import("flow-bin")).default
		spawn(flow, {stdio: "inherit"})
	} catch (e) {
		console.warn("Flow executable was not found, it is either F-Droid build or you need to run npm ci")
	}
	try {

		const {version, devDependencies} = JSON.parse(await fs.readFile("package.json", "utf8"))
		const electronVersion = devDependencies.electron

		const debs = {
			webApp: `tutanota_${version}_amd64.deb`,
			desktop: `tutanota-desktop_${version}_amd64.deb`,
			desktopTest: `tutanota-desktop-test_${version}_amd64.deb`,
			// the dicts are bound to an electron release, so we use that version number.
			dict: `tutanota-desktop-dicts_${electronVersion}_amd64.deb`
		}

		await buildWebapp(version)
		if (options.desktop) {
			await buildDesktopClient(version)
		}

		// Any existing desktop installers will be signed
		await signDesktopClients()

		if (options.getDicts) {
			await getDictionaries(electronVersion)
		}
		if (options.deb) {
			await packageDeb(version, debs, electronVersion)
		}
		if (options.publish) {
			await publish(version, debs, electronVersion)
		}
		const now = new Date(Date.now()).toTimeString().substr(0, 5)
		console.log(`\nBuild time: ${measure()}s (${now})`)
	} catch (e) {
		console.error("\nBuild error:", e)
		process.exit(1)
	}
}

function measure() {
	return (Date.now() - start) / 1000
}

async function clean() {
	await fs.emptyDir("build")
}

async function buildWebapp(version) {
	if (options.existing) {
		console.log("Found existing option (-e). Skipping Webapp build.")
		return
	}
	console.log("started cleaning", measure())
	await clean()

	console.log("bundling polyfill", measure())
	const polyfillBundle = await rollup({
		input: ["src/polyfill.js"],
		plugins: [
			babel({
				plugins: babelPlugins,
				babelHelpers: "bundled",
			}),
			MINIFY && terser(),
			// nodeResolve is only for core-js and oxmsg.
			{
				name: "append-libs",
				resolveId(id) {
					if (id === "systemjs") {
						return path.resolve("libs/s.js")
					}
				},
			},
			nodeResolve(),
			commonjs(),
		],
	})
	await polyfillBundle.write({
		sourcemap: false,
		format: "iife",
		file: "build/dist/polyfill.js"
	})

	console.log("started copying images", measure())
	await fs.copy(path.join(__dirname, '/resources/images'), path.join(__dirname, '/build/dist/images'))
	await fs.copy(path.join(__dirname, '/resources/favicon'), path.join(__dirname, 'build/dist/images'))
	await fs.copy(path.join(__dirname, '/src/braintree.html'), path.join(__dirname, '/build/dist/braintree.html'))

	console.log("started bundling", measure())
	const bundle = await rollup({
		input: ["src/app.js", "src/api/worker/worker.js"],
		preserveEntrySignatures: false,
		perf: true,
		plugins: [
			babel({
				plugins: babelPlugins,
				babelHelpers: "bundled",
			}),
			resolveLibs(),
			commonjs({
				exclude: "src/**",
			}),
			MINIFY && terser(),
			analyzer(),
			visualizer({filename: "build/stats.html", gzipSize: true}),
			bundleDependencyCheckPlugin(),
			nodeResolve(),
		],
	})
	console.log("bundling timings: ")
	for (let [k, v] of Object.entries(bundle.getTimings())) {
		console.log(k, v[0])
	}
	console.log("started writing bundles", measure())
	const output = await bundle.write({
		sourcemap: true,
		format: "system",
		dir: "build/dist",
		manualChunks(id, {getModuleInfo, getModuleIds}) {
			return getChunkName(id, {getModuleInfo})
		},
		chunkFileNames: (chunkInfo) => {
			return "[name]-[hash].js"
		}
	})
	const chunks = output.output.map(c => c.fileName)

	// we have to use System.import here because bootstrap is not executed until we actually import()
	// unlike nollup+es format where it just runs on being loaded like you expect
	await fs.promises.writeFile("build/dist/worker-bootstrap.js", `importScripts("./polyfill.js")
const importPromise = System.import("./worker.js")
self.onmessage = function (msg) {
	importPromise.then(function () {
		self.onmessage(msg)
	})
} 
`)


	let restUrl
	if (options.stage === 'test') {
		restUrl = 'https://test.tutanota.com'
	} else if (options.stage === 'prod') {
		restUrl = 'https://mail.tutanota.com'
	} else if (options.stage === 'local') {
		restUrl = "http://" + os.hostname() + ":9000"
	} else if (options.stage === 'release') {
		restUrl = undefined
	} else { // host
		restUrl = options.host
	}
	await createHtml(
		env.create({
			staticUrl: (options.stage === 'release' || options.stage === 'local') ? null : restUrl,
			version,
			mode: "Browser",
			dist: true
		}),
	)
	if (options.stage !== "release") {
		await createHtml(env.create({staticUrl: restUrl, version, mode: "App", dist: true}))
	}

	await bundleServiceWorker(chunks, version)
}

async function buildDesktopClient(version) {
	const {buildDesktop} = await import("./buildSrc/DesktopBuilder.js")
	const desktopBaseOpts = {
		dirname: __dirname,
		version,
		targets: options.desktop,
		updateUrl: options.customDesktopRelease
			? ""
			: "https://mail.tutanota.com/desktop",
		nameSuffix: "",
		notarize: !options.customDesktopRelease,
		outDir: options.outDir,
		unpacked: options.unpacked
	}

	if (options.stage === "release") {
		await createHtml(env.create({staticUrl: "https://mail.tutanota.com", version, mode: "Desktop", dist: true}))
		await buildDesktop(desktopBaseOpts)
		if (!options.customDesktopRelease) { // don't build the test version for manual/custom builds
			const desktopTestOpts = Object.assign({}, desktopBaseOpts, {
				updateUrl: "https://test.tutanota.com/desktop",
				nameSuffix: "-test",
				// Do not notarize test build
				notarize: false
			})
			await createHtml(env.create({staticUrl: "https://test.tutanota.com", version, mode: "Desktop", dist: true}))
			await buildDesktop(desktopTestOpts)
		}
	} else if (options.stage === "local") {
		// this is the only way to contact the local server from localhost, a VM and
		// from other machines in the LAN with the same url.
		const addr = Object
			.values(os.networkInterfaces())
			.map(net => net.find(a => a.family === "IPv4"))
			.filter(Boolean)
			.filter(net => !net.internal && net.address.startsWith('192.168.'))[0].address
		const desktopLocalOpts = Object.assign({}, desktopBaseOpts, {
			version,
			updateUrl: `http://${addr}:9000/client/build/desktop-snapshot`,
			nameSuffix: "-snapshot",
			notarize: false
		})
		await createHtml(env.create({staticUrl: `http://${addr}:9000`, version, mode: "Desktop", dist: true}))
		await buildDesktop(desktopLocalOpts)
	} else if (options.stage === "test") {
		const desktopTestOpts = Object.assign({}, desktopBaseOpts, {
			updateUrl: "https://test.tutanota.com/desktop",
			nameSuffix: "-test",
			notarize: false
		})
		await createHtml(env.create({staticUrl: "https://test.tutanota.com", version, mode: "Desktop", dist: true}))
		await buildDesktop(desktopTestOpts)
	} else if (options.stage === "prod") {
		const desktopProdOpts = Object.assign({}, desktopBaseOpts, {
			version,
			updateUrl: "http://localhost:9000/desktop",
			notarize: false
		})
		await createHtml(env.create({staticUrl: "https://mail.tutanota.com", version, mode: "Desktop", dist: true}))
		await buildDesktop(desktopProdOpts)
	} else { // stage = host
		const desktopHostOpts = Object.assign({}, desktopBaseOpts, {
			version,
			updateUrl: "http://localhost:9000/desktop-snapshot",
			nameSuffix: "-snapshot",
			notarize: false
		})
		await createHtml(env.create({staticUrl: options.host, version, mode: "Desktop", dist: true}))
		await buildDesktop(desktopHostOpts)
	}
}

async function getDictionaries(electronVersion) {
	const baseTarget = path.join((options.outDir || 'build/dist'), '..')
	const targets = options.deb
		? [baseTarget]
		: glob.sync(path.join(baseTarget, 'desktop*'))
	return fetchDictionaries(electronVersion, targets.map(d => path.join(d, "dictionaries")))
}

async function bundleServiceWorker(bundles, version) {
	const customDomainFileExclusions = ["index.html", "index.js"]
	const filesToCache = ["index.js", "index.html", "polyfill.js", "worker-bootstrap.js"]
		// we always include English
		// we still cache native-common even though we don't need it because worker has to statically depend on it
		.concat(bundles.filter(it => it.startsWith("translation-en") ||
			!it.startsWith("translation") && !it.startsWith("native-main") && !it.startsWith("SearchInPageOverlay")))
		.concat(["images/logo-favicon.png", "images/logo-favicon-152.png", "images/logo-favicon-196.png", "images/ionicons.ttf"])
	const swBundle = await rollup({
		input: ["src/serviceworker/sw.js"],
		plugins: [
			babel({
				plugins: babelPlugins,
				babelHelpers: "bundled",
			}),
			MINIFY && terser(),
			{
				name: "sw-banner",
				banner() {
					return `function filesToCache() { return ${JSON.stringify(filesToCache)} }
					function version() { return "${version}" }
					function customDomainCacheExclusions() { return ${JSON.stringify(customDomainFileExclusions)} }`
				}
			}
		],
	})
	await swBundle.write({
		sourcemap: true,
		format: "iife",
		file: "build/dist/sw.js"
	})
}

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
	// We need to import bluebird early as it Promise must be replaced before any of our code is executed
	const imports = [{src: "polyfill.js"}, {src: jsFileName}]
	const indexTemplate = await fs.readFile("./buildSrc/index.template.js", "utf8")

	const index = `window.whitelabelCustomizations = null
window.env = ${JSON.stringify(env, null, 2)}
${indexTemplate}`
	return Promise.all([
		_writeFile(`./build/dist/${jsFileName}`, index),
		renderHtml(imports, env).then((content) => _writeFile(`./build/dist/${htmlFileName}`, content))
	])
}

async function _writeFile(targetFile, content) {
	await fs.mkdirs(path.dirname(targetFile))
	await fs.writeFile(targetFile, content, 'utf-8')
}

async function signDesktopClients() {
	const MAC_ZIP_SIGNATURE_FILE = 'mac-sig-zip.bin'
	const MAC_DMG_SIGNATURE_FILE = 'mac-sig-dmg.bin'
	const WIN_SIGNATURE_FILE = 'win-sig.bin'
	const LINUX_SIGNATURE_FILE = 'linux-sig.bin'

	const MAC_YML_FILE = 'latest-mac.yml'
	const WIN_YML_FILE = 'latest.yml'
	const LINUX_YML_FILE = 'latest-linux.yml'


	if (doSignDesktopClients()) {
		// We import `sign` asynchronously because it uses node-forge, which is unavailable during the f-droid build and causes it to fail
		// For some reason we call signDesktopClients always in the build process.
		const {sign} = await import("./buildSrc/installerSigner.js")
		const signIfExists = async (fileName, sigName, ymlName) => {
			if (await fileExists(fileName)) {
				console.log("signing", fileName)
				sign(fileName, sigName, ymlName)
			}
		}

		await signIfExists('./build/desktop/tutanota-desktop-mac.zip', MAC_ZIP_SIGNATURE_FILE, MAC_YML_FILE)
		await signIfExists('./build/desktop/tutanota-desktop-mac.dmg', MAC_DMG_SIGNATURE_FILE, null)
		await signIfExists('./build/desktop/tutanota-desktop-win.exe', WIN_SIGNATURE_FILE, WIN_YML_FILE)
		await signIfExists('./build/desktop/tutanota-desktop-linux.AppImage', LINUX_SIGNATURE_FILE, LINUX_YML_FILE)

		await signIfExists('./build/desktop-test/tutanota-desktop-test-mac.zip', MAC_ZIP_SIGNATURE_FILE, MAC_YML_FILE)
		await signIfExists('./build/desktop-test/tutanota-desktop-test-mac.dmg', MAC_DMG_SIGNATURE_FILE, null)
		await signIfExists('./build/desktop-test/tutanota-desktop-test-win.exe', WIN_SIGNATURE_FILE, WIN_YML_FILE)
		await signIfExists('./build/desktop-test/tutanota-desktop-test-linux.AppImage', LINUX_SIGNATURE_FILE, LINUX_YML_FILE)

		await signIfExists('./build/desktop-snapshot/tutanota-desktop-snapshot-mac.zip', MAC_ZIP_SIGNATURE_FILE, MAC_YML_FILE)
		await signIfExists('./build/desktop-snapshot/tutanota-desktop-snapshot-mac.dmg', MAC_DMG_SIGNATURE_FILE, null)
		await signIfExists('./build/desktop-snapshot/tutanota-desktop-snapshot-win.exe', WIN_SIGNATURE_FILE, WIN_YML_FILE)
		await signIfExists('./build/desktop-snapshot/tutanota-desktop-snapshot-linux.AppImage', LINUX_SIGNATURE_FILE, LINUX_YML_FILE)
	}
}

function packageDeb(version, debs, electronVersion) {
	// overwrite output, source=dir target=deb, set owner
	const commonArgs = `-f -s dir -t deb --deb-user tutadb --deb-group tutadb`

	const target = `/opt/tutanota`
	exitOnFail(spawnSync("/usr/bin/find", `. ( -name *.js -o -name *.html ) -exec gzip -fkv --best {} \;`.split(" "), {
		cwd: __dirname + '/build/dist',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	console.log("create " + debs.webApp)
	exitOnFail(spawnSync("/usr/local/bin/fpm", `${commonArgs} --after-install ../resources/scripts/after-install.sh -n tutanota -v ${version} dist/=${target}`.split(" "), {
		cwd: __dirname + '/build',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	if (options.stage === "release" || options.stage === "prod") {
		console.log("create " + debs.desktop)
		exitOnFail(spawnSync("/usr/local/bin/fpm", `${commonArgs} -n tutanota-desktop -v ${version} desktop/=${target}-desktop`.split(" "), {
			cwd: __dirname + '/build',
			stdio: [process.stdin, process.stdout, process.stderr]
		}))
	}

	if (options.stage === "release" || options.stage === "test") {
		console.log("create " + debs.desktopTest)
		exitOnFail(spawnSync("/usr/local/bin/fpm", `${commonArgs} -n tutanota-desktop-test -v ${version} desktop-test/=${target}-desktop`.split(" "), {
			cwd: __dirname + '/build',
			stdio: [process.stdin, process.stdout, process.stderr]
		}))
	}

	if (["release", "test", "prod"].includes(options.stage) && options.getDicts) {
		console.log("create " + debs.dict)
		exitOnFail(spawnSync("/usr/local/bin/fpm", `${commonArgs} -n tutanota-desktop-dicts -v ${electronVersion} dictionaries/=${target}-desktop/dictionaries`.split(" "), {
			cwd: __dirname + "/build",
			stdio: [process.stdin, process.stdout, process.stderr]
		}))
	}

}

function publish(version, debs, electronVersion) {

	console.log("Create git tag and copy .deb")
	exitOnFail(spawnSync("/usr/bin/git", `tag -a tutanota-release-${version} -m ''`.split(" "), {
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	exitOnFail(spawnSync("/usr/bin/git", `push origin tutanota-release-${version}`.split(" "), {
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	exitOnFail(spawnSync("/bin/cp", `-f build/${debs.webApp} /opt/repository/tutanota/`.split(" "), {
		cwd: __dirname,
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	exitOnFail(spawnSync("/bin/cp", `-f build/${debs.desktop} /opt/repository/tutanota-desktop/`.split(" "), {
		cwd: __dirname,
		stdio: [process.stdin, process.stdout, process.stderr]
	}))
	exitOnFail(spawnSync("/bin/cp", `-f build/${debs.desktopTest} /opt/repository/tutanota-desktop-test/`.split(" "), {
		cwd: __dirname,
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	// copy appimage for dev_clients
	exitOnFail(spawnSync("/bin/cp", `-f build/desktop/tutanota-desktop-linux.AppImage /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage`.split(" "), {
		cwd: __dirname,
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	// user puppet needs to read the deb file from jetty
	exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota/${debs.webApp}`.split(" "), {
		cwd: __dirname + '/build/',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota-desktop/${debs.desktop}`.split(" "), {
		cwd: __dirname + '/build/',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))
	exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota-desktop-test/${debs.desktopTest}`.split(" "), {
		cwd: __dirname + '/build/',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))
	// in order to release this new version locally, execute:
	// mv /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage /opt/repository/dev_client/tutanota-desktop-linux.AppImage
	exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage`.split(" "), {
		cwd: __dirname + '/build/',
		stdio: [process.stdin, process.stdout, process.stderr]
	}))

	// copy spell checker dictionaries.
	if (options.getDicts) {
		exitOnFail(spawnSync("/bin/cp", `-f build/${deb.dict} /opt/repository/tutanota/`.split(" "), {
			cwd: __dirname,
			stdio: [process.stdin, process.stdout, process.stderr]
		}))
		exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota/${deb.dict}`.split(" "), {
			stdio: [process.stdin, process.stdout, process.stderr]
		}))
	}
}

function exitOnFail(result) {
	if (result.status !== 0) {
		throw new Error("error invoking process" + JSON.stringify(result))
	}
}

/**
 * A little plugin to:
 *  - Print out each chunk size and contents
 *  - Create a graph file with chunk dependencies.
 */
function analyzer() {
	return {
		name: "analyze",
		async generateBundle(outOpts, bundle) {
			const prefix = __dirname
			let buffer = "digraph G {\n"
			buffer += "edge [dir=back]\n"

			for (const [key, value] of Object.entries(bundle)) {
				if (key.startsWith("translation")) continue
				for (const dep of value.imports) {
					if (!dep.includes("translation")) {
						buffer += `"${dep}" -> "${key}"\n`
					}
				}


				console.log(key, "", value.code.length / 1024 + "K")
				for (const module of Object.keys(value.modules)) {
					if (module.includes("src/api/entities")) {
						continue
					}
					const moduleName = module.startsWith(prefix) ? module.substring(prefix.length) : module
					console.log("" + moduleName)
				}
			}

			buffer += "}\n"
			await fs.writeFile("build/bundles.dot", buffer)
		},
	}
}

async function fileExists(filePath) {
	return fs.stat(filePath)
	         .then(stats => stats.isFile())
	         .catch(() => false)
}
