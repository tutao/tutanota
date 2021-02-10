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
import Promise from "bluebird"
import fs from "fs-extra"
import * as env from "./buildSrc/env.js"
import {renderHtml} from "./buildSrc/LaunchHtml.js"
import {spawn, spawnSync} from "child_process"
import {sign} from "./buildSrc/installerSigner.js"
import path, {dirname} from "path"
import os from "os"
import {rollup} from "rollup"
import {bundleDependencyCheckPlugin, resolveLibs} from "./buildSrc/RollupConfig.js"
import {terser} from "rollup-plugin-terser"
import pluginBabel from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import {fileURLToPath} from "url"
import nodeResolve from "@rollup/plugin-node-resolve"
import visualizer from "rollup-plugin-visualizer"

const {babel} = pluginBabel
let start = Date.now()

const __dirname = dirname(fileURLToPath(import.meta.url))

// We use terser for minimifaction but we don't use nameCache because it does not work.
// It does not work because there's no top-level code besides invocations of System.register and non-top-level code is not put into cache
// which looks like a problem e.g. for accessing fields.

// change this to disable minification and name mangling.
// FIXME
const MINIFY = false

options
	.usage('[options] [test|prod|local|release|host <url>], "release" is default')
	.arguments('[stage] [host]')
	.option('-e, --existing', 'Use existing prebuilt Webapp files in /build/dist/')
	.option('-w --win', 'Build desktop client for windows')
	.option('-l --linux', 'Build desktop client for linux')
	.option('-m --mac', 'Build desktop client for mac')
	.option('-d, --deb', 'Build .deb package. Requires -wlm to be set or installers to be present')
	.option('-p, --publish', 'Git tag and upload package, only allowed in release stage. Implies -d.')
	.option('--custom-desktop-release', "use if manually building desktop client from source. doesn't install auto updates, but may still notify about new releases.")
	.option('--unpacked', "don't pack the app into an installer")
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
			win: options.win ? [] : undefined,
			linux: options.linux ? [] : undefined,
			mac: options.mac ? [] : undefined
		}

		options.desktop = Object.values(options.desktop).some(Boolean)
			? options.desktop
			: !!options.customDesktopRelease // no platform flags given, build desktop for current platform if customDesktopBuild flag is set.
				? {
					win: process.platform === "win32" ? [] : undefined,
					linux: process.platform === "linux" ? [] : undefined,
					mac: process.platform === "darwin" ? [] : undefined
				}
				: undefined
	})
	.parse(process.argv)

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

		const {version} = JSON.parse(await fs.readFile("package.json", "utf8"))
		await buildWebapp(version)
		await buildDesktopClient(version)
		await signDesktopClients()
		await packageDeb(version)
		await publish(version)
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
				plugins: [
					// Using Flow plugin and not preset to run before class-properties and avoid generating strange property code
					"@babel/plugin-transform-flow-strip-types",
					"@babel/plugin-proposal-class-properties",
					"@babel/plugin-syntax-dynamic-import",
					"@babel/plugin-transform-arrow-functions",
					"@babel/plugin-transform-classes",
					"@babel/plugin-transform-computed-properties",
					"@babel/plugin-transform-destructuring",
					"@babel/plugin-transform-for-of",
					"@babel/plugin-transform-parameters",
					"@babel/plugin-transform-shorthand-properties",
					"@babel/plugin-transform-spread",
					"@babel/plugin-transform-template-literals",
					"@babel/plugin-transform-block-scoping",
					"@babel/plugin-proposal-object-rest-spread",
				],
				babelHelpers: "bundled",
			}),
			MINIFY && terser(),
			// append-libs must be before nodeResolve so that we can resolve bluebird correctly.
			// nodeResolve is only for core-js.
			{
				name: "append-libs",
				resolveId(id) {
					if (id === "systemjs") {
						return path.resolve("libs/s.js")
					} else if (id === "bluebird") {
						return path.resolve("libs/bluebird.js")
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
				plugins: [
					// Using Flow plugin and not preset to run before class-properties and avoid generating strange property code
					"@babel/plugin-transform-flow-strip-types",
					"@babel/plugin-proposal-class-properties",
					"@babel/plugin-syntax-dynamic-import",
				],
				babelHelpers: "bundled",
			}),
			resolveLibs(),
			commonjs({
				exclude: "src/**",
			}),
			MINIFY && terser(),
			analyzer(),
			visualizer({filename: "build/stats.html", gzipSize: true}),
			bundleDependencyCheckPlugin()
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
			// See HACKING.md for rules
			const code = getModuleInfo(id).code
			if (code.includes("@bundleInto:common-min")) {
				return "common-min"
			} else if (code.includes("assertMainOrNodeBoot")) {
				// everything marked as assertMainOrNodeBoot goes into boot bundle right now
				// (which is getting merged into app.js)
				return "boot"
			} else if (id.includes("src/gui/date") ||
				id.includes("src/misc/DateParser") ||
				id.includes("luxon") ||
				id.includes("src/calendar/CalendarUtils") ||
				id.includes("src/calendar/CalendarInvites") ||
				id.includes("src/calendar/CalendarUpdateDistributor") ||
				id.includes("src/calendar/export")
			) {
				// luxon and everything that depends on it goes into date bundle
				return "date"
			} else if (id.includes("src/misc/HtmlSanitizer")) {
				return "sanitizer"
			} else if (id.includes("src/misc/Urlifier")) {
				return "urlifier"
			} else if (id.includes("src/gui/base") || id.includes("src/gui/nav")) {
				// these gui elements are used from everywhere
				return "gui-base"
			} else if (id.includes("src/native/main") || id.includes("SearchInPageOverlay")) {
				return "native-main"
			} else if (id.includes("src/mail/editor") ||
				id.includes("squire") ||
				id.includes("src/gui/editor") ||
				id.includes("src/mail/signature")
			) {
				// squire is most often used with mail editor and they are both not too big so we merge them
				return "mail-editor"
			} else if (
				id.includes("src/api/main") ||
				id.includes("src/mail/model") ||
				id.includes("src/contacts/model") ||
				id.includes("src/calendar/model") ||
				id.includes("src/search/model") ||
				id.includes("src/misc/ErrorHandlerImpl") ||
				id.includes("src/misc") ||
				id.includes("src/file") ||
				id.includes("src/gui")
			) {
				// Things which we always need for main thread anyway, at least currently
				return "main"
			} else if (id.includes("src/mail/view")) {
				return "mail-view"
			} else if (id.includes("src/native/worker")) {
				return "worker"
			} else if (id.includes("src/native/common")) {
				return "native-common"
			} else if (id.includes("src/search")) {
				return "search"
			} else if (id.includes("src/calendar/view")) {
				return "calendar-view"
			} else if (id.includes("src/contacts")) {
				return "contacts"
			} else if (id.includes("src/login/recover") || id.includes("src/support") || id.includes("src/login/contactform")) {
				// Collection of small UI components which are used not too often
				// Perhaps contact form should be separate
				// Recover things depends on HtmlEditor which we don't want to load on each login
				return "ui-extra"
			} else if (id.includes("src/login")) {
				return "login"
			} else if (id.includes("src/api/common") || id.includes("src/api/entities")) {
				// things that are used in both worker and client
				// entities could be separate in theory but in practice they are anyway
				return "common"
			} else if (id.includes("rollupPluginBabelHelpers") || id.includes("commonjsHelpers")) {
				return "polyfill-helpers"
			} else if (id.includes("src/settings") || id.includes("src/subscription")) {
				// subscription and settings depend on each other right now.
				// subscription is also a kitchen sink with signup, utils and views, we should break it up
				return "settings"
			} else if (id.includes("src/api/worker")) {
				return "worker" // avoid that crypto stuff is only put into native
			} else {
				// Put all translations into "translation-code"
				// Almost like in Rollup example: https://rollupjs.org/guide/en/#outputmanualchunks
				// This groups chunks but does not rename them for some reason so we do chunkFileNames below
				const match = /.*\/translations\/(\w+)+\.js/.exec(id)
				if (match) {
					const language = match[1]
					return "translation-" + language
				}
			}
		},
		chunkFileNames: (chunkInfo) => {
			// I would love to test chunkInfo.name but it will be just "en", not "translation-en" for some reason
			if (chunkInfo.facadeModuleId && chunkInfo.facadeModuleId.includes("src/translations/")) {
				return "translation-[name]-[hash].js"
			} else {
				return "[name]-[hash].js"
			}
		}
	})
	const chunks = output.output.map(c => c.fileName)

	// we have to use System.import here because bootstrap is not executed until we actually import()
	// unlike nollup+es format where it just runs on being loaded like you expect,
	// Configure promise before running so that it's not too slow.
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
	await Promise.all([
		createHtml(
			env.create((options.stage === 'release' || options.stage === 'local') ? null : restUrl, version, "Browser", true),
		),
		(options.stage !== 'release')
			? createHtml(env.create(restUrl, version, "App", true))
			: null,
	])

	await bundleServiceWorker(chunks, version)
}

async function buildDesktopClient(version) {
	if (options.desktop) {
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
			await createHtml(env.create("https://mail.tutanota.com", version, "Desktop", true))
			await buildDesktop(desktopBaseOpts)
			if (!options.customDesktopRelease) { // don't build the test version for manual/custom builds
				const desktopTestOpts = Object.assign({}, desktopBaseOpts, {
					updateUrl: "https://test.tutanota.com/desktop",
					nameSuffix: "-test",
					// Do not notarize test build
					notarize: false
				})
				await createHtml(env.create("https://test.tutanota.com", version, "Desktop", true))
				await buildDesktop(desktopTestOpts)
			}
		} else if (options.stage === "local") {
			const desktopLocalOpts = Object.assign({}, desktopBaseOpts, {
				version,
				updateUrl: "http://localhost:9000/client/build/desktop-snapshot",
				nameSuffix: "-snapshot",
				notarize: false
			})
			await createHtml(env.create("http://localhost:9000", version, "Desktop", true))
			await buildDesktop(desktopLocalOpts)
		} else if (options.stage === "test") {
			const desktopTestOpts = Object.assign({}, desktopBaseOpts, {
				updateUrl: "https://test.tutanota.com/desktop",
				nameSuffix: "-test",
				notarize: false
			})
			await createHtml(env.create("https://test.tutanota.com", version, "Desktop", true))
			await buildDesktop(desktopTestOpts)
		} else if (options.stage === "prod") {
			const desktopProdOpts = Object.assign({}, desktopBaseOpts, {
				version,
				updateUrl: "http://localhost:9000/desktop",
				notarize: false
			})
			await createHtml(env.create("https://mail.tutanota.com", version, "Desktop", true))
			await buildDesktop(desktopProdOpts)
		} else { // stage = host
			const desktopHostOpts = Object.assign({}, desktopBaseOpts, {
				version,
				updateUrl: "http://localhost:9000/desktop-snapshot",
				nameSuffix: "-snapshot",
				notarize: false
			})
			await createHtml(env.create(options.host, version, "Desktop", true))
			await buildDesktop(desktopHostOpts)
		}
	}
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
				plugins: [
					// Using Flow plugin and not preset to run before class-properties and avoid generating strange property code
					"@babel/plugin-transform-flow-strip-types",
					"@babel/plugin-proposal-class-properties",
					"@babel/plugin-transform-computed-properties",
					"@babel/plugin-transform-parameters",
					"@babel/plugin-transform-shorthand-properties",
					"@babel/plugin-transform-spread",
				],
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

function signDesktopClients() {
	if (options.deb) {
		if (options.stage === "release" || options.stage === "prod") {
			sign('./build/desktop/tutanota-desktop-mac.zip', 'mac-sig-zip.bin', 'latest-mac.yml')
			sign('./build/desktop/tutanota-desktop-mac.dmg', 'mac-sig-dmg.bin', /*ymlFileName*/ null)
			sign('./build/desktop/tutanota-desktop-win.exe', 'win-sig.bin', 'latest.yml')
			sign('./build/desktop/tutanota-desktop-linux.AppImage', 'linux-sig.bin', 'latest-linux.yml')
		}
		if (options.stage === "release" || options.stage === "test") {
			sign('./build/desktop-test/tutanota-desktop-test-mac.zip', 'mac-sig-zip.bin', 'latest-mac.yml')
			sign('./build/desktop-test/tutanota-desktop-test-mac.dmg', 'mac-sig-dmg.bin', /*ymlFileName*/ null)
			sign('./build/desktop-test/tutanota-desktop-test-win.exe', 'win-sig.bin', 'latest.yml')
			sign('./build/desktop-test/tutanota-desktop-test-linux.AppImage', 'linux-sig.bin', 'latest-linux.yml')
		}
	}
}


function packageDeb(version) {
	let webAppDebName = `tutanota_${version}_amd64.deb`
	let desktopDebName = `tutanota-desktop_${version}_amd64.deb`
	let desktopTestDebName = `tutanota-desktop-test_${version}_amd64.deb`
	if (options.deb) {
		const target = `/opt/tutanota`
		exitOnFail(spawnSync("/usr/bin/find", `. ( -name *.js -o -name *.html ) -exec gzip -fkv --best {} \;`.split(" "), {
			cwd: __dirname + '/build/dist',
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		console.log("create " + webAppDebName)
		exitOnFail(spawnSync("/usr/local/bin/fpm", `-f -s dir -t deb --deb-user tutadb --deb-group tutadb --after-install ../resources/scripts/after-install.sh -n tutanota -v ${version} dist/=${target}`.split(" "), {
			cwd: __dirname + '/build',
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		if (options.stage === "release" || options.stage === "prod") {
			console.log("create " + desktopDebName)
			exitOnFail(spawnSync("/usr/local/bin/fpm", `-f -s dir -t deb --deb-user tutadb --deb-group tutadb -n tutanota-desktop -v ${version} desktop/=${target}-desktop`.split(" "), {
				cwd: __dirname + '/build',
				stdio: [process.stdin, process.stdout, process.stderr]
			}))
		}

		if (options.stage === "release" || options.stage === "test") {
			console.log("create " + desktopTestDebName)
			exitOnFail(spawnSync("/usr/local/bin/fpm", `-f -s dir -t deb --deb-user tutadb --deb-group tutadb -n tutanota-desktop-test -v ${version} desktop-test/=${target}-desktop`.split(" "), {
				cwd: __dirname + '/build',
				stdio: [process.stdin, process.stdout, process.stderr]
			}))
		}
	}
}

function publish(version) {
	let webAppDebName = `tutanota_${version}_amd64.deb`
	let desktopDebName = `tutanota-desktop_${version}_amd64.deb`
	let desktopTestDebName = `tutanota-desktop-test_${version}_amd64.deb`

	if (options.publish) {
		console.log("Create git tag and copy .deb")
		exitOnFail(spawnSync("/usr/bin/git", `tag -a tutanota-release-${version} -m ''`.split(" "), {
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		exitOnFail(spawnSync("/usr/bin/git", `push origin tutanota-release-${version}`.split(" "), {
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		exitOnFail(spawnSync("/bin/cp", `-f build/${webAppDebName} /opt/repository/tutanota/`.split(" "), {
			cwd: __dirname,
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		exitOnFail(spawnSync("/bin/cp", `-f build/${desktopDebName} /opt/repository/tutanota-desktop/`.split(" "), {
			cwd: __dirname,
			stdio: [process.stdin, process.stdout, process.stderr]
		}))
		exitOnFail(spawnSync("/bin/cp", `-f build/${desktopTestDebName} /opt/repository/tutanota-desktop-test/`.split(" "), {
			cwd: __dirname,
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		// copy appimage for dev_clients
		exitOnFail(spawnSync("/bin/cp", `-f build/desktop/tutanota-desktop-linux.AppImage /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage`.split(" "), {
			cwd: __dirname,
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		// user puppet needs to read the deb file from jetty
		exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota/${webAppDebName}`.split(" "), {
			cwd: __dirname + '/build/',
			stdio: [process.stdin, process.stdout, process.stderr]
		}))

		exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota-desktop/${desktopDebName}`.split(" "), {
			cwd: __dirname + '/build/',
			stdio: [process.stdin, process.stdout, process.stderr]
		}))
		exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/tutanota-desktop-test/${desktopTestDebName}`.split(" "), {
			cwd: __dirname + '/build/',
			stdio: [process.stdin, process.stdout, process.stderr]
		}))
		// in order to release this new version locally, execute:
		// mv /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage /opt/repository/dev_client/tutanota-desktop-linux.AppImage
		exitOnFail(spawnSync("/bin/chmod", `o+r /opt/repository/dev_client/tutanota-desktop-linux-new.AppImage`.split(" "), {
			cwd: __dirname + '/build/',
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