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
import { Argument, Option, program } from "commander"
import { runDevBuild } from "./buildSrc/DevBuild.js"
import { prepareMobileBuild } from "./buildSrc/prepareMobileBuild.js"
import { buildWebapp } from "./buildSrc/buildWebapp.js"
import { getTutanotaAppVersion, measure } from "./buildSrc/buildUtils.js"
import path from "node:path"
import { $, cd } from "zx"

const log = (...messages) => console.log(chalk.green("\nBUILD:"), ...messages, "\n")

await program
	.usage("[options] [test|prod|local|host <url>] ")
	.addArgument(new Argument("stage").choices(["test", "prod", "local", "host"]).default("prod").argOptional())
	.addArgument(new Argument("host").argOptional())
	.addOption(new Option("-a, --app <type>", "app to build").choices(["mail", "calendar"]).default("mail"))
	.addOption(new Option("-b, --buildtype <type>", "gradle build type").choices(["debugDist", "debug", "release", "releaseTest"]).default("release"))
	.addOption(new Option("-i, --install", "call adb install after build"))
	.addOption(new Option("-w --webclient <client>", "choose web client build").choices(["make", "dist"]).default("dist"))
	.option("-e, --existing", "Use existing prebuilt web client files")
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
			// would be cool, but needs to figure out the correct app to start:
			// await $`adb shell am start -n de.tutao.tutanota/de.tutao.tutanota.MainActivity`
		}
	})
	.parseAsync(process.argv)

async function buildCalendarBundle({ buildType }) {
	const { version } = JSON.parse(await $`cat package.json`.quiet())

	const bundleName = `calendar-tutao-${buildType}-${version}.aab`
	const bundlePath = `app-android/calendar/build/outputs/bundle/tutao${buildType.charAt(0).toUpperCase() + buildType.slice(1)}/${bundleName}`
	const outPath = `./build-calendar-app/app-android/${bundleName}`

	cd("./app-android")

	await $`./gradlew :calendar:bundleTutao${buildType}`

	cd("..")

	await $`mkdir -p build-calendar-app/app-android`
	await $`mv ${bundlePath} ${outPath}`

	log(`Build complete. The AAB is located at: ${outPath}`)

	return outPath
}

async function buildMailApk({ buildType }) {
	const { version } = JSON.parse(await $`cat package.json`.quiet())
	const apkName = `tutanota-app-tutao-${buildType}-${version}.apk`
	const apkPath = `app-android/app/build/outputs/apk/tutao/${buildType}/${apkName}`

	const outPath = `./build/app-android/${apkName}`

	cd("./app-android")
	await $`./gradlew :app:assembleTutao${buildType}`

	cd("..")
	await $`mkdir -p build/app-android`
	await $`mv ${apkPath} ${outPath}`

	log(`Build complete. The APK is located at: ${outPath}`)

	return outPath
}

async function buildAndroid({ stage, host, buildType, existing, webClient, app }) {
	log(`Starting ${stage} build with build type: ${buildType}, webclient: ${webClient}, host: ${host}`)
	if (!existing) {
		if (webClient === "make") {
			await runDevBuild({
				stage,
				host,
				desktop: false,
				clean: false,
				watch: false,
				serve: false,
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

	await prepareMobileBuild(webClient, app)
	const buildDir = app === "mail" ? "build" : "build-calendar-app"
	try {
		await $`rm -r ${buildDir}/app-android`
	} catch (e) {
		// Ignoring the error if the folder is not there
	}

	if (app === "mail") {
		return await buildMailApk({ buildType })
	} else {
		return await buildCalendarBundle({ buildType })
	}
}
