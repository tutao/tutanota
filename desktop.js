/**
 * Script to build desktop release versions of the app.
 */
import * as env from "./buildSrc/env.js"
import os from "node:os"
import { buildWebapp } from "./buildSrc/buildWebapp.js"
import { checkArchitectureIsSupported, getCanonicalPlatformName, getTutanotaAppVersion, measure } from "./buildSrc/buildUtils.js"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createHtml } from "./buildSrc/createHtml.js"
import { Argument, Option, program } from "commander"
import { checkOfflineDatabaseMigrations } from "./buildSrc/checkOfflineDbMigratons.js"
import { domainConfigs } from "./buildSrc/DomainConfigs.js"
import { BlockList } from "node:net"

const __dirname = dirname(fileURLToPath(import.meta.url))
const tutaTestUrl = new URL("https://app.test.tuta.com")
const tutaAppUrl = new URL("https://app.tuta.com")

await program
	.usage('[options] [test|prod|local|release|host <url>], "release" is default')
	.description("Main build tool for distributable tuta desktop artifacts.")
	.addArgument(new Argument("stage").choices(["test", "prod", "local", "host", "release"]).default("release").argOptional())
	.addArgument(new Argument("host").argOptional())
	.addOption(new Option("-A, --app <type>", "app to build").choices(["mail", "calendar"]).default("mail"))
	.option("-e, --existing", "Use existing prebuilt Webapp files in /build/")
	.option("-p, --platform <platform>", "For which platform to build: linux|win|mac", process.platform)
	.option("-a, --architecture <architecture>", "For which CPU architecture to build: x64|arm_64|universal", process.arch)
	.option(
		"-c,--custom-desktop-release",
		"use if manually building desktop client from source. doesn't install auto updates, but may still notify about new releases.",
	)
	.option("-d,--disable-minify", "disable minification", false)
	.option("-u,--unpacked", "don't pack the app into an installer")
	.option("-o,--out-dir <outDir>", "where to copy the client")
	.action(async (stage, host, opts) => {
		if ((stage === "host" && host == null) || (stage !== "host" && host != null)) {
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

		if (!checkArchitectureIsSupported(opts.platform, opts.architecture)) {
			throw new Error(`Platform ${opts.platform} on ${opts.architecture} is not supported`)
		}
		const hostDescription = opts.host ? ` (${opts.host})` : ""
		console.log(`Building desktop client (dist) ${opts.platform}-${opts.architecture} ${opts.stage}${hostDescription}`)

		await doBuild(opts)
	})
	.parseAsync(process.argv)

async function doBuild(opts) {
	try {
		measure()
		const version = await getTutanotaAppVersion()

		await checkOfflineDatabaseMigrations()

		if (opts.existing) {
			console.log("Found existing option (-e). Skipping Webapp build.")
		} else {
			if (opts.disableMinify) {
				console.warn("Minification is disabled")
			}
			await buildWebapp({
				version,
				stage: opts.stage,
				host: opts.host,
				measure,
				minify: !opts.disableMinify,
				projectDir: __dirname,
				app: opts.app,
			})
		}

		await buildDesktopClient(version, opts)

		const now = new Date(Date.now()).toTimeString().substr(0, 5)
		console.log(`\nBuild time: ${measure()}s (${now})`)
		process.exit(0)
	} catch (e) {
		console.error("\nBuild error:", e)
		process.exit(1)
	}
}

async function buildDesktopClient(version, { stage, host, platform, architecture, customDesktopRelease, unpacked, outDir, disableMinify }) {
	const { buildDesktop } = await import("./buildSrc/DesktopBuilder.js")
	const updateUrl = new URL(tutaAppUrl)
	updateUrl.pathname = "desktop"
	const desktopBaseOpts = {
		dirname: __dirname,
		version,
		platform: platform,
		architecture,
		updateUrl: customDesktopRelease ? "" : updateUrl,
		nameSuffix: "",
		notarize: !customDesktopRelease,
		outDir: outDir,
		unpacked: unpacked,
		disableMinify,
	}

	if (stage === "release") {
		await createHtml(env.create({ staticUrl: tutaAppUrl, version, mode: "Desktop", dist: true, domainConfigs }))
		await buildDesktop(desktopBaseOpts)
		if (!customDesktopRelease) {
			const updateUrl = new URL(tutaTestUrl)
			updateUrl.pathname = "desktop"
			// don't build the test version for manual/custom builds
			const desktopTestOpts = Object.assign({}, desktopBaseOpts, {
				updateUrl,
				nameSuffix: "-test",
				// Do not notarize test build
				notarize: false,
			})
			await createHtml(env.create({ staticUrl: tutaTestUrl, version, mode: "Desktop", dist: true, domainConfigs }))
			await buildDesktop(desktopTestOpts)
		}
	} else if (stage === "local") {
		// this is the only way to contact the local server from localhost, a VM and
		// from other machines in the LAN with the same url.
		const addr = privateIpv4Address() ?? Object.values(os.networkInterfaces())[0]?.address
		if (addr == null) {
			throw new Error("Unable to pick auto-update address, please specify manually with 'host'")
		}
		const desktopLocalOpts = Object.assign({}, desktopBaseOpts, {
			version,
			updateUrl: `http://${addr}:9000/desktop/desktop-snapshot`,
			nameSuffix: "-snapshot",
			notarize: false,
		})
		await createHtml(env.create({ staticUrl: `http://${addr}:9000`, version, mode: "Desktop", dist: true, domainConfigs }))
		await buildDesktop(desktopLocalOpts)
	} else if (stage === "test") {
		const updateUrl = new URL(tutaTestUrl)
		updateUrl.pathname = "desktop"
		const desktopTestOpts = Object.assign({}, desktopBaseOpts, {
			updateUrl: updateUrl,
			nameSuffix: "-test",
			notarize: false,
		})
		await createHtml(env.create({ staticUrl: tutaTestUrl, version, mode: "Desktop", dist: true, domainConfigs }))
		await buildDesktop(desktopTestOpts)
	} else if (stage === "prod") {
		const desktopProdOpts = Object.assign({}, desktopBaseOpts, {
			version,
			updateUrl: "http://localhost:9000/desktop",
			notarize: false,
		})
		await createHtml(env.create({ staticUrl: tutaAppUrl, version, mode: "Desktop", dist: true, domainConfigs }))
		await buildDesktop(desktopProdOpts)
	} else {
		// stage = host
		const desktopHostOpts = Object.assign({}, desktopBaseOpts, {
			version,
			updateUrl: `${host}/desktop/desktop-snapshot`,
			nameSuffix: "-snapshot",
			notarize: false,
		})
		await createHtml(env.create({ staticUrl: host, version, mode: "Desktop", dist: true, domainConfigs }))
		await buildDesktop(desktopHostOpts)
	}
}

/**
 * @param address {string}
 * @return {boolean}
 */
function isPrivateIpv4Address(address) {
	const privateRanges = new BlockList()
	privateRanges.addRange("10.0.0.0", "10.255.255.255")
	privateRanges.addRange("172.16.0.0", "172.31.255.255")
	privateRanges.addRange("192.168.0.0", "192.168.255.255")
	return privateRanges.check(address, "ipv4")
}

/** @return {string|undefined} */
function privateIpv4Address() {
	return Object.values(os.networkInterfaces())
		.map((net) => net.find((a) => a.family === "IPv4"))
		.filter(Boolean)
		.filter((net) => !net.internal && isPrivateIpv4Address(net.address))[0]?.address
}
