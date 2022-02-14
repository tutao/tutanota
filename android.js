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
import options from "commander"
import fs from "fs"
import {execFileSync} from "child_process"
import {runDevBuild} from "./buildSrc/DevBuild.js"
import {prepareMobileBuild} from "./buildSrc/prepareMobileBuild.js"
import {buildWebapp} from "./buildSrc/buildWebapp.js"
import {getTutanotaAppVersion, measure} from "./buildSrc/buildUtils.js"
import path from "path"

const log = (...messages) => console.log("\nBUILD:", ...messages, "\n")


options
	.usage('[options] [test|prod|local|host <url>] ')
	.arguments('[stage] [host]')
	.option('-b, --buildtype <type>', 'gradle build type', /^(debugDist|debug|release|releaseTest)$/i, 'release')
	.option('-w --webclient <client>', 'choose web client build', /^(make|dist)$/i, 'dist')
	.action((stage, host, options) => {
		if (!["test", "prod", "local", "host", undefined].includes(stage)
			|| (stage !== "host" && host)
			|| (stage === "host" && !host)) {
			options.outputHelp()
			process.exit(1)
		}

		const {webclient, buildtype} = options

		buildAndroid({
			stage: stage ?? 'prod',
			host: host,
			webClient: webclient,
			buildType: buildtype,
		})
	})

options.parse(process.argv)


async function buildAndroid({stage, host, buildType, webClient}) {
	log(`Starting build with build type: ${buildType}, webclient: ${webClient}, host: ${host}`)

	if (webClient === "make") {
		await runDevBuild({
			stage,
			host,
			desktop: false,
			clean: false,
			watch: false,
			serve: false
		})
	} else {
		const version = await getTutanotaAppVersion()
		await buildWebapp(
			{
				version,
				stage,
				host,
				minify: true,
				projectDir: path.resolve("."),
				measure
			}
		)
	}

	await prepareMobileBuild(webClient)

	try {
		log("cleaning 'build/app-android'")
		await fs.promises.rm("build/app-android", {recursive: true})
	} catch (e) {
		// Ignoring the error if the folder is not there
	}

	log("Starting build: ", buildType)

	const {version} = JSON.parse(await fs.promises.readFile("package.json", "utf8"))
	const apkName = `tutanota-tutao-${buildType}-${version}.apk`
	const apkPath = `app-android/app/build/outputs/apk/tutao/${buildType}/${apkName}`

	runCommand('./gradlew', [`assembleTutao${buildType}`], {
		cwd: './app-android/',
	})

	await fs.promises.mkdir("build/app-android", {recursive: true})

	const outPath = `./build/app-android/${apkName}`
	await fs.promises.rename(apkPath, outPath)

	log(`Build complete. The APK is located at: ${outPath}`)

	// runDevBuild spawns some child processes from the BuildServerClient,
	// ideally we would detach from them inside as needed but for now we just hard exit
	process.exit(0)
}

function runCommand(command, args, options) {
	try {
		log("command:", `${command} ${args.join(" ")}`)
		return execFileSync(command, args, options)
	} catch (e) {
		// original e contains lots of noise. `e.stack` has enough for debugging
		throw new Error(e.stack)
	}
}
