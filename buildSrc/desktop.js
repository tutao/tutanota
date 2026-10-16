/**
 * Script to build desktop release versions of the app.
 */
import * as env from "./env.js"
import os from "node:os"
import { buildWebapp } from "./buildWebapp.js"
import { checkArchitectureIsSupported, getCanonicalPlatformName, getTutanotaAppVersion, measure } from "./buildUtils.js"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createHtml } from "./createHtml.js"
import { Argument, Option, program } from "commander"
import { domainConfigs } from "./DomainConfigs.js"
import { BlockList } from "node:net"

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, "..")
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
	// provide both options so that we can be explicit and default to signed
	.option("--signed", "Whether desktop client checks the signature on update", true)
	.option("--no-signed", "DO NOT check desktop client signature. Dangerous!")
	.option(
		"-c,--custom-desktop-release",
		"use if manually building desktop client from source. doesn't install auto updates, but may still notify about new releases.",
	)
	.option("-d,--disable-minify", "disable minification", false)
	.option("-u,--unpacked", "don't pack the app into an installer", false)
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

		// Safeguard against accidentally disabling signature checking.
		// JENKINS_HOME is *not* propagated to containers but "JENKINS_URL" is.
		if (Boolean(process.env["JENKINS_URL"]) && opts.signed !== true) {
			throw new Error("Building in Jenkins but not checking for signature on update! Check the parameters to desktop.js")
		}

		console.log(`Building desktop client (dist) ${opts.platform}-${opts.architecture} ${opts.stage}${hostDescription} signed ${opts.signed}`)

		await doBuild(opts)
	})
	.parseAsync(process.argv)

/**
 * @import {ArchParam} from "./DesktopBuilder.js"
 *
 * @typedef Opts
 * @type {object}
 * @property stage {"release" | "test" | "prod" | "local" | "host" }
 * @property [host] {string}
 * @property platform {import("./buildUtils.js").CanonicalPlatformName}
 * @property architecture {ArchParam}
 * @property app {"mail" | "calendar"}
 * @property unpacked {boolean}
 * @property signed {boolean}
 * @property [existing] {boolean}
 * @property [customDesktopRelease] {boolean}
 * @property [disableMinify] {boolean}
 * @property [outDir] {string}
 */

/** @param opts {Opts} */
async function doBuild(opts) {
	try {
		measure()
		const version = await getTutanotaAppVersion()

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
				projectDir: projectRoot,
				app: opts.app,
			})
		}

		await buildDesktopClient(version, opts)

		const now = new Date(Date.now()).toTimeString().substring(0, 5)
		console.log(`\nBuild time: ${measure()}s (${now})`)
		process.exit(0)
	} catch (e) {
		console.error("\nBuild error:", e)
		process.exit(1)
	}
}

/**
 * @param version {string}
 * @param opts {Opts}
 */
async function buildDesktopClient(version, { stage, host, platform, architecture, customDesktopRelease, unpacked, outDir, disableMinify, signed }) {
	const { buildDesktop } = await import("./DesktopBuilder.js")
	const updateUrlObject = new URL(tutaAppUrl)
	updateUrlObject.pathname = "desktop"

	/** @type {import("./DesktopBuilder.js").BuildDesktopParam} */
	const desktopBaseOpts = {
		projectRoot,
		version,
		platform: platform,
		architecture,
		updateUrl: customDesktopRelease ? "" : updateUrlObject.toString(),
		nameSuffix: "",
		notarize: !customDesktopRelease,
		outDir: outDir,
		unpacked: unpacked,
		disableMinify,
		networkDebugging: false,
		signed: signed,
	}

	if (stage === "release") {
		await createHtml(env.create({ staticUrl: tutaAppUrl.toString(), version, mode: "Desktop", dist: true, domainConfigs, networkDebugging: false }))
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
			await createHtml(env.create({ staticUrl: tutaTestUrl.toString(), version, mode: "Desktop", dist: true, domainConfigs, networkDebugging: false }))
			await buildDesktop(desktopTestOpts)
		}
	} else if (stage === "local") {
		// this is the only way to contact the local server from localhost, a VM and
		// from other machines in the LAN with the same url.
		const networkInterfaces = Object.values(os.networkInterfaces())
		const addr = privateIpv4Address() ?? networkInterfaces[0]?.[0].address
		if (addr == null) {
			throw new Error("Unable to pick auto-update address, please specify manually with 'host'")
		}
		const desktopLocalOpts = Object.assign({}, desktopBaseOpts, {
			version,
			updateUrl: `http://${addr}:9000/desktop/desktop-snapshot`,
			nameSuffix: "-snapshot",
			notarize: false,
			networkDebugging: true,
		})
		await createHtml(
			env.create({
				staticUrl: `http://${addr}:9000`,
				version,
				mode: "Desktop",
				dist: true,
				domainConfigs,
				networkDebugging: true,
			}),
		)
		await buildDesktop(desktopLocalOpts)
	} else if (stage === "test") {
		const updateUrl = new URL(tutaTestUrl)
		updateUrl.pathname = "desktop"
		const desktopTestOpts = Object.assign({}, desktopBaseOpts, {
			updateUrl: updateUrl,
			nameSuffix: "-test",
			notarize: false,
			networkDebugging: true,
		})
		await createHtml(env.create({ staticUrl: tutaTestUrl.toString(), version, mode: "Desktop", dist: true, domainConfigs, networkDebugging: true }))
		await buildDesktop(desktopTestOpts)
	} else if (stage === "prod") {
		const desktopProdOpts = Object.assign({}, desktopBaseOpts, {
			version,
			updateUrl: "http://localhost:9000/desktop",
			notarize: false,
		})
		await createHtml(env.create({ staticUrl: tutaAppUrl.toString(), version, mode: "Desktop", dist: true, domainConfigs, networkDebugging: false }))
		await buildDesktop(desktopProdOpts)
	} else {
		if (host == null) {
			throw new Error("no host??")
		}

		// stage = host
		const desktopHostOpts = Object.assign({}, desktopBaseOpts, {
			version,
			updateUrl: `${host}/desktop/desktop-snapshot`,
			nameSuffix: "-snapshot",
			notarize: false,
			networkDebugging: true,
		})
		await createHtml(env.create({ staticUrl: host, version, mode: "Desktop", dist: true, domainConfigs, networkDebugging: true }))
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
		.map((net) => net?.find((a) => a.family === "IPv4"))
		.filter((net) => net != null)
		.filter((net) => !net.internal && isPrivateIpv4Address(net.address))[0]?.address
}
