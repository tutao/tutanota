import options from "commander"

import {execFileSync} from "child_process"
import fs from "fs"
import path from "path"
import {prepareMobileBuild} from "./buildSrc/prepareMobileBuild.js"


/**
 * Besides options below this script may require signing parameters passed as environment variables:
 * 'APK_SIGN_ALIAS'
 * 'APK_SIGN_STORE_PASS'
 * 'APK_SIGN_KEY_PASS'
 * 'APK_SIGN_STORE'
 * 'ANDROID_HOME'
 */

options
	.usage('[options] [test|prod|local] ')
	.arguments('<target>')
	.option('-b, --buildtype <type>', 'gradle build type', /^(debugDist|debug|release|releaseTest)$/i, 'release')
	.option('-w --webclient <client>', 'choose web client build', /^(make|dist)$/i, 'dist')
	.parse(process.argv)

const log = (...messages) => console.log("\nBUILD:", ...messages, "\n")

buildAndroid({
	host: options.args[0] || 'prod',
	webClient: options.webclient,
	buildType: options.buildtype,
}).catch(e => {
	console.error(e)
	process.exit(1)
})

async function buildAndroid({host, buildType, webClient}) {
	log(`Starting build with build type: ${buildType}, webclient: ${webClient}, host: ${host}`)

	runCommand('node', [webClient, `${host}`], {
		stdio: [null, process.stdout, process.stderr]
	})

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