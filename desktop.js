/**
 * Script to build desktop release versions of the app.
 */
import * as env from "./buildSrc/env.js"
import os from "os"
import {buildWebapp} from "./buildSrc/buildWebapp.js"
import {getCanonicalPlatformName, getTutanotaAppVersion, measure} from "./buildSrc/buildUtils.js"
import {dirname} from "path"
import {fileURLToPath} from "url"
import {createHtml} from "./buildSrc/createHtml.js"
import {Argument, program} from "commander"

const __dirname = dirname(fileURLToPath(import.meta.url))

await program
	.usage('[options] [test|prod|local|release|host <url>], "release" is default')
	.description('Main build tool for distributable tutanota desktop artifacts.')
	.addArgument(new Argument("stage")
		.choices(["test", "prod", "local", "host", "release"])
		.default("release")
		.argOptional())
	.addArgument(new Argument("host").argOptional())
	.option('-e, --existing', 'Use existing prebuilt Webapp files in /build/dist/')
	.option('-p, --platform <platform>', "For which platform to build: linux|win|mac", process.platform)
	.option('-c,--custom-desktop-release', "use if manually building desktop client from source. doesn't install auto updates, but may still notify about new releases.")
	.option('-d,--disable-minify', "disable minification", false)
	.option('-u,--unpacked', "don't pack the app into an installer")
	.option('-o,--out-dir <outDir>', "where to copy the client",)
	.action(async (stage, host, opts) => {

		if (stage === "host" && host == null || stage !== "host" && host != null) {
			program.outputHelp()
			process.exit(1)
		}

		opts.stage = stage ?? "release"
		opts.host = host

		if (opts.customDesktopRelease) {
			console.log(`Custom desktop release - setting platform to ${process.platform}`)
			opts.platform = process.platform
		}

		opts.platform = getCanonicalPlatformName(opts.platform)

		await doBuild(opts)
	})
	.parseAsync(process.argv)

async function doBuild(opts) {
	try {
		measure()
		const version = getTutanotaAppVersion()

		if (opts.existing) {
			console.log("Found existing option (-e). Skipping Webapp build.")
		} else {
			if (opts.disableMinify) {
				console.warn("Minification is disabled")
			}
			await buildWebapp(
				{
					version,
					stage: opts.stage,
					host: opts.host,
					measure,
					minify: !opts.disableMinify,
					projectDir: __dirname
				})
		}

		await buildDesktopClient(version, opts)

		const now = new Date(Date.now()).toTimeString().substr(0, 5)
		console.log(`\nBuild time: ${measure()}s (${now})`)
	} catch (e) {
		console.error("\nBuild error:", e)
		process.exit(1)
	}
}

async function buildDesktopClient(
	version,
	{
		stage,
		host,
		platform,
		customDesktopRelease,
		unpacked,
		outDir,
		disableMinify,
	}
) {
	const {buildDesktop} = await import("./buildSrc/DesktopBuilder.js")
	const desktopBaseOpts = {
		dirname: __dirname,
		version,
		platform: platform,
		updateUrl: customDesktopRelease
			? ""
			: "https://mail.tutanota.com/desktop",
		nameSuffix: "",
		notarize: !customDesktopRelease,
		outDir: outDir,
		unpacked: unpacked,
		disableMinify,
	}

	if (stage === "release") {
		await createHtml(env.create({staticUrl: "https://mail.tutanota.com", version, mode: "Desktop", dist: true}))
		await buildDesktop(desktopBaseOpts)
		if (!customDesktopRelease) { // don't build the test version for manual/custom builds
			const desktopTestOpts = Object.assign({}, desktopBaseOpts, {
				updateUrl: "https://test.tutanota.com/desktop",
				nameSuffix: "-test",
				// Do not notarize test build
				notarize: false
			})
			await createHtml(env.create({staticUrl: "https://test.tutanota.com", version, mode: "Desktop", dist: true}))
			await buildDesktop(desktopTestOpts)
		}
	} else if (stage === "local") {
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
	} else if (stage === "test") {
		const desktopTestOpts = Object.assign({}, desktopBaseOpts, {
			updateUrl: "https://test.tutanota.com/desktop",
			nameSuffix: "-test",
			notarize: false
		})
		await createHtml(env.create({staticUrl: "https://test.tutanota.com", version, mode: "Desktop", dist: true}))
		await buildDesktop(desktopTestOpts)
	} else if (stage === "prod") {
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
			updateUrl: `${host}/client/build/desktop-snapshot`,
			nameSuffix: "-snapshot",
			notarize: false
		})
		await createHtml(env.create({staticUrl: host, version, mode: "Desktop", dist: true}))
		await buildDesktop(desktopHostOpts)
	}
}
