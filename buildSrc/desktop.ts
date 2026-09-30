/**
 * Script to build desktop release versions of the app.
 */
import * as env from "./env.js"
import os from "node:os"
import { buildWebapp } from "./buildWebapp"
import { checkArchitectureIsSupported, getCanonicalPlatformName, getTutanotaAppVersion, measure } from "./buildUtils.js"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createHtml } from "./createHtml"
import { Argument, Command, Option, program } from "commander"
import { domainConfigs } from "./DomainConfigs"
import { BlockList } from "node:net"
import { AppName, BuildStage } from "./DevBuild"
import { DesktopBuilderOpts } from "./DesktopBuilder"
import { InputArch } from "./nativeLibraryProvider.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const tutaTestUrl = new URL("https://app.test.tuta.com").toString()
const tutaAppUrl = new URL("https://app.tuta.com").toString()

export const desktopCmd = new Command("desktop")
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
	.action(async (stage, host, opts: BuildDesktopOpts) => {
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

export type BuildDesktopOpts = {
	stage: BuildStage
	host: null | string
	app: AppName
	existing: boolean
	platform: NodeJS.Platform
	architecture: NodeJS.Architecture
	webClient: "make" | null
	disableMinify: boolean
	outDir: string
	unpacked: boolean
	customDesktopRelease: boolean
}
async function doBuild(opts: BuildDesktopOpts) {
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
				projectDir: __dirname,
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

async function buildDesktopClient(
	version: string,
	{ stage, host, platform, architecture, customDesktopRelease, unpacked, outDir, disableMinify }: BuildDesktopOpts,
) {
	const { buildDesktop } = await import("./DesktopBuilder.js")
	const updateUrl = new URL(tutaAppUrl)
	updateUrl.pathname = "desktop"
	const desktopBaseOpts: DesktopBuilderOpts = {
		dirname: __dirname,
		version,
		platform: platform,
		architecture: architecture as InputArch,
		updateUrl: customDesktopRelease ? "" : updateUrl.toString(),
		nameSuffix: "",
		notarize: !customDesktopRelease,
		outDir: outDir,
		unpacked: unpacked,
		disableMinify,
		networkDebugging: false,
	}

	if (stage === "release") {
		await createHtml(env.create({ staticUrl: tutaAppUrl, version, mode: "Desktop", dist: true, domainConfigs, networkDebugging: false }))
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
			await createHtml(env.create({ staticUrl: tutaTestUrl, version, mode: "Desktop", dist: true, domainConfigs, networkDebugging: false }))
			await buildDesktop(desktopTestOpts)
		}
	} else if (stage === "local") {
		// this is the only way to contact the local server from localhost, a VM and
		// from other machines in the LAN with the same url.
		const addr = privateIpv4Address() ?? Object.values(os.networkInterfaces())[0]![0]?.address
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
		await createHtml(env.create({ staticUrl: `http://${addr}:9000`, version, mode: "Desktop", dist: true, domainConfigs, networkDebugging: true }))
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
		await createHtml(env.create({ staticUrl: tutaTestUrl, version, mode: "Desktop", dist: true, domainConfigs, networkDebugging: true }))
		await buildDesktop(desktopTestOpts)
	} else if (stage === "prod") {
		const desktopProdOpts = Object.assign({}, desktopBaseOpts, {
			version,
			updateUrl: "http://localhost:9000/desktop",
			notarize: false,
		})
		await createHtml(env.create({ staticUrl: tutaAppUrl, version, mode: "Desktop", dist: true, domainConfigs, networkDebugging: false }))
		await buildDesktop(desktopProdOpts)
	} else {
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

function isPrivateIpv4Address(address: string): boolean {
	const privateRanges = new BlockList()
	privateRanges.addRange("10.0.0.0", "10.255.255.255")
	privateRanges.addRange("172.16.0.0", "172.31.255.255")
	privateRanges.addRange("192.168.0.0", "192.168.255.255")
	return privateRanges.check(address, "ipv4")
}

/** @return {string|undefined} */
function privateIpv4Address(): string | null {
	return (
		Object.values(os.networkInterfaces())
			.filter((net) => net != null)
			.map((net) => net.find((a) => a.family === "IPv4"))
			.filter((net) => net != null)
			.filter((net) => !net.internal && isPrivateIpv4Address(net.address))[0]?.address ?? null
	)
}
