/**
 * Build script for android app.
 *
 *  Besides options below this script may require signing parameters passed as environment variables:
 *  'APK_SIGN_ALIAS'
 *  'APK_SIGN_STORE_PASS'
 *  'APK_SIGN_KEY_PASS'
 *  'APK_SIGN_STORE'
 *  'ANDROID_HOME'
 */
import { Argument, Command, Option, program } from "commander"
import { AppName, buildDirForApp, BuildStage, runDevBuild } from "./DevBuild"
import { prepareMobileBuild } from "./prepareMobileBuild"
import { buildWebapp } from "./buildWebapp"
import { getTutanotaAppVersion, measure } from "./buildUtils.js"
import path from "node:path"
import { $ } from "zx"
import fs from "node:fs/promises"

// chalk is in scope because of zx
const log = (...messages: any[]) => console.log(chalk.green("\nBUILD:"), ...messages, "\n")

$.verbose = true

const AllBuildType = ["debug", "release", "releaseTest"] as const
export type BuildType = "debug" | "release" | "releaseTest"
export const androidCmd = new Command("android")
	.usage("[options] [test|prod|local|host <url>] ")
	.addArgument(
		new Argument("stage", "the server to connect to. test/local/prod are shorthands for using host <url> of the corresponding staging level server")
			.choices(["test", "prod", "local", "host"])
			.default("prod")
			.argOptional(),
	)
	.addArgument(new Argument("host").argOptional())
	.addOption(new Option("-a, --app <type>", "app to build").choices(["mail", "calendar", "drive"]).default("mail"))
	.addOption(
		new Option(
			"-b, --buildtype <type>",
			"gradle build type. use debug if you need to debug the app with android studio. release and releaseTest build the same app with different appIds for side-by-side installation",
		)
			.choices(AllBuildType)
			.default("release"),
	)
	.addOption(new Option("-i, --install", "call adb install after build to deploy the app to a device/emulator"))
	.addOption(
		new Option(
			"-w --webclient <client>",
			"choose web client build. make is faster and easier to debug, but dist is what would be running in production. There's usually no reason to use dist during development.",
		)
			.choices(["make", "dist"])
			.default("dist"),
	)
	.option("-e, --existing", "Use existing prebuilt web client files to skip the lengthy web client build. Use if you're developing the Kotlin code.")
	.action(async (stage, host, { webclient, buildtype, install, existing, app }) => {
		if ((stage === "host" && host == null) || (stage !== "host" && host != null)) {
			program.outputHelp()
			process.exit(1)
		}

		const apk = await buildAndroid({
			stage: stage ?? "prod",
			host: host,
			webClient: webclient,
			existing,
			buildType: buildtype,
			app,
		})

		if (install) {
			await $`adb install ${apk}`
			// would be cool to auto-start the app, but needs to figure out the correct app to start:
			// await $`adb shell am start -n de.tutao.tutanota/de.tutao.tutanota.MainActivity`
		}
	})

export type BuildAndroidOpts = { stage: BuildStage; host: null | string; buildType: BuildType; existing: boolean; webClient: "make" | null; app: AppName }
async function buildAndroid({ stage, host, buildType, existing, webClient, app }: BuildAndroidOpts) {
	log(`Starting ${stage} build with build type: ${buildType}, webclient: ${webClient}, host: ${host}`)

	if (!existing) {
		if (webClient === "make") {
			await runDevBuild({
				stage,
				host,
				desktop: false,
				clean: false,
				networkDebugging: false,
				app,
			})
		} else {
			const version = await getTutanotaAppVersion()
			await buildWebapp({
				version,
				stage,
				host,
				minify: true,
				projectDir: path.resolve("."),
				measure,
				app,
			})
		}
	} else {
		console.log("skipped webapp build")
	}

	await prepareMobileBuild(app)
	const buildDir = buildDirForApp(app)
	try {
		await $`rm -r ${buildDir}/app-android`
	} catch (e) {
		// Ignoring the error if the folder is not there
	}

	switch (app) {
		case "mail":
			return await buildMailApk(buildType)
		case "calendar": {
			await buildCalendarBundle(buildType)
			return await buildCalendarApk(buildType)
		}
		case "drive": {
			await buildDriveBundle(buildType)
			return await buildDriveApk(buildType)
		}
	}
}

async function buildCalendarBundle(buildType: BuildType) {
	return await buildBundle({ baseBundleName: "calendar", gradleModule: "calendar", buildType })
}

async function buildDriveBundle(buildType: BuildType) {
	return await buildBundle({ baseBundleName: "drive", gradleModule: "drive", buildType })
}

export type BundleOpts = { baseBundleName: string; gradleModule: string; buildType: BuildType }
async function buildBundle({ baseBundleName, gradleModule, buildType }: BundleOpts) {
	const version = await getTutanotaAppVersion()
	const aabFileName = `${baseBundleName}-tutao-${buildType}-${version}.aab`
	const aabPath = `app-android/${gradleModule}/build/outputs/bundle/tutao${capitalize(buildType)}/${aabFileName}`
	const outDirPath = `./artifacts/app-android`
	const outAabPath = `${outDirPath}/${aabFileName}`

	await fs.rm(outAabPath, { force: true })

	const $inAppDir = $({ cwd: "app-android" })
	await $inAppDir`./gradlew :${gradleModule}:bundleTutao${buildType}`

	await fs.mkdir(outDirPath, { recursive: true })

	await fs.rename(aabPath, outAabPath)

	log(`Build complete. The AAB is located at ${outAabPath}`)

	return outAabPath
}

async function buildCalendarApk(buildType: BuildType) {
	return await buildApk({ buildType, gradleModule: "calendar", baseBundleName: "calendar" })
}

async function buildMailApk(buildType: BuildType) {
	return await buildApk({ buildType, gradleModule: "app", baseBundleName: "tutanota-app" })
}

async function buildDriveApk(buildType: BuildType) {
	return await buildApk({ buildType, gradleModule: "drive", baseBundleName: "drive" })
}

async function buildApk({ baseBundleName, gradleModule, buildType }: BundleOpts) {
	const version = await getTutanotaAppVersion()
	const apkFileName = `${baseBundleName}-tutao-${buildType}-${version}.apk`
	const apkPath = `app-android/${gradleModule}/build/outputs/apk/tutao/${buildType}/${apkFileName}`
	const outDirPath = `./artifacts/app-android`
	const outApkPath = `${outDirPath}/${apkFileName}`

	await fs.rm(outApkPath, { force: true })

	const $inAppDir = $({ cwd: "app-android" })
	await $inAppDir`./gradlew :${gradleModule}:assembleTutao${buildType}`

	await fs.mkdir(outDirPath, { recursive: true })

	await fs.rename(apkPath, outApkPath)

	log(`Build complete. The APK is located at ${outApkPath}`)

	return outApkPath
}

function capitalize(buildType: BuildType) {
	return buildType.charAt(0).toUpperCase() + buildType.slice(1)
}
