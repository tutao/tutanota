/**
 * Script to build desktop release versions of the app.
 */
import options from "commander"
import * as env from "./buildSrc/env.js"
import os from "os"
import {buildWebapp} from "./buildSrc/buildWebapp.js"
import {getTutanotaAppVersion, measure} from "./buildSrc/buildUtils.js"
import {dirname} from "path"
import {fileURLToPath} from "url"
import {createHtml} from "./buildSrc/createHtml.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

const desktopTargets = new Set()

options
	.usage('[options] [test|prod|local|release|host <url>], "release" is default')
	.description('Main build tool for distributable tutanota desktop artifacts. If neither of --win --linux --mac options is provided, --linux will be assumed')
	.arguments('[stage] [host]')
	.option('-e, --existing', 'Use existing prebuilt Webapp files in /build/dist/')
	.option('-w --win', 'Build desktop client for windows')
	.option('-l --linux', 'Build desktop client for linux')
	.option('-m --mac', 'Build desktop client for mac')
	.option('--custom-desktop-release', "use if manually building desktop client from source. doesn't install auto updates, but may still notify about new releases.")
	.option('--disable-minify', "disable minification")
	.option('--unpacked', "don't pack the app into an installer")
	.option('--out-dir <outDir>', "where to copy the client",)
	.action((stage, host) => {
		if (!["test", "prod", "local", "host", "release", undefined].includes(stage)
			|| (stage !== "host" && host)
			|| (stage === "host" && !host)) {
			options.outputHelp()
			process.exit(1)
		}
		options.stage = stage || "release"
		options.host = host

		if (options.win) desktopTargets.add("win32")
		if (options.linux) desktopTargets.add("linux")
		if (options.mac) desktopTargets.add("mac")

		if (options.customDesktopRelease) {
			console.log(`Custom desktop release - adding local plattform (${process.platform}) to targets`)
			desktopTargets.add(process.platform)
		}

		if (desktopTargets.size === 0){
			console.log("No target set, defaulting to linux.")
			desktopTargets.add("linux")
		}

	})
	.parse(process.argv)

doBuild().catch(e => {
	console.error(e)
	process.exit(1)
})

async function doBuild() {
	try {
		measure()
		const version = await getTutanotaAppVersion()

		if (options.existing) {
			console.log("Found existing option (-e). Skipping Webapp build.")
		} else {
			const minify = options.disableMinify !== true
			if (!minify) {
				console.warn("Minification is disabled")
			}
			await buildWebapp(
				{
					version,
					stage: options.stage,
					host: options.host,
					measure,
					minify,
					projectDir: __dirname
				})
		}

		await buildDesktopClient(version)

		const now = new Date(Date.now()).toTimeString().substr(0, 5)
		console.log(`\nBuild time: ${measure()}s (${now})`)
	} catch (e) {
		console.error("\nBuild error:", e)
		process.exit(1)
	}
}

async function buildDesktopClient(version) {
	const {buildDesktop} = await import("./buildSrc/DesktopBuilder.js")
	const desktopBaseOpts = {
		dirname: __dirname,
		version,
		targets: desktopTargets,
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
			updateUrl: `${options.host}/client/build/desktop-snapshot`,
			nameSuffix: "-snapshot",
			notarize: false
		})
		await createHtml(env.create({staticUrl: options.host, version, mode: "Desktop", dist: true}))
		await buildDesktop(desktopHostOpts)
	}
}
