import options from "commander"

import {execFileSync} from "child_process"
import {prepareFiles} from "./buildSrc/prepareMobileBuild.js"
import fs from "fs"
import path from "path"


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

const BUILD_TOOLS_V = "28.0.3"
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

	prepareFiles(webClient)

	try {
		log("cleaning 'build/app-android'")
		await fs.promises.rm("build/app-android", {recursive: true})
	} catch (e) {
		// Ignoring the error if the folder is not there
	}

	log("Starting build: ", buildType)

	runCommand('./gradlew', [`assemble${buildType}`], {
		cwd: './app-android/',
	})


	let apkPath

	switch (buildType) {
		case 'debugDist':
			apkPath = 'app/build/outputs/apk/debugDist/app-debugDist.apk'
			break;
		case 'debug':
			apkPath = 'app/build/outputs/apk/debug/app-debug.apk'
			break;
		case 'releaseTest':
			apkPath = 'app/build/outputs/apk/releaseTest/app-releaseTest-unsigned.apk'
			break
		default:
			apkPath = 'app/build/outputs/apk/release/app-release-unsigned.apk'
	}

	const {version} = JSON.parse(await fs.promises.readFile("package.json", "utf8"))

	await fs.promises.mkdir("build/app-android", {recursive: true})

	const outPath = `./build/app-android/tutanota-${version}-${buildType}.apk`
	if (buildType === 'release' || buildType === 'releaseTest') {
		await signAndroidApp({apkPath, outPath})
	} else {
		log("Skipping signing because build was not run as release or releaseTest")
		await fs.promises.rename(path.join("app-android", apkPath), outPath)
	}

	log(`Build complete. The APK is located at: ${outPath}`)
}

async function signAndroidApp({apkPath, outPath}) {

	const keyAlias = getEnv('APK_SIGN_ALIAS')
	const storePass = getEnv('APK_SIGN_STORE_PASS')
	const keyPass = getEnv('APK_SIGN_KEY_PASS')
	const keyStore = getEnv('APK_SIGN_STORE')
	const androidHome = getEnv('ANDROID_HOME')

	// see https://developer.android.com/studio/publish/app-signing#signing-manually
	// jarsigner must be run before zipalign
	runCommand('/opt/jdk1.8.0_112/bin/jarsigner', [
		'-verbose',
		'-strict',
		'-keystore', keyStore,
		'-storepass', storePass,
		'-keypass', keyPass,
		'./app-android/' + apkPath,
		keyAlias
	])

	// Android requires all resources to be aligned for mmap. Must be done.
	runCommand(`${androidHome}/build-tools/${BUILD_TOOLS_V}/zipalign`, [
		'4',
		'app-android/' + apkPath,
		outPath
	])
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

function getEnv(name) {
	if (!(name in process.env)) {
		throw new Error(`${name} is not set`)
	}
	return process.env[name]
}